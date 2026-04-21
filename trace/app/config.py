"""Runtime configuration — env-driven, validated."""
from __future__ import annotations

from functools import lru_cache
from typing import Literal
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _normalize_db_url(url: str) -> str:
    """Coerce Neon/Heroku-style URLs to SQLAlchemy psycopg v3 + require SSL.

    - `postgres://...`        -> `postgresql+psycopg://...`
    - `postgresql://...`      -> `postgresql+psycopg://...`
    - Any non-sqlite URL gains `sslmode=require` if not already set.
    """
    if not url:
        return url
    if url.startswith("sqlite"):
        return url
    # Normalize scheme to psycopg v3.
    if url.startswith("postgres://"):
        url = "postgresql+psycopg://" + url[len("postgres://") :]
    elif url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://") :]
    # Ensure sslmode=require on managed Postgres (Neon requires it).
    parts = urlsplit(url)
    q = dict(parse_qsl(parts.query, keep_blank_values=True))
    q.setdefault("sslmode", "require")
    # Neon pooled endpoint works best with channel_binding=require; respect user override.
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(q), parts.fragment))


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    env: Literal["dev", "test", "prod"] = "dev"
    log_level: str = "INFO"

    secret_key: str = Field(min_length=16)
    invite_code: str = Field(min_length=1)
    session_max_age_seconds: int = 8 * 60 * 60

    database_url: str

    gemini_api_key: str = "test-key"
    exa_api_key: str = "test-key"

    # Neon Auth (Better Auth) — email-OTP REST base URL.
    #
    # Copy the "Auth URL" from the Neon console -> Auth tab. It looks like:
    #   https://ep-<name>-<region>.neonauth.<cloud>.neon.tech/<db>/auth
    # We POST to {base}/email-otp/send-verification-otp and
    # {base}/sign-in/email-otp server-to-server.
    neon_auth_url: str = ""

    # Defaults tuned for Vercel Hobby (60s) — keep the pipeline under budget.
    exa_concurrency: int = 3
    max_docs_per_query: int = 3

    # Number of trusted proxy hops in front of the app. Used to pick the real
    # client IP from X-Forwarded-For. Vercel's edge appends exactly one hop, so
    # the default is 1. Set to 0 when running without any trusted proxy (the
    # app will then use the TCP peer address and ignore XFF entirely).
    # NEVER trust the leftmost XFF value unconditionally — that value is fully
    # attacker-controlled and trivially spoofable, which would neuter every
    # rate limit keyed on client IP.
    trusted_proxy_hops: int = 1

    @field_validator("database_url")
    @classmethod
    def _coerce_db_url(cls, v: str) -> str:
        return _normalize_db_url(v)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
