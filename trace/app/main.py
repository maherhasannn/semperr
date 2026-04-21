"""FastAPI app factory — middleware, CSRF, rate limits, security headers, routers."""
from __future__ import annotations

from pathlib import Path
from urllib.parse import urlsplit

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, RedirectResponse, Response
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware

from app.api import analyze as analyze_api
from app.api import runs as runs_api
from app.api import strategies as strategies_api
from app.config import get_settings
from app.dashboard import routes as dashboard_routes
from app.deps import CSRF_COOKIE, CSRF_HEADER, CSRF_FORM_FIELD
from app.logging import configure_logging, get_logger
from app.security import csrf_equal

log = get_logger(__name__)

# ---- Minimal in-process rate limiter: N requests / 60s, keyed by client+bucket ----

import threading
import time

_RL_LOCK = threading.Lock()
_RL_STATE: dict[tuple[str, str], list[float]] = {}
# Hard cap on distinct (client, bucket) keys held in memory. Beyond this we
# evict the oldest entries. ~10k keys × 10 timestamps × 8 bytes ≈ 1 MB.
_RL_MAX_KEYS = 10_000
# Last time the sweeper ran (monotonic-ish; time.time is fine for seconds).
_RL_LAST_SWEEP: list[float] = [0.0]
_RL_SWEEP_INTERVAL = 30.0


def _client_key(request: Request) -> str:
    """Resolve the client identity for per-client rate limiting.

    X-Forwarded-For is entirely attacker-controlled unless the app knows how
    many trusted hops prepended it. We walk (hops) entries in from the right
    — that is, past our own trusted edge — and take that address as the
    client. When hops == 0 we ignore XFF altogether and use the TCP peer,
    which the client cannot spoof.
    """
    hops = max(0, get_settings().trusted_proxy_hops)
    if hops > 0:
        xf = request.headers.get("x-forwarded-for", "")
        if xf:
            parts = [p.strip() for p in xf.split(",") if p.strip()]
            # For hops=1 we want parts[-1] (the single IP our edge inserted
            # was the client). For hops=N we step N in from the right, which
            # is the leftmost entry our own infra is responsible for.
            idx = len(parts) - hops
            if 0 <= idx < len(parts):
                return parts[idx]
            # XFF shorter than expected — fall through to the TCP peer
            # rather than accepting a spoofable leftmost value.
    return request.client.host if request.client else "unknown"


def _rl_sweep(now: float, window: float) -> None:
    """Drop buckets whose last hit is older than the window, then enforce cap.

    Must be called under `_RL_LOCK`.
    """
    cutoff = now - window
    stale = [k for k, hist in _RL_STATE.items() if not hist or hist[-1] < cutoff]
    for k in stale:
        _RL_STATE.pop(k, None)
    if len(_RL_STATE) > _RL_MAX_KEYS:
        # Evict oldest-last-seen first until under the cap.
        ordered = sorted(
            _RL_STATE.items(),
            key=lambda kv: (kv[1][-1] if kv[1] else 0.0),
        )
        drop_n = len(_RL_STATE) - _RL_MAX_KEYS
        for k, _ in ordered[:drop_n]:
            _RL_STATE.pop(k, None)


def _rate_limited(request: Request, bucket: str, *, max_per_min: int) -> bool:
    now = time.time()
    window = 60.0
    key = (_client_key(request), bucket)
    with _RL_LOCK:
        if (
            now - _RL_LAST_SWEEP[0] > _RL_SWEEP_INTERVAL
            or len(_RL_STATE) > _RL_MAX_KEYS
        ):
            _rl_sweep(now, window)
            _RL_LAST_SWEEP[0] = now
        hist = _RL_STATE.get(key, [])
        hist = [t for t in hist if now - t < window]
        if len(hist) >= max_per_min:
            _RL_STATE[key] = hist
            return True
        hist.append(now)
        _RL_STATE[key] = hist
        return False


# ---- CSRF middleware (double-submit token) ----

class CSRFMiddleware(BaseHTTPMiddleware):
    SAFE = {"GET", "HEAD", "OPTIONS", "TRACE"}
    # Exempt JSON API routes that don't use cookies for state change? No — they share cookie;
    # require CSRF on all state-changing requests from browser.

    async def dispatch(self, request: Request, call_next):
        if request.method in self.SAFE:
            return await call_next(request)
        # Only enforce when a session cookie is present (anonymous login/register POSTs still
        # require a csrf cookie, set by GET of the login page — but initial registration is
        # permitted without prior session; we issue a csrf cookie on the GET page.)
        cookie_token = request.cookies.get(CSRF_COOKIE)
        header_token = request.headers.get(CSRF_HEADER)
        form_token: str | None = None
        # Best-effort form parse without consuming body for JSON
        ct = request.headers.get("content-type", "")
        if "application/x-www-form-urlencoded" in ct or "multipart/form-data" in ct:
            # Read + rebuild the body so downstream can still parse it.
            body = await request.body()

            async def receive():
                return {"type": "http.request", "body": body, "more_body": False}

            request._receive = receive  # type: ignore[attr-defined]
            try:
                form = await request.form()
                form_token = form.get(CSRF_FORM_FIELD)  # type: ignore[assignment]
            except Exception:
                form_token = None

        # Origin/Referer enforcement. State-changing requests must carry one
        # of Origin or Referer and its host must match Host *exactly*
        # (substring matching would wrongly accept
        # `https://trace.semperr.com.evil.com`). If neither header is present
        # we reject — modern browsers always set Origin on non-GET, so
        # absence indicates a non-browser client or a stripped proxy.
        origin = request.headers.get("origin")
        referer = request.headers.get("referer")
        host = request.headers.get("host", "")
        if not host:
            return JSONResponse({"detail": "host header required"}, status_code=400)

        source_host: str | None = None
        if origin:
            try:
                source_host = urlsplit(origin).netloc
            except Exception:
                return JSONResponse({"detail": "invalid origin"}, status_code=403)
        elif referer:
            try:
                source_host = urlsplit(referer).netloc
            except Exception:
                return JSONResponse({"detail": "invalid referer"}, status_code=403)

        if source_host is None:
            log.warning("csrf.reject_no_origin", path=request.url.path)
            return JSONResponse(
                {"detail": "origin or referer required"}, status_code=403
            )
        if source_host != host:
            return JSONResponse({"detail": "origin mismatch"}, status_code=403)

        # Token must be present in a cookie AND a matching value must be
        # echoed in either the header or the form field (double-submit).
        # There is no bootstrap bypass: every state-changing request — /invite
        # included — must carry the cookie. CSRFBootstrapMiddleware seeds it
        # on every GET of the auth pages, so any legitimate browser flow has
        # already obtained one before POSTing. A POST without the cookie is
        # either a client that skipped the form (non-browser tooling) or a
        # cross-site request from a context where cookies were not sent;
        # both should be rejected rather than implicitly trusted.
        if cookie_token and (
            csrf_equal(cookie_token, header_token)
            or csrf_equal(cookie_token, form_token)
        ):
            return await call_next(request)

        log.warning("csrf.reject", path=request.url.path, has_cookie=bool(cookie_token))
        return JSONResponse({"detail": "csrf check failed"}, status_code=403)


