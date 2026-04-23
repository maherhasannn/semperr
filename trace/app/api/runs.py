"""Runs API — start, list, detail.

Runs the pipeline synchronously inside the request so it completes under the
serverless function's `maxDuration` budget (Vercel Hobby = 60s). Background
tasks aren't viable on serverless — the worker dies when the response is sent.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.deps import require_user
from app.models.result import CompanyResult
from app.models.run import Run, RunStatus
from app.models.score_history import ScoreSnapshot
from app.models.strategy import Strategy
from app.models.user import User
from app.schemas.result import CompanyResultOut, SignalFindingOut
from app.schemas.run import RunStartIn, RunStartOut, RunSummary
from app.services.pipeline import run_pipeline

router = APIRouter(tags=["runs"])


@router.post("/search", response_model=RunStartOut)
async def start_search(
    payload: RunStartIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_user),
) -> RunStartOut:
    strat = db.execute(
        select(Strategy).where(Strategy.id == payload.strategy_id, Strategy.owner_id == user.id)
    ).scalar_one_or_none()
    if strat is None:
        raise HTTPException(status_code=404, detail="strategy not found")
    run = Run(
        strategy_id=strat.id,
        user_id=user.id,
        query_override=payload.query,
        status=RunStatus.pending,
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    run_id = run.id
    # Pipeline opens its own session; commit & release any row locks here first.
    db.commit()
    await run_pipeline(run_id)
    # Re-read final status through our session (pipeline committed in its own).
    db.expire_all()
    final = db.execute(select(Run).where(Run.id == run_id)).scalar_one()
    return RunStartOut(run_id=final.id, status=final.status.value)


@router.get("/runs", response_model=list[RunSummary])
def list_runs(db: Session = Depends(get_db), user: User = Depends(require_user)):
    rows = (
        db.execute(
            select(Run).where(Run.user_id == user.id).order_by(Run.started_at.desc()).limit(50)
        )
        .scalars()
        .all()
    )
    out: list[RunSummary] = []
    for r in rows:
        top = db.execute(
            select(CompanyResult)
            .where(CompanyResult.run_id == r.id)
            .order_by(CompanyResult.score.desc())
            .limit(1)
        ).scalar_one_or_none()
        out.append(
            RunSummary(
                id=r.id,
                strategy_id=r.strategy_id,
                status=r.status.value,
                started_at=r.started_at,
                finished_at=r.finished_at,
                top_company=top.company if top else None,
                top_score=top.score if top else None,
            )
        )
    return out


@router.get("/runs/{run_id}")
def run_detail(
    run_id: int, db: Session = Depends(get_db), user: User = Depends(require_user)
):
    run = db.execute(
        select(Run).where(Run.id == run_id, Run.user_id == user.id)
    ).scalar_one_or_none()
    if run is None:
        raise HTTPException(status_code=404, detail="run not found")
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
    out_results: list[CompanyResultOut] = []
    for r in results:
        delta = db.execute(
            select(ScoreSnapshot.delta_from_prev).where(
                ScoreSnapshot.strategy_id == run.strategy_id,
                ScoreSnapshot.run_id == run.id,
                ScoreSnapshot.company == r.company,
            )
        ).scalar_one_or_none()
        out_results.append(
            CompanyResultOut(
                id=r.id,
                company=r.company,
                score=r.score,
                label=r.label,
                summary=r.summary,
                why_now=r.why_now,
                opportunity_angle=r.opportunity_angle,
                findings=[SignalFindingOut.model_validate(f) for f in r.findings],
                delta_from_prev=delta,
            )
        )
    return {
        "id": run.id,
        "strategy_id": run.strategy_id,
        "status": run.status.value,
        "started_at": run.started_at,
        "finished_at": run.finished_at,
        "error": run.error,
        "results": [o.model_dump(mode="json") for o in out_results],
    }
