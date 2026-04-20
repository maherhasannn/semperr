from __future__ import annotations

from dataclasses import dataclass

from app.schemas.result import ExtractedSignal
from app.services.scorer import score


@dataclass
class _SD:
    name: str
    weight: float


class _Strat:
    def __init__(self, sigs):
        self.signals = sigs


def _sig(co: str, t: str, conf: float) -> ExtractedSignal:
    return ExtractedSignal(company=co, signal_type=t, confidence=conf)


def test_score_sum_weight_times_confidence_capped():
    strat = _Strat([_SD("covenant_breach", 2.0), _SD("lawsuit", 1.0)])
    sigs = [_sig("Acme", "covenant_breach", 0.9), _sig("Acme", "lawsuit", 0.5)]
    r = score(strat, sigs)
    # raw = 2*0.9 + 1*0.5 = 2.3; scaled = 23.0 => Low
    assert r.score == 23.0
    assert r.label == "Low"
    assert len(r.findings) == 2


def test_score_high_label_and_cap():
    strat = _Strat([_SD("covenant_breach", 5.0), _SD("missed_payment", 5.0)])
    sigs = [
        _sig("A", "covenant_breach", 1.0),
        _sig("A", "missed_payment", 1.0),
    ]
    r = score(strat, sigs)
    # raw = 10, scaled = 100 (cap)
    assert r.score == 100.0
    assert r.label == "High"


def test_unmatched_signals_have_zero_weight():
    strat = _Strat([_SD("covenant_breach", 2.0)])
    sigs = [_sig("A", "layoffs", 1.0)]
    r = score(strat, sigs)
    assert r.score == 0.0
    assert r.label == "Low"
    assert r.findings[0].weight_applied == 0.0


def test_medium_label():
    strat = _Strat([_SD("covenant_breach", 2.0), _SD("ceo_departure", 1.5)])
    sigs = [
        _sig("B", "covenant_breach", 1.0),
        _sig("B", "ceo_departure", 1.0),
    ]
    r = score(strat, sigs)
    # raw = 3.5, scaled = 35 => Medium
    assert r.score == 35.0
    assert r.label == "Medium"
