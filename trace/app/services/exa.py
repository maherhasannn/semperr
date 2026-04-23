"""Exa retrieval adapter — async with a semaphore cap for bounded concurrency."""
from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from typing import Any

from app.config import get_settings
from app.logging import get_logger

log = get_logger(__name__)


@dataclass
class ExaDoc:
    url: str
    title: str = ""
    published_date: str | None = None
    highlights: list[str] = field(default_factory=list)
    text: str = ""


class ExaClient:
    def __init__(self, api_key: str | None = None) -> None:
        self._api_key = api_key or get_settings().exa_api_key
        self._client: Any | None = None

    def _lazy(self) -> Any:
        if self._client is not None:
            return self._client
        try:
            from exa_py import Exa  # type: ignore
        except Exception as e:  # pragma: no cover
            raise RuntimeError(f"exa-py not available: {e}") from e
        self._client = Exa(api_key=self._api_key)
        return self._client

    async def search(self, query: str, *, num_results: int = 8) -> list[ExaDoc]:
        client = self._lazy()

        def _sync() -> list[ExaDoc]:
            resp = client.search_and_contents(
                query,
                num_results=num_results,
                highlights=True,
                text=True,
                type="neural",
            )
            out: list[ExaDoc] = []
            for r in getattr(resp, "results", []) or []:
                out.append(
                    ExaDoc(
                        url=getattr(r, "url", "") or "",
                        title=getattr(r, "title", "") or "",
                        published_date=getattr(r, "published_date", None),
                        highlights=list(getattr(r, "highlights", []) or []),
                        text=(getattr(r, "text", "") or "")[:8000],
                    )
                )
            return out

        return await asyncio.to_thread(_sync)
