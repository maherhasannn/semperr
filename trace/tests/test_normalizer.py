from __future__ import annotations

import pytest

from app.schemas.result import ExtractedSignal
from app.services.normalizer import CANONICAL, normalize, rule_normalize


def test_rule_normalize_direct_canonical_hits():
    assert rule_normalize("covenant_breach") == "covenant_breach"
    assert rule_normalize("bankruptcy") == "bankruptcy"


def test_rule_normalize_phrasing():
    assert rule_normalize("breach of covenant") == "covenant_breach"
    assert rule_normalize("CEO steps down amid probe") == "ceo_departure"
    assert rule_normalize("files Chapter 11 bankruptcy") == "bankruptcy"
    assert rule_normalize("mass layoff announced") == "layoffs"


def test_rule_normalize_unknown_returns_none():
    assert rule_normalize("some random phrase") is None


async def test_normalize_uses_rules_without_llm():
    sigs = [
        ExtractedSignal(company="A", signal_type="breach of covenant", confidence=0.9),
        ExtractedSignal(company="A", signal_type="layoffs", confidence=0.5),
    ]

    class _NoLLM:
        async def generate_json(self, *a, **k):
            raise AssertionError("should not be called")

    out = await normalize(sigs, client=_NoLLM())
    assert [s.signal_type for s in out] == ["covenant_breach", "layoffs"]
    # canonical set integrity
    for c in ["covenant_breach", "layoffs"]:
        assert c in CANONICAL


async def test_normalize_llm_fallback_for_unknowns():
    sigs = [
        ExtractedSignal(company="A", signal_type="weird new signal", confidence=0.9),
    ]

    class _LLM:
        async def generate_json(self, system, prompt, schema, *, temperature=0.2):
            return schema(mapping={"weird new signal": "restructuring"})

    out = await normalize(sigs, client=_LLM())
    assert out[0].signal_type == "restructuring"
