"""Normalize raw signal phrases into canonical signal_type keys.

Rule-table first, LLM fallback only for unknowns to keep cost bounded.
"""
from __future__ import annotations

import re
from typing import Iterable

from pydantic import BaseModel, Field

from app.schemas.result import ExtractedSignal
from app.services.llm import GeminiClient

# Canonical signal vocabulary
CANONICAL: tuple[str, ...] = (
    "covenant_breach",
    "missed_payment",
    "credit_downgrade",
    "going_concern",
    "layoffs",
    "lawsuit",
    "ceo_departure",
    "factoring_default",
    "restructuring",
    "bankruptcy",
    "auditor_resignation",
    "revenue_decline",
    "store_closures",
    "regulatory_action",
    "delisting_warning",
)

# Substring rules (lowercased). First match wins.
RULES: tuple[tuple[str, str], ...] = (
    ("covenant", "covenant_breach"),
    ("missed payment", "missed_payment"),
    ("missed interest", "missed_payment"),
    ("default on", "missed_payment"),
    ("downgrade", "credit_downgrade"),
    ("going concern", "going_concern"),
    ("layoff", "layoffs"),
    ("layoffs", "layoffs"),
    ("workforce reduction", "layoffs"),
    ("lawsuit", "lawsuit"),
    ("sued", "lawsuit"),
    ("litigation", "lawsuit"),
    ("ceo steps down", "ceo_departure"),
    ("ceo resigns", "ceo_departure"),
    ("chief executive resigns", "ceo_departure"),
    ("factoring", "factoring_default"),
    ("restructur", "restructuring"),
    ("chapter 11", "bankruptcy"),
    ("bankruptcy", "bankruptcy"),
    ("auditor resign", "auditor_resignation"),
    ("revenue decline", "revenue_decline"),
    ("revenue fell", "revenue_decline"),
    ("store closure", "store_closures"),
    ("store closing", "store_closures"),
    ("sec investigation", "regulatory_action"),
    ("cease and desist", "regulatory_action"),
    ("delisting", "delisting_warning"),
    ("notice of delisting", "delisting_warning"),
)


_slug_re = re.compile(r"[^a-z0-9]+")


def _slug(s: str) -> str:
    return _slug_re.sub("_", s.lower()).strip("_")


def rule_normalize(raw: str) -> str | None:
    low = raw.lower()
    # exact canonical match
    s = _slug(raw)
    if s in CANONICAL:
        return s
    for needle, canon in RULES:
        if needle in low:
            return canon
    return None


class NormalizationMap(BaseModel):
    mapping: dict[str, str] = Field(default_factory=dict)


async def _llm_fallback(
    unknowns: list[str], client: GeminiClient | None = None
) -> dict[str, str]:
    if not unknowns:
        return {}
    client = client or GeminiClient()
    vocab = ", ".join(CANONICAL)
    system = (
        "Map each input phrase to the single best canonical signal key from this closed list: "
        f"{vocab}. If no key fits, map to 'other'. Return JSON like "
        "{\"mapping\": {\"<input>\": \"<canonical>\"}}."
    )
    user = "\n".join(f"- {u}" for u in unknowns)
    try:
        resp = await client.generate_json(system, user, NormalizationMap)
        return {k: (v if v in CANONICAL else "other") for k, v in resp.mapping.items()}
    except Exception:
        return {u: "other" for u in unknowns}


async def normalize(
    signals: Iterable[ExtractedSignal], client: GeminiClient | None = None
) -> list[ExtractedSignal]:
    signals = list(signals)
    unknowns: list[str] = []
    resolved: list[str | None] = []
    for s in signals:
        canon = rule_normalize(s.signal_type)
        resolved.append(canon)
        if canon is None:
            unknowns.append(s.signal_type)

    fallback: dict[str, str] = {}
    if unknowns:
        fallback = await _llm_fallback(list(dict.fromkeys(unknowns)), client=client)

    out: list[ExtractedSignal] = []
    for sig, canon in zip(signals, resolved):
        final = canon or fallback.get(sig.signal_type, "other")
        out.append(sig.model_copy(update={"signal_type": final}))
    return out