# ---- Security headers ----

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        # CSP: self + font origins used by dashboard; allow HTMX from a
        # specific pinned path on unpkg (SRI on the <script> tag pins the
        # exact bytes). No `'unsafe-inline'` on script-src — all dashboard
        # JS is bundled in /static/trace.js and wired with event delegation
        # so no inline `<script>` or `onclick=` handlers exist.
        response.headers.setdefault(
            "Content-Security-Policy",
            "default-src 'self'; "
            "script-src 'self' https://unpkg.com/htmx.org@2.0.3/dist/htmx.min.js; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data:; "
            "connect-src 'self'; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self'"
        )
        return response


# ---- Ensure CSRF cookie is present on GET to auth pages ----

class CSRFBootstrapMiddleware(BaseHTTPMiddleware):
    # Paths that need a CSRF cookie seeded on GET (dashboard HTML pages).
    _SEED_PREFIXES = ("/invite", "/auth/callback", "/dashboard", "/strategies",
                      "/runs", "/companies")

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        p = request.url.path
        if request.method == "GET" and (p in {"/invite", "/auth/callback"} or
                                         any(p.startswith(pref) for pref in self._SEED_PREFIXES)):
            from app.security import new_csrf_token

            if not request.cookies.get(CSRF_COOKIE):
                s = get_settings()
                response.set_cookie(
                    CSRF_COOKIE,
                    new_csrf_token(),
                    max_age=s.session_max_age_seconds,
                    httponly=False,
                    secure=(s.env == "prod"),
                    samesite="lax",
                    path="/",
                )
        return response


def create_app() -> FastAPI:
    configure_logging()
    app = FastAPI(title="Trace", version="0.1.0", docs_url=None, redoc_url=None, openapi_url=None)

    # Order matters — first added is outermost
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(CSRFBootstrapMiddleware)
    app.add_middleware(CSRFMiddleware)

    # Static
    static_dir = Path(__file__).parent / "dashboard" / "static"
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

    # API (JSON) — prefixed with /api so it doesn't shadow dashboard HTML routes.
    app.include_router(strategies_api.router, prefix="/api")
    app.include_router(runs_api.router, prefix="/api")
    app.include_router(analyze_api.router, prefix="/api")

    # Dashboard
    app.include_router(dashboard_routes.router)

    @app.get("/", include_in_schema=False)
    def index():
        return RedirectResponse("/dashboard", status_code=302)

    @app.get("/health", include_in_schema=False)
    def health():
        return {"status": "ok"}

    # Dashboard auth gate: redirect to login when no session
    _GATED_PREFIXES = ("/dashboard", "/strategies", "/runs", "/companies")

    @app.middleware("http")
    async def _dashboard_auth_gate(request: Request, call_next):
        path = request.url.path
        if any(path.startswith(pref) for pref in _GATED_PREFIXES):
            # let the route dependencies handle it, BUT we want HTML 302 instead of 401
            # We duplicate the session check cheaply.
            from app.security import verify_session_token

            token = request.cookies.get("trace_session")
            uid = verify_session_token(token) if token else None
            if uid is None:
                return RedirectResponse("/invite", status_code=302)
        response = await call_next(request)
        return response

    @app.exception_handler(RequestValidationError)
    async def _val_err(request: Request, exc: RequestValidationError):
        return JSONResponse({"detail": exc.errors()}, status_code=status.HTTP_400_BAD_REQUEST)

    # Rate limits (in-process, per-client window). Neon Auth throttles magic-link
    # dispatch upstream, but the /invite POST is entirely local (validates the
    # invite code on our side), so we still cap it to defeat invite-code brute-
    # force. 10/min keeps the search endpoint honest too.
    @app.middleware("http")
    async def _rl(request: Request, call_next):
        p = request.url.path
        if p == "/invite" and request.method == "POST":
            if _rate_limited(request, "invite", max_per_min=5):
                return JSONResponse({"detail": "rate limit"}, status_code=429)
        elif p == "/api/search" and request.method == "POST":
            if _rate_limited(request, "search", max_per_min=10):
                return JSONResponse({"detail": "rate limit"}, status_code=429)
        return await call_next(request)

    return app


app = create_app()
