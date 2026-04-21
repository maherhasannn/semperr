"""Neon Auth (Stack Auth) JWT verifier.

Neon Auth ships no first-party Python SDK. We verify tokens by fetching the
project JWKS and validating the RS256 signature, issuer, and expiry with PyJWT.

The JWKS client caches keys in-process; Vercel cold starts pay a one-time
~100ms penalty. No Redis needed.
"""
from __future__ import annotations

import hashlib
import threading
import time
from dataclasses import dataclass
from typing import Any
from urllib.parse import urlencode

import jwt
from jwt import PyJWKClient, PyJWKClientError
from jwt.exceptions import InvalidTokenError

from app.config import Settings, get_settings

# ---- One-time JWT consumption -------------------------------------------------
#
# Stack Auth delivers the access token as a URL query parameter on /auth/callback.
# URL query strings are captured by every layer that touches the request
# (CDN/edge logs, browser history, Referer headers from sub-resources loaded
# by an error page). A bearer token with minutes of validity is a replay
# credential for that window. We defend by recording the SHA-256 of each
# token on first successful verification and refusing to mint a session for
# the same hash twice.
#
# Entries are held in-process only; a cold start resets the set. The TTL
# upper bound is the token's own `exp`, so the set can never outgrow the
# population of unexpired tokens the app has ever seen.
_CONSUMED_LOCK = threading.Lock()
_CONSUMED: dict[str, float] = {}
# Hard cap so a burst of attacker-supplied garbage tokens that *do* verify
# (which shouldn't happen, but defense in depth) cannot grow unbounded.
_CONSUMED_MAX = 10_000


def _token_fingerprint(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def consume_token_once(token: str, exp: int) -> bool:
    """Record a verified token as consumed. Returns True if this is the
    first time we've seen it (caller should proceed), False if it has
    already been consumed (caller MUST reject).

    Must be called only after signature/issuer/audience verification — we
    do not want to populate the set with attacker-supplied garbage.
    """
    fp = _token_fingerprint(token)
    now = time.time()
    with _CONSUMED_LOCK:
        # Opportunistic prune of expired entries.
        if _CONSUMED:
            stale = [k for k, e in _CONSUMED.items() if e < now]
            for k in stale:
                _CONSUMED.pop(k, None)
        # Cap eviction: drop the oldest-expiring entries.
        if len(_CONSUMED) >= _CONSUMED_MAX:
            for k, _ in sorted(_CONSUMED.items(), key=lambda kv: kv[1])[
                : len(_CONSUMED) - _CONSUMED_MAX + 1
            ]:
                _CONSUMED.pop(k, None)
        if fp in _CONSUMED:
            return False
        _CONSUMED[fp] = float(exp)
        return True


class NeonAuthError(Exception):
    """Base error for Neon Auth failures."""


class NeonAuthJWKSUnavailable(NeonAuthError):
    """JWKS endpoint could not be reached (network / 5xx)."""


class NeonAuthInvalidToken(NeonAuthError):
    """JWT failed verification (signature, issuer, audience, expiry, format)."""


@dataclass(frozen=True)
class VerifiedClaims:
    sub: str  # Neon Auth user UUID
    email: str
    exp: int


class NeonAuthClient:
    """Verifies Neon Auth JWTs against the project's JWKS endpoint.

    One instance per process is sufficient — PyJWKClient caches signing keys.
    """

    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()
        self._jwks_client = PyJWKClient(self._settings.neon_auth_jwks_url)

    def verify_jwt(self, token: str) -> VerifiedClaims:
        if not token or not isinstance(token, str):
            raise NeonAuthInvalidToken("empty token")
        try:
            signing_key = self._jwks_client.get_signing_key_from_jwt(token)
        except PyJWKClientError as e:
            # Covers both "unable to fetch JWKS" and "kid not in JWKS"
            raise NeonAuthJWKSUnavailable(str(e)) from e
        try:
            payload: dict[str, Any] = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                issuer=self._settings.neon_auth_issuer,
                audience=self._settings.neon_auth_project_id,
                options={"require": ["exp", "sub", "iss", "aud"]},
            )
        except InvalidTokenError as e:
            raise NeonAuthInvalidToken(str(e)) from e
        sub = payload.get("sub")
        # Stack Auth may expose email under `primary_email` or `email`.
        email = (
            payload.get("primary_email")
            or payload.get("email")
            or ""
        )
        exp = payload.get("exp")
        if not sub or not email or not exp:
            raise NeonAuthInvalidToken("missing required claims (sub/email/exp)")
        return VerifiedClaims(sub=str(sub), email=str(email), exp=int(exp))

    def sign_in_url(self, *, return_to: str, email: str | None = None) -> str:
        params: dict[str, str] = {"return_to": return_to}
        if email:
            params["email"] = email
        return f"{self._settings.neon_auth_sign_in_url}?{urlencode(params)}"

    def sign_out_url(self, *, return_to: str) -> str:
        return f"{self._settings.neon_auth_sign_out_url}?{urlencode({'return_to': return_to})}"
