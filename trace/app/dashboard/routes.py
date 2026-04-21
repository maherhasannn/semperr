"""Jinja + HTMX dashboard routes. All POSTs CSRF-checked at middleware."""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from typing import Annotated

from fastapi import APIRouter, Depends, Form, HTTPException, Request, Response, status
from fastapi import Path as PathParam
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.auth.invite import (
    INVITE_COOKIE,
    INVITE_MAX_AGE_SECONDS,
    issue_invite_cookie,
    verify_invite_cookie,
)
from app.auth.neon import (
    NeonAuthClient,
    NeonAuthInvalidToken,
    NeonAuthJWKSUnavailable,
    consume_token_once,
)
from app.config import get_settings
from app.database import get_db
from app.deps import CSRF_COOKIE, SESSION_COOKIE, current_user, require_user
from app.models.result import CompanyResult
from app.models.run import Run, RunStatus
from app.models.score_history import ScoreSnapshot
from app.models.strategy import SignalDef, Strategy
from app.models.user import User
from app.security import csrf_equal, issue_session_token, new_csrf_token
from app.services.llm import GeminiClient
from app.services.normalizer import CANONICAL
from app.services.pipeline import run_pipeline

_TPL_DIR = Path(__file__).parent / "templates"
templates = Jinja2Templates(directory=str(_TPL_DIR))
templates.env.autoescape = True

router = APIRouter(tags=["dashboard"])


def _ctx(request: Request, user: User | None = None, **extra) -> dict:
    return {
        "request": request,
        "user": user,
        "csrf_token": request.cookies.get(CSRF_COOKIE, ""),
        "canonical_signals": CANONICAL,
        **extra,
    }


def _set_session(resp: Response, user_id: int, request: Request) -> None:
    from app.config import get_settings

    s = get_settings()
    resp.set_cookie(
        SESSION_COOKIE,
        issue_session_token(user_id),
        max_age=s.session_max_age_seconds,
        httponly=True,
        secure=(s.env == "prod"),
        samesite="lax",
        path="/",
    )
    resp.set_cookie(
        CSRF_COOKIE,
        new_csrf_token(),
        max_age=s.session_max_age_seconds,
        httponly=False,
        secure=(s.env == "prod"),
        samesite="lax",
        path="/",
    )


# ---- Auth pages (invite gate + Neon Auth callback) ----

def _set_invite_cookie(resp: Response, token: str) -> None:
    s = get_settings()
    resp.set_cookie(
        INVITE_COOKIE,
        token,
        max_age=INVITE_MAX_AGE_SECONDS,
        httponly=True,
        secure=(s.env == "prod"),
        samesite="lax",
        path="/",
    )


@router.get("/invite", response_class=HTMLResponse)
def invite_page(request: Request, user: User | None = Depends(current_user)) -> Response:
    if user is not None:
        return RedirectResponse("/dashboard", status_code=302)
    return templates.TemplateResponse("invite.html", _ctx(request))


@router.post("/invite", response_class=HTMLResponse)
def invite_submit(
    request: Request,
    email: str = Form(...),
    invite_code: str = Form(...),
) -> Response:
    s = get_settings()
    email = (email or "").strip().lower()
    if not email or "@" not in email:
        return templates.TemplateResponse(
            "invite.html",
            _ctx(request, error="valid email required", email=email),
            status_code=400,
        )
    # Constant-time compare to foreclose timing side-channels on the invite code.
    if not csrf_equal(invite_code, s.invite_code):
        return templates.TemplateResponse(
            "invite.html",
            _ctx(request, error="invalid invite code", email=email),
            status_code=403,
        )
    callback = str(request.url_for("auth_callback"))
    neon = NeonAuthClient(s)
    resp = RedirectResponse(
        neon.sign_in_url(return_to=callback, email=email),
        status_code=303,
    )
    _set_invite_cookie(resp, issue_invite_cookie(email))
    return resp


def _harden_callback_response(resp: Response) -> Response:
    """The callback URL carries a bearer token in its query string. Prevent
    the browser from caching the page, replaying it from bfcache, or leaking
    the URL via the Referer header of any sub-resource or subsequent nav."""
    resp.headers["Cache-Control"] = "no-store, no-cache, max-age=0, must-revalidate"
    resp.headers["Pragma"] = "no-cache"
    resp.headers["Referrer-Policy"] = "no-referrer"
    return resp


