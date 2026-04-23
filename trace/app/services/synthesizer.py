"""LLM-written analyst paragraph per company: summary / why_now / opportunity_angle."""
from __future__ import annotations

from pydantic import BaseModel, Field

from app.schemas.result import ExtractedSignal
from app.services.llm import GeminiClient

SYSTEM = (
    "You are a senior private-credit analyst. Given a company and its observed distress "
    "signals, write a terse institutional memo in JSON with three fields: "
    "summary (2-3 sentences, factual, no hype), "
    "why_now (1-2 sentences on recency and momentum), "
    "opportunity_angle (1-2 sentences on credit/structured opportunity). "
    "Do not invent facts. Cite nothing. Dealbook tone."
)


class SynthOut(BaseModel):
    summary: str = Field(default="", max_length=1200)
    why_now: str = Field(default="", max_length=800)
    opportunity_angle: str = Field(default="", max_length=800)


async def summarize(
    company: str,
    signals: list[ExtractedSignal],
    client: GeminiClient | None = None,
) -> SynthOut:
    client = client or GeminiClient()
    rows = [
        f"- [{s.signal_type}] conf={s.confidence:.2f} "
        f"date={s.event_date.isoformat() if s.event_date else 'n/a'} :: {s.raw_phrase[:180]}"
        for s in signals
    ]
    user = f"company: {company}\nsignals:\n" + "\n".join(rows)
    return await client.generate_json(SYSTEM, user, SynthOut)
