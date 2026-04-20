from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SignalDefIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    weight: float = Field(ge=0.0, le=10.0)
    description: str = Field(default="", max_length=1000)


class SignalDefOut(SignalDefIn):
    id: int
    model_config = ConfigDict(from_attributes=True)


class StrategyIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=4000)
    signals: list[SignalDefIn] = Field(default_factory=list, max_length=64)


class StrategyPatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    signals: list[SignalDefIn] | None = None


class StrategyOut(BaseModel):
    id: int
    name: str
    description: str
    signals: list[SignalDefOut]
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class SuggestSignalsIn(BaseModel):
    description: str = Field(min_length=10, max_length=4000)


class SuggestSignalsOut(BaseModel):
    signals: list[SignalDefIn]