@router.get("/auth/callback", response_class=HTMLResponse, name="auth_callback")
def auth_callback(
    request: Request,
    db: Session = Depends(get_db),
) -> Response:
    # Closed-beta gate: the invite cookie proves they passed /invite on our side.
    invite = verify_invite_cookie(request.cookies.get(INVITE_COOKIE))
    if invite is None:
        return _harden_callback_response(
            templates.TemplateResponse(
                "auth_error.html",
                _ctx(request, message="Invite session expired. Please start again."),
                status_code=403,
            )
        )

    token = request.query_params.get("token") or request.query_params.get("access_token")
    if not token:
        return _harden_callback_response(
            templates.TemplateResponse(
                "auth_error.html",
                _ctx(request, message="Missing sign-in token."),
                status_code=401,
            )
        )

    neon = NeonAuthClient(get_settings())
    try:
        claims = neon.verify_jwt(token)
    except NeonAuthJWKSUnavailable:
        return _harden_callback_response(
            templates.TemplateResponse(
                "auth_error.html",
                _ctx(request, message="Auth provider temporarily unreachable. Try again."),
                status_code=503,
            )
        )
    except NeonAuthInvalidToken:
        return _harden_callback_response(
            templates.TemplateResponse(
                "auth_error.html",
                _ctx(request, message="Sign-in link invalid or expired."),
                status_code=401,
            )
        )

    # Replay defense: a bearer token in a URL lives forever in edge/CDN logs,
    # browser history, and potentially Referer headers. Accept each verified
    # token exactly once — any re-presentation of the same token (even within
    # its `exp` window) is rejected as invalid.
    if not consume_token_once(token, claims.exp):
        return _harden_callback_response(
            templates.TemplateResponse(
                "auth_error.html",
                _ctx(request, message="Sign-in link already used."),
                status_code=401,
            )
        )

    # Login-CSRF defense: the JWT email must match the invite cookie's email.
    # Otherwise an attacker with their own valid Neon JWT could bait a victim
    # (who just passed /invite) into signing into the attacker's account.
    invite_email = str(invite.get("email", "")).strip().lower()
    jwt_email = claims.email.strip().lower()
    if not invite_email or invite_email != jwt_email:
        return _harden_callback_response(
            templates.TemplateResponse(
                "auth_error.html",
                _ctx(
                    request,
                    message="Sign-in identity did not match the invited email.",
                ),
                status_code=403,
            )
        )

    # Upsert by Neon Auth user UUID. Email may change; auth_user_id is the stable key.
    user = db.execute(
        select(User).where(User.auth_user_id == claims.sub)
    ).scalar_one_or_none()
    if user is None:
        user = User(
            email=claims.email,
            auth_user_id=claims.sub,
            email_verified_at=datetime.now(tz=timezone.utc),
        )
        db.add(user)
    else:
        user.email = claims.email
        user.email_verified_at = datetime.now(tz=timezone.utc)
    db.commit()
    db.refresh(user)

    resp = RedirectResponse("/dashboard", status_code=303)
    resp.delete_cookie(INVITE_COOKIE, path="/")
    _set_session(resp, user.id, request)
    return _harden_callback_response(resp)


@router.post("/logout")
def logout(request: Request) -> Response:
    s = get_settings()
    neon = NeonAuthClient(s)
    invite_url = str(request.url_for("invite_page"))
    resp = RedirectResponse(neon.sign_out_url(return_to=invite_url), status_code=303)
    resp.delete_cookie(SESSION_COOKIE, path="/")
    resp.delete_cookie(CSRF_COOKIE, path="/")
    resp.delete_cookie(INVITE_COOKIE, path="/")
    return resp


# ---- Strategies ----

