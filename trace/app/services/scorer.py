"""Score company signals against a strategy: sum(weight * confidence), clipped 0-100."""
from __future__ import annotations

from dataclasses import dataclass

from app.models.strategy import Strategy
from app.schemas.result import ExtractedSignal


@dataclass
class ScoredFinding:
    signal: ExtractedSignal
    weight_applied: float


@dataclass
class ScoreResult:
    score: float
    label: str
    findings: list[ScoredFinding]


def _label(score: float) -> str:
    if score >= 61:
        return "High"
    if score >= 31:
        return "Medium"
    return "Low"


def score(strategy: Strategy, signals: list[ExtractedSignal]) -> ScoreResult:
    """Sum of weight*confidence across matching canonical signal_defs, capped at 100.

    Weights come from the strategy's signal_defs, keyed by canonical `name`.
    Signals whose type doesn't match any strategy signal get weight 0 but are kept.
    """
    weights: dict[str, float] = {sd.name: float(sd.weight) for sd in strategy.signals}
    raw = 0.0
    findings: list[ScoredFinding] = []
    for s in signals:
        w = weights.get(s.signal_type, 0.0)
        contribution = w * float(s.confidence)
        raw += contribution
        findings.append(ScoredFinding(signal=s, weight_applied=w))

    # Normalize: scale so a moderate-evidence company lands in the middle band.
    # Rule: each unit of (weight*confidence) = 10 points; cap at 100.
    scaled = min(100.0, max(0.0, raw * 10.0))
    return ScoreResult(score=round(scaled, 2), label=_label(scaled), findings=findings)
