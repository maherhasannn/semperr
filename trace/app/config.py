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

    # Neon Auth — magic-link hosted pages.
    #
    # Two supported topologies:
    #
    # A. Neon-hosted Auth (endpoints served off your Neon compute at
    #    `ep-*.neonauth.*.neon.tech/<db>/auth`). Set the explicit URLs:
    #       NEON_AUTH_JWKS_URL, NEON_AUTH_ISSUER,
    #       NEON_AUTH_SIGN_IN_URL, NEON_AUTH_SIGN_OUT_URL,
    #       NEON_AUTH_AUDIENCE (if Neon sets `aud` on the JWT; else leave empty).
    #
    # B. Stack Auth SaaS shortcut (api.stack-auth.com / *.accounts.stack-auth.com).
    #    Just set NEON_AUTH_PROJECT_ID; every URL is derived from it and the
    #    audience defaults to the project id.
    #
    # A takes precedence over B per-field: any explicit URL wins over the
    # derived one. Leave project_id at its default when using A.
    neon_auth_project_id: str = "test-project"
    neon_auth_secret_server_key: str = ""
    neon_auth_jwks_url: str = ""
    neon_auth_issuer: str = ""
    neon_auth_audience: str = ""
    neon_auth_sign_in_url: str = ""
    neon_auth_sign_out_url: str = ""

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

    # Resolvers: prefer the explicit env value; fall back to deriving from
    # project_id using the Stack Auth SaaS URL scheme.

    def resolved_neon_auth_jwks_url(self) -> str:
        return self.neon_auth_jwks_url or (
            f"https://api.stack-auth.com/api/v1/projects/"
            f"{self.neon_auth_project_id}/.well-known/jwks.json"
        )

    def resolved_neon_auth_issuer(self) -> str:
        return self.neon_auth_issuer or (
            f"https://api.stack-auth.com/api/v1/projects/{self.neon_auth_project_id}"
        )

    def resolved_neon_auth_audience(self) -> str | None:
        """Return the audience to enforce, or None to skip the `aud` check.

        Empty string + the placeholder project_id default = skip. Any other
        non-empty value is enforced exactly.
        """
        if self.neon_auth_audience:
            return self.neon_auth_audience
        if self.neon_auth_project_id and self.neon_auth_project_id != "test-project":
            return self.neon_auth_project_id
        return None

    def resolved_neon_auth_sign_in_url(self) -> str:
        return self.neon_auth_sign_in_url or (
            f"https://{self.neon_auth_project_id}.accounts.stack-auth.com/sign-in"
        )

    def resolved_neon_auth_sign_out_url(self) -> str:
        return self.neon_auth_sign_out_url or (
            f"https://{self.neon_auth_project_id}.accounts.stack-auth.com/sign-out"
        )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
