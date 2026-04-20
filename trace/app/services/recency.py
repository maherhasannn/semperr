"""Score delta tracking vs prior run of same (strategy, company)."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.run import Run
from app.models.score_history import ScoreSnapshot


def snapshot(
    db: Session, *, strategy_id: int, run_id: int, company: str, score: float
) -> ScoreSnapshot:
    """Write a snapshot with delta_from_prev vs most-recent prior run's score."""
    prev = db.execute(
        select(ScoreSnapshot)
        .join(Run, Run.id == ScoreSnapshot.run_id)
        .where(
            ScoreSnapshot.strategy_id == strategy_id,
            ScoreSnapshot.company == company,
            ScoreSnapshot.run_id != run_id,
        )
        .order_by(Run.started_at.desc())
        .limit(1)
    ).scalar_one_or_none()
    prev_score = float(prev.score) if prev else None
    delta = 0.0 if prev_score is None else (score - prev_score)
    snap = ScoreSnapshot(
        strategy_id=strategy_id,
        run_id=run_id,
        company=company,
        score=score,
        delta_from_prev=delta,
    )
    db.add(snap)
    db.flush()
    return snap


def latest_delta(
    db: Session, *, strategy_id: int, run_id: int, company: str
) -> float | None:
    row = db.execute(
        select(ScoreSnapshot).where(
            ScoreSnapshot.strategy_id == strategy_id,
            ScoreSnapshot.run_id == run_id,
            ScoreSnapshot.company == company,
        )
    ).scalar_one_or_none()
    return None if row is None else float(row.delta_from_prev)
