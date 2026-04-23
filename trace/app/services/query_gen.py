"""Turn a strategy's signals into a bounded list of Exa queries via one LLM call."""
from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.strategy import SignalDef
from app.services.llm import GeminiClient

SYSTEM = (
    "You are a senior deal-sourcing analyst at a private-credit shop. "
    "Given a list of distress/opportunity signals, produce concise search queries "
    "that a web retrieval engine can run to surface companies exhibiting those signals. "
    "Return 5-10 queries. Each must be under 120 chars, in plain English, no operators."
)


class QueryList(BaseModel):
    queries: list[str] = Field(default_factory=list, min_length=1, max_length=10)


async def generate(signals: list[SignalDef], client: GeminiClient | None = None) -> list[str]:
    if not signals:
        return []
    client = client or GeminiClient()
    sig_block = "\n".join(f"- {s.name} (weight {s.weight}): {s.description}" for s in signals)
    result = await client.generate_json(SYSTEM, sig_block, QueryList)
    # Defense in depth: strip blanks, cap lengths
    return [q.strip()[:120] for q in result.queries if q.strip()]