@router.get("/dashboard", response_class=HTMLResponse)
def strategies_list(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_user),
) -> Response:
    strats = (
        db.execute(
            select(Strategy)
            .where(Strategy.owner_id == user.id)
            .options(selectinload(Strategy.signals))
            .order_by(Strategy.updated_at.desc())
        )
        .scalars()
        .all()
    )
    # enrich with last run + top score
    rows = []
    for s in strats:
        last = db.execute(
            select(Run).where(Run.strategy_id == s.id).order_by(Run.started_at.desc()).limit(1)
        ).scalar_one_or_none()
        top_score = None
        if last is not None:
            top = db.execute(
                select(CompanyResult)
                .where(CompanyResult.run_id == last.id)
                .order_by(CompanyResult.score.desc())
                .limit(1)
            ).scalar_one_or_none()
            top_score = top.score if top else None
        rows.append({"strategy": s, "last_run": last, "top_score": top_score})
    return templates.TemplateResponse(
        "strategies/list.html", _ctx(request, user=user, rows=rows)
    )


@router.get("/strategies/new", response_class=HTMLResponse)
def strategy_new(
    request: Request, user: User = Depends(require_user)
) -> Response:
    return templates.TemplateResponse(
        "strategies/form.html", _ctx(request, user=user, strategy=None)
    )


@router.post("/strategies/new", response_class=HTMLResponse)
def strategy_create(
    request: Request,
    name: str = Form(...),
    description: str = Form(""),
    db: Session = Depends(get_db),
    user: User = Depends(require_user),
) -> Response:
    if not name.strip():
        return templates.TemplateResponse(
            "strategies/form.html",
            _ctx(request, user=user, strategy=None, error="name required"),
            status_code=400,
        )
    strat = Strategy(owner_id=user.id, name=name.strip()[:200], description=description[:4000])
    db.add(strat)
    db.commit()
    db.refresh(strat)
    return RedirectResponse(f"/strategies/{strat.id}", status_code=303)


def _load_owned_strategy(db: Session, user: User, strategy_id: int) -> Strategy:
    strat = db.execute(
        select(Strategy)
        .where(Strategy.id == strategy_id, Strategy.owner_id == user.id)
        .options(selectinload(Strategy.signals))
    ).scalar_one_or_none()
    if strat is None:
        raise HTTPException(status_code=404, detail="not found")
    return strat


@router.get("/strategies/{strategy_id}", response_class=HTMLResponse)
def strategy_detail(
    strategy_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_user),
) -> Response:
    strat = _load_owned_strategy(db, user, strategy_id)
    runs = (
        db.execute(
            select(Run)
            .where(Run.strategy_id == strat.id)
            .order_by(Run.started_at.desc())
            .limit(20)
        )
        .scalars()
        .all()
    )
    return templates.TemplateResponse(
        "strategies/detail.html", _ctx(request, user=user, strategy=strat, runs=runs)
    )


@router.post("/strategies/{strategy_id}/save-signals", response_class=HTMLResponse)
async def strategy_save_signals(
    strategy_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_user),
) -> Response:
    # Posted as repeated form fields: sig_name, sig_weight, sig_desc
    form = await request.form()
    names = form.getlist("sig_name")
    weights = form.getlist("sig_weight")
    descs = form.getlist("sig_desc")
    strat = _load_owned_strategy(db, user, strategy_id)
    strat.signals.clear()
    db.flush()
    for n, w, d in zip(names, weights, descs):
        n = (n or "").strip()[:120]
        if not n:
            continue
        try:
            wf = float(w)
        except Exception:
            wf = 1.0
        strat.signals.append(
            SignalDef(name=n, weight=max(0.0, min(10.0, wf)), description=(d or "")[:1000])
        )
    db.commit()
    return RedirectResponse(f"/strategies/{strat.id}", status_code=303)


@router.post("/strategies/{strategy_id}/suggest-signals", response_class=HTMLResponse)
async def strategy_suggest(
    strategy_id: int,
    request: Request,
    description: str = Form(""),
    db: Session = Depends(get_db),
    user: User = Depends(require_user),
) -> Response:
    strat = _load_owned_strategy(db, user, strategy_id)
    desc = description.strip() or strat.description or strat.name
    client = GeminiClient()
    from pydantic import BaseModel, Field

    from app.api.strategies import SUGGEST_SYSTEM
    from app.schemas.strategy import SignalDefIn

    class _Out(BaseModel):
        signals: list[SignalDefIn] = Field(default_factory=list, max_length=16)

    try:
        out = await client.generate_json(SUGGEST_SYSTEM, desc, _Out)
        sigs = [s for s in out.signals if s.name in CANONICAL]
    except Exception:
        sigs = []
    return templates.TemplateResponse(
        "strategies/_suggested_rows.html", _ctx(request, user=user, suggested=sigs)
    )


