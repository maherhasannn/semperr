"""Strategy CRUD + LLM signal suggestions."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.deps import require_user
from app.models.strategy import SignalDef, Strategy
from app.models.user import User
from app.schemas.strategy import (
    StrategyIn,
    StrategyOut,
    StrategyPatch,
    SuggestSignalsIn,
    SuggestSignalsOut,
)
from app.services.llm import GeminiClient
from app.services.normalizer import CANONICAL

router = APIRouter(prefix="/strategies", tags=["strategies"])


@router.get("", response_model=list[StrategyOut])
def list_strategies(db: Session = Depends(get_db), user: User = Depends(require_user)):
    rows = (
        db.execute(
            select(Strategy)
            .where(Strategy.owner_id == user.id)
            .options(selectinload(Strategy.signals))
            .order_by(Strategy.updated_at.desc())
        )
        .scalars()
        .all()
    )
    return rows


@router.post("", response_model=StrategyOut, status_code=status.HTTP_201_CREATED)
def create_strategy(
    payload: StrategyIn, db: Session = Depends(get_db), user: User = Depends(require_user)
):
    strat = Strategy(owner_id=user.id, name=payload.name, description=payload.description)
    for s in payload.signals:
        strat.signals.append(
            SignalDef(name=s.name, weight=s.weight, description=s.description)
        )
    db.add(strat)
    db.commit()
    db.refresh(strat)
    return strat


def _load_owned(db: Session, user: User, strategy_id: int) -> Strategy:
    strat = db.execute(
        select(Strategy)
        .where(Strategy.id == strategy_id, Strategy.owner_id == user.id)
        .options(selectinload(Strategy.signals))
    ).scalar_one_or_none()
    if strat is None:
        raise HTTPException(status_code=404, detail="strategy not found")
    return strat


@router.get("/{strategy_id}", response_model=StrategyOut)
def get_strategy(
    strategy_id: int, db: Session = Depends(get_db), user: User = Depends(require_user)
):
    return _load_owned(db, user, strategy_id)


@router.patch("/{strategy_id}", response_model=StrategyOut)
def patch_strategy(
    strategy_id: int,
    payload: StrategyPatch,
    db: Session = Depends(get_db),
    user: User = Depends(require_user),
):
    strat = _load_owned(db, user, strategy_id)
    if payload.name is not None:
        strat.name = payload.name
    if payload.description is not None:
        strat.description = payload.description
    if payload.signals is not None:
        strat.signals.clear()
        db.flush()
        for s in payload.signals:
            strat.signals.append(
                SignalDef(name=s.name, weight=s.weight, description=s.description)
            )
    db.commit()
    db.refresh(strat)
    return strat


@router.delete("/{strategy_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_strategy(
    strategy_id: int, db: Session = Depends(get_db), user: User = Depends(require_user)
):
    strat = _load_owned(db, user, strategy_id)
    db.delete(strat)
    db.commit()


class _SuggestInternal(BaseModel):
    signals: list[dict] = Field(default_factory=list)


SUGGEST_SYSTEM = (
    "You are a private-credit analyst. Given a short strategy description, propose 4-8 "
    "distress/opportunity signals to track. Each has a canonical name from this closed "
    f"vocabulary: {', '.join(CANONICAL)}. Assign weight 0.5-3.0 based on importance. "
    "Return JSON: {\"signals\": [{\"name\": str, \"weight\": float, \"description\": str}]}."
)


@router.post("/{strategy_id}/suggest-signals", response_model=SuggestSignalsOut)
async def suggest_signals(
    strategy_id: int,
    payload: SuggestSignalsIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_user),
):
    _load_owned(db, user, strategy_id)  # ownership check
    client = GeminiClient()
    from app.schemas.strategy import SignalDefIn

    class _Out(BaseModel):
        signals: list[SignalDefIn] = Field(default_factory=list, max_length=16)

    try:
        out = await client.generate_json(SUGGEST_SYSTEM, payload.description, _Out)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"llm suggestion failed: {e}")
    # Filter to canonical vocab, cap weights defensively
    cleaned = [
        SignalDefIn(name=s.name, weight=min(3.0, max(0.0, s.weight)), description=s.description[:500])
        for s in out.signals
        if s.name in CANONICAL
    ]
    return SuggestSignalsOut(signals=cleaned)
