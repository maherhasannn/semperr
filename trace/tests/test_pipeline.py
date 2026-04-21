"""End-to-end pipeline test with mocked Gemini + Exa — no network."""
from __future__ import annotations

from datetime import date

import pytest
from sqlalchemy.orm import selectinload

from app.models.result import CompanyResult
from app.models.run import Run, RunStatus
from app.models.score_history import ScoreSnapshot
from app.models.strategy import SignalDef, Strategy
from app.models.user import User
from app.schemas.result import ExtractedDoc, ExtractedSignal
from app.services.exa import ExaDoc
from app.services.llm import GeminiClient
from app.services.pipeline import run_pipeline
from app.services.query_gen import QueryList
from app.services.synthesizer import SynthOut


class _LLMStub(GeminiClient):
    """Returns a canned response per schema name."""
    def __init__(self, *, synth: SynthOut | None = None):
        self._synth = synth or SynthOut(
            summary="Acme shows multiple signs of distress.",
            why_now="Events cluster in the last 90 days.",
            opportunity_angle="Subordinated credit on a tight covenant package.",
        )

    async def generate_json(self, system, prompt, schema, *, temperature: float = 0.2):
        name = schema.__name__
        if name == "QueryList":
            return QueryList(queries=["covenant breaches small-cap retail"])
        if name == "ExtractedDoc":
            return ExtractedDoc(
                signals=[
                    ExtractedSignal(
                        company="Acme Inc",
                        signal_type="covenant breach",
                        raw_phrase="breach of covenant",
                        confidence=0.9,
                        event_date=date(2026, 3, 1),
                        source_url="https://example.com/a",
                        raw_text="Acme Inc disclosed a breach of covenant.",
                    ),
                    ExtractedSignal(
                        company="Acme Inc",
                        signal_type="ceo steps down",
                        raw_phrase="CEO steps down",
                        confidence=0.7,
                        event_date=date(2026, 3, 20),
                        source_url="https://example.com/a",
                        raw_text="CEO steps down effective immediately.",
                    ),
                ]
            )
        if name == "SynthOut":
            return self._synth
        if name == "NormalizationMap":
            return schema(mapping={})
        try:
            return schema()
        except Exception:
            raise AssertionError(f"No stub for {name}")


class _ExaStub:
    async def search(self, query: str, *, num_results: int = 8):
        return [
            ExaDoc(
                url="https://example.com/a",
                title="Acme reports covenant breach",
                published_date="2026-03-05",
                highlights=["Acme disclosed a breach of covenant. CEO steps down."],
                text="",
            )
        ]


@pytest.fixture
def user_and_strategy():
    from app.database import SessionLocal

    db = SessionLocal()
    u = User(email="p@example.com", auth_user_id="neon-test-uuid-pipeline")
    db.add(u)
    db.commit()
    db.refresh(u)
    s = Strategy(owner_id=u.id, name="MCA distress watch", description="test")
    s.signals.append(SignalDef(name="covenant_breach", weight=2.0))
    s.signals.append(SignalDef(name="ceo_departure", weight=1.5))
    db.add(s)
    db.commit()
    db.refresh(s)
    uid, sid = u.id, s.id
    db.close()
    return uid, sid


async def test_pipeline_end_to_end(user_and_strategy):
    from app.database import SessionLocal

    uid, sid = user_and_strategy
    db = SessionLocal()
    run = Run(strategy_id=sid, user_id=uid, status=RunStatus.pending)
    db.add(run)
    db.commit()
    db.refresh(run)
    run_id = run.id
    db.close()

    await run_pipeline(run_id, llm=_LLMStub(), exa=_ExaStub())

    db = SessionLocal()
    r = db.get(Run, run_id)
    assert r.status == RunStatus.completed
    results = db.query(CompanyResult).filter(CompanyResult.run_id == run_id).all()
    assert len(results) == 1
    result = results[0]
    assert result.company == "Acme Inc"
    # 2*0.9 + 1.5*0.7 = 1.8 + 1.05 = 2.85 => 28.5 => Low
    assert round(result.score, 1) == 28.5
    assert result.label == "Low"
    assert "Acme" in result.summary
    snaps = db.query(ScoreSnapshot).filter(ScoreSnapshot.run_id == run_id).all()
    assert len(snaps) == 1
    assert snaps[0].company == "Acme Inc"
    # first run: delta is 0
    assert snaps[0].delta_from_prev == 0.0
    db.close()


async def test_pipeline_delta_on_second_run(user_and_strategy):
    """Second run with higher confidence should show positive delta."""
    from app.database import SessionLocal

    uid, sid = user_and_strategy
    # First run
    db = SessionLocal()
    r1 = Run(strategy_id=sid, user_id=uid, status=RunStatus.pending)
    db.add(r1); db.commit(); db.refresh(r1)
    r1_id = r1.id
    db.close()
    await run_pipeline(r1_id, llm=_LLMStub(), exa=_ExaStub())

    # Second run — bump confidence to 1.0 for both
    class _LLM2(_LLMStub):
        async def generate_json(self, system, prompt, schema, *, temperature: float = 0.2):
            if schema.__name__ == "ExtractedDoc":
                return ExtractedDoc(signals=[
                    ExtractedSignal(company="Acme Inc", signal_type="covenant breach",
                                    raw_phrase="breach of covenant", confidence=1.0,
                                    source_url="https://example.com/a"),
                    ExtractedSignal(company="Acme Inc", signal_type="ceo steps down",
                                    raw_phrase="ceo steps down", confidence=1.0,
                                    source_url="https://example.com/a"),
                ])
            return await super().generate_json(system, prompt, schema, temperature=temperature)

    db = SessionLocal()
    r2 = Run(strategy_id=sid, user_id=uid, status=RunStatus.pending)
    db.add(r2); db.commit(); db.refresh(r2)
    r2_id = r2.id
    db.close()
    await run_pipeline(r2_id, llm=_LLM2(), exa=_ExaStub())

    db = SessionLocal()
    snap = db.query(ScoreSnapshot).filter(ScoreSnapshot.run_id == r2_id).one()
    # new score = (2*1 + 1.5*1) * 10 = 35; prev = 28.5; delta = 6.5
    assert round(snap.score, 1) == 35.0
    assert round(snap.delta_from_prev, 1) == 6.5
    db.close()
