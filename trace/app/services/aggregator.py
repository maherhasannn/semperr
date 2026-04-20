"""Group signals by company, dedupe, merge dates."""
from __future__ import annotations

from collections import defaultdict
from typing import Iterable

from app.schemas.result import ExtractedSignal


def _canon_company(name: str) -> str:
    return " ".join(name.strip().lower().split())


def group_by_company(
    signals: Iterable[ExtractedSignal],
) -> dict[str, list[ExtractedSignal]]:
    """Return dict of display-name -> list of deduped signals.

    Dedup key: (signal_type, source_url). Merge rule on dupe: keep max confidence
    and earliest non-null event_date.
    """
    # bucket by canonical name; keep first-seen display form
    display: dict[str, str] = {}
    buckets: dict[str, dict[tuple[str, str], ExtractedSignal]] = defaultdict(dict)

    for s in signals:
        if not s.company or not s.signal_type:
            continue
        key = _canon_company(s.company)
        if not key:
            continue
        display.setdefault(key, s.company.strip())
        dkey = (s.signal_type, s.source_url)
        existing = buckets[key].get(dkey)
        if existing is None:
            buckets[key][dkey] = s
        else:
            merged_conf = max(existing.confidence, s.confidence)
            merged_date = existing.event_date or s.event_date
            if existing.event_date and s.event_date:
                merged_date = min(existing.event_date, s.event_date)
            buckets[key][dkey] = existing.model_copy(
                update={"confidence": merged_conf, "event_date": merged_date}
            )

    return {display[k]: list(v.values()) for k, v in buckets.items()}
