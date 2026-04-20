"""FastAPI app factory — middleware, CSRF, rate limits, security headers, routers."""
from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, RedirectResponse, Response
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware

from app.api import analyze as analyze_api
from app.api import auth as auth_api
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


def _client_key(request: Request) -> str:
    # Prefer X-Forwarded-For when present (we pass --proxy-headers)
    xf = request.headers.get("x-forwarded-for", "")
    if xf:
        return xf.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _rate_limited(request: Request, bucket: str, *, max_per_min: int) -> bool:
    now = time.time()
    window = 60.0
    key = (_client_key(request), bucket)
    with _RL_LOCK:
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

        # Origin check (defense in depth)
        origin = request.headers.get("origin")
        host = request.headers.get("host", "")
        if origin and host and host not in origin:
            return JSONResponse({"detail": "origin mismatch"}, status_code=403)

        # Allow when both sides match
        if cookie_token and (csrf_equal(cookie_token, header_token) or csrf_equal(cookie_token, form_token)):
            return await call_next(request)

        # For first-time register/login POST, accept when path is one of the auth bootstrap
        # endpoints AND cookie_token matches submitted token.
        path = request.url.path
        allow_bootstrap = path in {
            "/api/auth/login", "/api/auth/register",
            "/login", "/register",
        }
        if allow_bootstrap and cookie_token and (csrf_equal(cookie_token, form_token) or csrf_equal(cookie_token, header_token)):
            return await call_next(request)
        # Bootstrap: if there is NO session cookie AND no csrf cookie yet (first visit POST),
        # let it through for the auth endpoints only. This avoids a chicken-and-egg loop.
        if allow_bootstrap and not cookie_token:
            return await call_next(request)

        log.warning("csrf.reject", path=path, has_cookie=bool(cookie_token))
        return JSONResponse({"detail": "csrf check failed"}, status_code=403)


# ---- Security headers ----

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        # CSP: self + font origins used by dashboard; allow HTMX from unpkg
        response.headers.setdefault(
            "Content-Security-Policy",
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://unpkg.com; "
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
    _SEED_PREFIXES = ("/login", "/register", "/dashboard", "/strategies",
                      "/runs", "/companies")

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        p = request.url.path
        if request.method == "GET" and (p in {"/login", "/register"} or
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
    app.include_router(auth_api.router, prefix="/api")
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
                return RedirectResponse("/login", status_code=302)
        response = await call_next(request)
        return response

    @app.exception_handler(RequestValidationError)
    async def _val_err(request: Request, exc: RequestValidationError):
        return JSONResponse({"detail": exc.errors()}, status_code=status.HTTP_400_BAD_REQUEST)

    # Rate limits (in-process, per-client window)
    @app.middleware("http")
    async def _rl(request: Request, call_next):
        p = request.url.path
        if (p.startswith("/api/auth/") or p in {"/login", "/register"}):
            if request.method == "POST" and _rate_limited(request, "auth", max_per_min=5):
                return JSONResponse({"detail": "rate limit"}, status_code=429)
        elif p == "/api/search" and request.method == "POST":
            if _rate_limited(request, "search", max_per_min=10):
                return JSONResponse({"detail": "rate limit"}, status_code=429)
        return await call_next(request)

    return app


app = create_app()
