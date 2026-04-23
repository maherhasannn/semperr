from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RunStartIn(BaseModel):
    strategy_id: int
    query: str | None = Field(default=None, max_length=500)


class RunStartOut(BaseModel):
    run_id: int
    status: str


class RunSummary(BaseModel):
    id: int
    strategy_id: int
    status: str
    started_at: datetime
    finished_at: datetime | None
    top_company: str | None = None
    top_score: float | None = None
    model_config = ConfigDict(from_attributes=True)
