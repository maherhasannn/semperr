"""Orchestrates spec steps 1-9. Idempotent per run_id. Bounded concurrency."""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from sqlalchemy import delete
from sqlalchemy.orm import Session, selectinload

from app import database as _db
from app.config import get_settings
from app.logging import get_logger
from app.models.result import CompanyResult, SignalFinding
from app.models.run import Run, RunStatus
from app.models.strategy import Strategy
from app.schemas.result import ExtractedSignal
from app.services import aggregator, extractor, normalizer, query_gen, recency, scorer, synthesizer
from app.services.exa import ExaClient, ExaDoc
from app.services.llm import GeminiClient

log = get_logger(__name__)


async def _gather_bounded(coros: list, limit: int) -> list:
    sem = asyncio.Semaphore(limit)

    async def _wrap(c):
        async with sem:
            try:
                return await c
            except Exception as e:
                log.warning("pipeline.subtask_failed", error=str(e)[:300])
                return e

    return await asyncio.gather(*(_wrap(c) for c in coros))


async def run_pipeline(
    run_id: int,
    *,
    llm: GeminiClient | None = None,
    exa: ExaClient | None = None,
    db_factory=None,
) -> None:
    if db_factory is None:
        db_factory = _db.SessionLocal
    """Execute the full pipeline for a given run. Idempotent: wipes prior
    results/snapshots on the same run_id before writing."""
    settings = get_settings()
    llm = llm or GeminiClient()
    exa = exa or ExaClient()

    db: Session = db_factory()
    try:
        run = db.get(Run, run_id)
        if run is None:
            log.error("pipeline.run_missing", run_id=run_id)
            return
        strategy = db.execute(
            Strategy.__table__.select().where(Strategy.id == run.strategy_id)
        )  # touch
        strategy_obj = db.get(Strategy, run.strategy_id, options=[selectinload(Strategy.signals)])
        if strategy_obj is None:
            run.status = RunStatus.failed
            run.error = "strategy not found"
            run.finished_at = datetime.now(timezone.utc)
            db.commit()
            return

        # Idempotency: clean prior writes for this run
        db.execute(delete(CompanyResult).where(CompanyResult.run_id == run_id))
        from app.models.score_history import ScoreSnapshot as _SS
        db.execute(delete(_SS).where(_SS.run_id == run_id))
        run.status = RunStatus.running
        run.started_at = datetime.now(timezone.utc)
        db.commit()

        # 2. Query gen
        if run.query_override:
            queries = [run.query_override]
        else:
            queries = await query_gen.generate(strategy_obj.signals, client=llm)
        if not queries:
            run.status = RunStatus.completed
            run.finished_at = datetime.now(timezone.utc)
            db.commit()
            log.info("pipeline.done_empty", run_id=run_id)
            return

        # 3. Exa search per query, bounded
        search_results = await _gather_bounded(
            [exa.search(q, num_results=settings.max_docs_per_query) for q in queries],
            settings.exa_concurrency,
        )
        docs: list[ExaDoc] = []
        seen_urls: set[str] = set()
        for res in search_results:
            if isinstance(res, Exception):
                continue
            for d in res or []:
                if d.url and d.url not in seen_urls:
                    seen_urls.add(d.url)
                    docs.append(d)

        # 4. Extract per doc (bounded)
        extractions = await _gather_bounded(
            [extractor.extract(d, client=llm) for d in docs],
            settings.exa_concurrency,
        )
        raw_signals: list[ExtractedSignal] = []
        for ex in extractions:
            if isinstance(ex, Exception):
                continue
            raw_signals.extend(ex.signals)

        # 5. Normalize
        normed = await normalizer.normalize(raw_signals, client=llm)

        # 6. Aggregate
        grouped = aggregator.group_by_company(normed)

        # 7-8. Score + synthesize per company (bounded)
        company_names = list(grouped.keys())

        async def _per_company(company: str):
            sigs = grouped[company]
            s = scorer.score(strategy_obj, sigs)
            try:
                synth = await synthesizer.summarize(company, sigs, client=llm)
            except Exception as e:
                log.warning("synth_failed", company=company, error=str(e)[:200])
                from app.services.synthesizer import SynthOut
                synth = SynthOut()
            return company, s, synth

        per_co = await _gather_bounded(
            [_per_company(c) for c in company_names], settings.exa_concurrency
        )

        # Persist
        for item in per_co:
            if isinstance(item, Exception):
                continue
            company, s, synth = item
            cr = CompanyResult(
                run_id=run_id,
                company=company,
                score=s.score,
                label=s.label,
                summary=synth.summary,
                why_now=synth.why_now,
                opportunity_angle=synth.opportunity_angle,
            )
            db.add(cr)
            db.flush()
            for f in s.findings:
                db.add(
                    SignalFinding(
                        result_id=cr.id,
                        signal_type=f.signal.signal_type,
                        raw_phrase=f.signal.raw_phrase,
                        confidence=f.signal.confidence,
                        event_date=f.signal.event_date,
                        source_url=f.signal.source_url,
                        raw_text=f.signal.raw_text,
                        weight_applied=f.weight_applied,
                    )
                )
            # 9. Recency
            recency.snapshot(
                db,
                strategy_id=run.strategy_id,
                run_id=run_id,
                company=company,
                score=s.score,
            )

        run.status = RunStatus.completed
        run.finished_at = datetime.now(timezone.utc)
        db.commit()
        log.info("pipeline.done", run_id=run_id, companies=len(company_names), docs=len(docs))
    except Exception as e:
        log.error("pipeline.failed", run_id=run_id, error=str(e)[:500])
        db.rollback()
        try:
            r = db.get(Run, run_id)
            if r is not None:
                r.status = RunStatus.failed
                r.error = str(e)[:2000]
                r.finished_at = datetime.now(timezone.utc)
                db.commit()
        except Exception:
            db.rollback()
    finally:
        db.close()
