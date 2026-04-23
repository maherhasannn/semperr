"""Session token sign/verify + CSRF helpers. No secrets in logs."""
from __future__ import annotations

import hmac
import secrets
import time
from typing import Any

from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from app.config import get_settings


def _serializer() -> URLSafeTimedSerializer:
    s = get_settings()
    return URLSafeTimedSerializer(secret_key=s.secret_key, salt="trace.session.v1")


def issue_session_token(user_id: int) -> str:
    payload: dict[str, Any] = {"uid": user_id, "iat": int(time.time())}
    return _serializer().dumps(payload)


def verify_session_token(token: str) -> int | None:
    s = get_settings()
    try:
        payload = _serializer().loads(token, max_age=s.session_max_age_seconds)
    except (SignatureExpired, BadSignature, Exception):
        return None
    uid = payload.get("uid")
    return int(uid) if isinstance(uid, int) else None


# CSRF: double-submit token, compared in constant time
def new_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def csrf_equal(a: str | None, b: str | None) -> bool:
    if not a or not b:
        return False
    return hmac.compare_digest(a, b)
