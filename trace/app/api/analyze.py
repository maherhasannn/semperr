"""Ad-hoc analyze — raw Exa-like payload -> structured CompanyIntelligence list."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_user
from app.models.user import User
from app.schemas.result import (
    CompanyIntelligence,
    ExtractedSignal,
    SignalFindingOut,
)
from app.services import aggregator, extractor, normalizer, scorer, synthesizer
from app.services.exa import ExaDoc
from app.services.llm import GeminiClient

router = APIRouter(tags=["analyze"])


class AnalyzeDoc(BaseModel):
    url: str = Field(default="", max_length=1000)
    title: str = Field(default="", max_length=500)
    published_date: str | None = None
    highlights: list[str] = Field(default_factory=list, max_length=20)
    text: str = Field(default="", max_length=8000)


class AnalyzeIn(BaseModel):
    # ad-hoc: caller passes raw Exa-like docs plus a strategy-like weight map
    docs: list[AnalyzeDoc] = Field(default_factory=list, max_length=32)
    weights: dict[str, float] = Field(default_factory=dict)


class AnalyzeOut(BaseModel):
    companies: list[CompanyIntelligence]


@router.post("/analyze", response_model=AnalyzeOut)
async def analyze(
    payload: AnalyzeIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_user),
) -> AnalyzeOut:
    llm = GeminiClient()
    docs = [
        ExaDoc(
            url=d.url, title=d.title, published_date=d.published_date,
            highlights=d.highlights, text=d.text,
        )
        for d in payload.docs
    ]
    # extract
    raw: list[ExtractedSignal] = []
    for d in docs:
        try:
            ex = await extractor.extract(d, client=llm)
            raw.extend(ex.signals)
        except Exception:
            continue
    normed = await normalizer.normalize(raw, client=llm)
    grouped = aggregator.group_by_company(normed)

    # Build a lightweight strategy-shaped object for scoring
    class _SD:
        def __init__(self, name: str, weight: float) -> None:
            self.name = name
            self.weight = weight

    class _S:
        def __init__(self, weights: dict[str, float]) -> None:
            self.signals = [_SD(n, w) for n, w in weights.items()]

    strat = _S(payload.weights)

    out: list[CompanyIntelligence] = []
    for company, sigs in grouped.items():
        s = scorer.score(strat, sigs)  # type: ignore[arg-type]
        try:
            synth = await synthesizer.summarize(company, sigs, client=llm)
        except Exception:
            from app.services.synthesizer import SynthOut
            synth = SynthOut()
        out.append(
            CompanyIntelligence(
                company=company,
                score=s.score,
                label=s.label,
                summary=synth.summary,
                why_now=synth.why_now,
                opportunity_angle=synth.opportunity_angle,
                signals=[
                    SignalFindingOut(
                        signal_type=f.signal.signal_type,
                        raw_phrase=f.signal.raw_phrase,
                        confidence=f.signal.confidence,
                        event_date=f.signal.event_date,
                        source_url=f.signal.source_url,
                        raw_text=f.signal.raw_text,
                        weight_applied=f.weight_applied,
                    )
                    for f in s.findings
                ],
            )
        )
    out.sort(key=lambda c: c.score, reverse=True)
    return AnalyzeOut(companies=out)
