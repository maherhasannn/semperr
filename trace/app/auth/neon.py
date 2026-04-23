"""Neon Auth (Better Auth) email-OTP REST client.

Neon Auth is powered by Better Auth. We drive its email-OTP plugin
server-to-server: our backend asks Better Auth to email a code, then
verifies `(email, code)` against Better Auth. We throw away Better
Auth's own session cookie — we only use the call as a *verifier* that
the user proved control of the email. On success we mint our own
session cookie (see app.security.issue_session_token) keyed by the
DB user id.

Two endpoints are used (standard Better Auth paths under NEON_AUTH_URL):

- POST {base}/email-otp/send-verification-otp  body {"email","type":"sign-in"}
- POST {base}/sign-in/email-otp                body {"email","otp"}

Both return 2xx on success and 4xx on failure. We treat 2xx as
authoritative proof-of-email.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx

from app.config import Settings, get_settings


class NeonAuthError(Exception):
    """Base error for Neon/Better Auth failures."""


class NeonAuthUnavailable(NeonAuthError):
    """Upstream unreachable (network error or 5xx)."""


class NeonAuthRejected(NeonAuthError):
    """Upstream refused the request (4xx — bad OTP, expired, rate-limited)."""


@dataclass(frozen=True)
class VerifiedEmail:
    email: str
    # The provider's user id if returned in the response body. May be empty.
    # We do NOT rely on this for identity — email is the stable key on our
    # side — but surface it for logging / future consolidation.
    provider_user_id: str


class NeonAuthClient:
    """Talks to Neon Auth's Better Auth REST API for email-OTP."""

    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()
        base = (self._settings.neon_auth_url or "").rstrip("/")
        if not base:
            raise NeonAuthError("NEON_AUTH_URL is not configured")
        self._base = base
        # 10s covers Neon's magic-link email dispatch; we're on a 60s
        # Vercel budget so we can't block much longer anyway.
        self._timeout = httpx.Timeout(10.0, connect=5.0)

    def _post(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        url = f"{self._base}{path}"
        try:
            r = httpx.post(url, json=payload, timeout=self._timeout)
        except httpx.HTTPError as e:
            raise NeonAuthUnavailable(f"network error calling {path}: {e}") from e
        if 500 <= r.status_code < 600:
            raise NeonAuthUnavailable(
                f"upstream {r.status_code} from {path}: {r.text[:200]}"
            )
        if 400 <= r.status_code < 500:
            raise NeonAuthRejected(
                f"upstream {r.status_code} from {path}: {r.text[:200]}"
            )
        try:
            data = r.json()
        except Exception:
            data = {}
        if not isinstance(data, dict):
            data = {}
        return data

    def send_otp(self, email: str) -> None:
        """Ask Better Auth to email a one-time code to `email`.

        Returns normally on 2xx. Raises NeonAuthRejected on 4xx (e.g. rate
        limit, invalid email format accepted by us but rejected upstream)
        and NeonAuthUnavailable on network / 5xx.
        """
        self._post(
            "/email-otp/send-verification-otp",
            {"email": email, "type": "sign-in"},
        )

    def verify_otp(self, email: str, otp: str) -> VerifiedEmail:
        """Verify `(email, otp)`. Raises on any failure.

        On success returns a VerifiedEmail with the provider's user id when
        present in the response (Better Auth typically returns
        `{"data": {"user": {"id": "...", "email": "..."}, "session": {...}}}`
        but we don't depend on the exact shape — any 2xx is proof).
        """
        data = self._post(
            "/sign-in/email-otp",
            {"email": email, "otp": otp},
        )
        # Best-effort extraction of the provider user id for logging.
        user = {}
        if isinstance(data.get("data"), dict):
            user = data["data"].get("user") or {}
        elif isinstance(data.get("user"), dict):
            user = data["user"]
        provider_user_id = ""
        if isinstance(user, dict):
            uid = user.get("id")
            if isinstance(uid, str):
                provider_user_id = uid
            # Some Better Auth responses echo the email here too — prefer
            # the upstream one when it comes back, but fall back to the
            # email we submitted if it doesn't.
            resp_email = user.get("email")
            if isinstance(resp_email, str) and resp_email:
                email = resp_email
        return VerifiedEmail(email=email, provider_user_id=provider_user_id)
