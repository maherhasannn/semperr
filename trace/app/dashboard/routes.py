"""Jinja + HTMX dashboard routes. All POSTs CSRF-checked at middleware."""
from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, Form, HTTPException, Request, Response, status
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.deps import CSRF_COOKIE, SESSION_COOKIE, current_user, require_user
from app.models.result import CompanyResult
from app.models.run import Run, RunStatus
from app.models.score_history import ScoreSnapshot
from app.models.strategy import SignalDef, Strategy
from app.models.user import User
from app.schemas.auth import RegisterIn
from app.security import (
    hash_password,
    issue_session_token,
    new_csrf_token,
    verify_password,
)
from app.services.llm import GeminiClient
from app.services.normalizer import CANONICAL
from app.services.pipeline import run_pipeline

_TPL_DIR = Path(__file__).parent / "templates"
templates = Jinja2Templates(directory=str(_TPL_DIR))
templates.env.autoescape = True

router = APIRouter(prefix="/trace", tags=["dashboard"])


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


# ---- Auth pages ----

@router.get("", response_class=HTMLResponse)
def root(request: Request, user: User | None = Depends(current_user)) -> Response:
    if user is None:
        return RedirectResponse("/trace/login", status_code=302)
    return RedirectResponse("/trace/dashboard", status_code=302)


@router.get("/login", response_class=HTMLResponse)
def login_page(request: Request, user: User | None = Depends(current_user)) -> Response:
    if user is not None:
        return RedirectResponse("/trace/dashboard", status_code=302)
    return templates.TemplateResponse("login.html", _ctx(request))


@router.post("/login", response_class=HTMLResponse)
def login_submit(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
) -> Response:
    user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if user is None or not verify_password(user.password_hash, password):
        return templates.TemplateResponse(
            "login.html",
            _ctx(request, error="invalid credentials"),
            status_code=401,
        )
    resp = RedirectResponse("/trace/dashboard", status_code=303)
    _set_session(resp, user.id, request)
    return resp


@router.get("/register", response_class=HTMLResponse)
def register_page(request: Request, user: User | None = Depends(current_user)) -> Response:
    if user is not None:
        return RedirectResponse("/trace/dashboard", status_code=302)
    return templates.TemplateResponse("register.html", _ctx(request))


@router.post("/register", response_class=HTMLResponse)
def register_submit(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    invite_code: str = Form(...),
    db: Session = Depends(get_db),
) -> Response:
    try:
        payload = RegisterIn(email=email, password=password, invite_code=invite_code)
    except Exception as e:
        return templates.TemplateResponse(
            "register.html", _ctx(request, error=str(e)), status_code=400
        )
    from app.config import get_settings

    if payload.invite_code != get_settings().invite_code:
        return templates.TemplateResponse(
            "register.html", _ctx(request, error="invalid invite code"), status_code=403
        )
    if db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none():
        return templates.TemplateResponse(
            "register.html", _ctx(request, error="email already registered"), status_code=409
        )
    user = User(email=str(payload.email), password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    resp = RedirectResponse("/trace/dashboard", status_code=303)
    _set_session(resp, user.id, request)
    return resp


@router.post("/logout")
def logout(request: Request) -> Response:
    resp = RedirectResponse("/trace/login", status_code=303)
    resp.delete_cookie(SESSION_COOKIE, path="/")
    resp.delete_cookie(CSRF_COOKIE, path="/")
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
    return RedirectResponse(f"/trace/strategies/{strat.id}", status_code=303)


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
    return RedirectResponse(f"/trace/strategies/{strat.id}", status_code=303)


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
    return RedirectResponse(f"/trace/runs/{run_id}", status_code=303)


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
    company: str,
    request: Request,
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
