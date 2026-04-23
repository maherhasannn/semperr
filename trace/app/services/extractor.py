"""Extract structured signal candidates from one Exa doc."""
from __future__ import annotations

from app.schemas.result import ExtractedDoc
from app.services.exa import ExaDoc
from app.services.llm import GeminiClient

SYSTEM = (
    "You extract structured distress/opportunity signals from a news or filing snippet "
    "for a private-credit analyst. Output JSON with a 'signals' array. For each signal: "
    "company (proper-noun entity name), signal_type (short canonical phrase like "
    "'covenant_breach', 'layoffs', 'missed_payment', 'lawsuit', 'going_concern', "
    "'ceo_departure', 'credit_downgrade', 'factoring_default', 'restructuring'), "
    "raw_phrase (the exact phrase from text), confidence (0-1), event_date (YYYY-MM-DD if present, "
    "else null), source_url (passed in), raw_text (supporting sentence). "
    "If no signal is present, return {\"signals\": []}. Do not fabricate companies or dates."
)


async def extract(doc: ExaDoc, client: GeminiClient | None = None) -> ExtractedDoc:
    client = client or GeminiClient()
    # Build bounded input block — highlights preferred, else first 2k chars of text
    body_parts: list[str] = []
    if doc.highlights:
        body_parts.extend(doc.highlights[:6])
    elif doc.text:
        body_parts.append(doc.text[:2000])
    body = "\n---\n".join(body_parts)
    user = (
        f"title: {doc.title[:200]}\n"
        f"url: {doc.url[:500]}\n"
        f"published: {doc.published_date or ''}\n"
        f"body:\n{body}"
    )
    result = await client.generate_json(SYSTEM, user, ExtractedDoc)
    # Ensure source_url is present on each
    for s in result.signals:
        if not s.source_url:
            s.source_url = doc.url
    return result
