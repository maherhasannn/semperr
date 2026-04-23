from __future__ import annotations

from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class SignalFindingOut(BaseModel):
    signal_type: str
    raw_phrase: str
    confidence: float
    event_date: date | None = None
    source_url: str = ""
    raw_text: str = ""
    weight_applied: float = 0.0
    model_config = ConfigDict(from_attributes=True)


class CompanyResultOut(BaseModel):
    id: int
    company: str
    score: float
    label: str
    summary: str
    why_now: str
    opportunity_angle: str
    findings: list[SignalFindingOut] = Field(default_factory=list)
    delta_from_prev: float | None = None
    model_config = ConfigDict(from_attributes=True)


# LLM structured-output schemas (also used to validate model responses)
class ExtractedSignal(BaseModel):
    company: str = Field(min_length=1, max_length=255)
    signal_type: str = Field(min_length=1, max_length=200)
    raw_phrase: str = Field(default="", max_length=500)
    confidence: float = Field(ge=0.0, le=1.0)
    event_date: date | None = None
    source_url: str = Field(default="", max_length=1000)
    raw_text: str = Field(default="", max_length=2000)


class ExtractedDoc(BaseModel):
    signals: list[ExtractedSignal] = Field(default_factory=list, max_length=32)


class CompanyIntelligence(BaseModel):
    """Full JSON returned by /analyze — canonical output shape."""
    company: str
    score: float
    label: str
    summary: str
    why_now: str
    opportunity_angle: str
    signals: list[SignalFindingOut]
