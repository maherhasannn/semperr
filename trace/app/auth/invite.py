"""Signed invite cookie — gates access to Neon Auth sign-in.

Uses the shared SECRET_KEY with a distinct salt from the session serializer
so the two cookies can never be confused even if someone copies a value.
"""
from __future__ import annotations

import secrets
import time
from typing import Any

from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from app.config import get_settings

INVITE_COOKIE = "trace_invite"
INVITE_MAX_AGE_SECONDS = 5 * 60  # 5 minutes — enough to click a magic link


def _serializer() -> URLSafeTimedSerializer:
    s = get_settings()
    return URLSafeTimedSerializer(secret_key=s.secret_key, salt="trace.invite.v1")


def issue_invite_cookie(email: str) -> str:
    payload: dict[str, Any] = {
        "email": email,
        "nonce": secrets.token_urlsafe(16),
        "iat": int(time.time()),
    }
    return _serializer().dumps(payload)


def verify_invite_cookie(token: str | None) -> dict[str, Any] | None:
    if not token:
        return None
    try:
        data = _serializer().loads(token, max_age=INVITE_MAX_AGE_SECONDS)
    except (SignatureExpired, BadSignature, Exception):
        return None
    if not isinstance(data, dict):
        return None
    email = data.get("email")
    if not isinstance(email, str) or not email:
        return None
    return data
