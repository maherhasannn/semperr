from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ScorePoint(BaseModel):
    run_id: int
    score: float
    delta_from_prev: float
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class CompanyHistory(BaseModel):
    company: str
    points: list[ScorePoint]