@router.post("/strategies/{strategy_id}/run")
async def strategy_run(
    strategy_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_user),
) -> Response:
    """Run the pipeline synchronously (serverless-friendly). Redirect on completion."""
    strat = _load_owned_strategy(db, user, strategy_id)
    run = Run(strategy_id=strat.id, user_id=user.id, status=RunStatus.pending)
    db.add(run)
    db.commit()
    db.refresh(run)
    run_id = run.id
    await run_pipeline(run_id)
    return RedirectResponse(f"/runs/{run_id}", status_code=303)


# ---- Runs ----

@router.get("/runs", response_class=HTMLResponse)
def runs_list(
    request: Request, db: Session = Depends(get_db), user: User = Depends(require_user)
) -> Response:
    rows = (
        db.execute(
            select(Run).where(Run.user_id == user.id).order_by(Run.started_at.desc()).limit(100)
        )
        .scalars()
        .all()
    )
    enriched = []
    for r in rows:
        top = db.execute(
            select(CompanyResult)
            .where(CompanyResult.run_id == r.id)
            .order_by(CompanyResult.score.desc())
            .limit(1)
        ).scalar_one_or_none()
        enriched.append({"run": r, "top": top})
    return templates.TemplateResponse("runs/list.html", _ctx(request, user=user, rows=enriched))


@router.get("/runs/{run_id}", response_class=HTMLResponse)
def run_detail_page(
    run_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_user),
) -> Response:
    run = db.execute(
        select(Run).where(Run.id == run_id, Run.user_id == user.id)
    ).scalar_one_or_none()
    if run is None:
        raise HTTPException(status_code=404)
    results = (
        db.execute(
            select(CompanyResult)
            .where(CompanyResult.run_id == run.id)
            .options(selectinload(CompanyResult.findings))
            .order_by(CompanyResult.score.desc())
        )
        .scalars()
        .all()
    )
    deltas = {
        row.company: row.delta_from_prev
        for row in db.execute(
            select(ScoreSnapshot).where(ScoreSnapshot.run_id == run.id)
        ).scalars()
    }
    return templates.TemplateResponse(
        "runs/detail.html",
        _ctx(request, user=user, run=run, results=results, deltas=deltas),
    )


@router.get("/runs/{run_id}/status", response_class=HTMLResponse)
def run_status_fragment(
    run_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_user),
) -> Response:
    run = db.execute(
        select(Run).where(Run.id == run_id, Run.user_id == user.id)
    ).scalar_one_or_none()
    if run is None:
        raise HTTPException(status_code=404)
    return templates.TemplateResponse(
        "partials/run_status.html", _ctx(request, user=user, run=run)
    )


# ---- Company detail ----

@router.get("/companies/{company}", response_class=HTMLResponse)
def company_detail(
    request: Request,
    # Bound length and restrict to printable, company-name-like characters.
    # Aggregator upstream writes names via `_canon_company`, which produces
    # a conservative set: ascii letters/digits/`& - . , ' ` plus spaces.
    company: Annotated[
        str,
        PathParam(
            min_length=1,
            max_length=200,
            pattern=r"^[A-Za-z0-9][A-Za-z0-9 .,'&\-]{0,199}$",
        ),
    ],
    db: Session = Depends(get_db),
    user: User = Depends(require_user),
) -> Response:
    # Simple history across all strategies owned by this user
    snaps = (
        db.execute(
            select(ScoreSnapshot)
            .join(Strategy, Strategy.id == ScoreSnapshot.strategy_id)
            .where(Strategy.owner_id == user.id, ScoreSnapshot.company == company)
            .order_by(ScoreSnapshot.created_at.asc())
        )
        .scalars()
        .all()
    )
    return templates.TemplateResponse(
        "companies/detail.html",
        _ctx(request, user=user, company=company, snaps=snaps),
    )
