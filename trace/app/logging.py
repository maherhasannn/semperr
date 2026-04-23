"""Structured logging. Scrubs secrets + raw prompts at INFO."""
from __future__ import annotations

import logging
import sys
from typing import Any

import structlog

from app.config import get_settings

_SCRUB_KEYS = {
    "password", "password_hash", "authorization", "cookie", "set-cookie",
    "api_key", "apikey", "secret", "secret_key", "token", "session",
    "prompt", "response_text", "raw_prompt", "raw_response",
}


def _scrub(logger: Any, method_name: str, event_dict: dict[str, Any]) -> dict[str, Any]:
    level = event_dict.get("level", "info").lower()
    redact_prompts = level != "debug"
    for k in list(event_dict.keys()):
        lk = k.lower()
        if lk in _SCRUB_KEYS:
            if lk in {"prompt", "response_text", "raw_prompt", "raw_response"} and not redact_prompts:
                continue
            event_dict[k] = "[REDACTED]"
    return event_dict


def configure_logging() -> None:
    s = get_settings()
    level = getattr(logging, s.log_level.upper(), logging.INFO)
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=level,
    )
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            _scrub,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(level),
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str | None = None) -> Any:
    return structlog.get_logger(name)
