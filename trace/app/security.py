"""Password hashing + session token sign/verify. No secrets in logs."""
from __future__ import annotations

import hmac
import secrets
import time
from typing import Any

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from app.config import get_settings

_hasher = PasswordHasher()  # argon2id, sane defaults


def hash_password(plain: str) -> str:
    return _hasher.hash(plain)


def verify_password(hash_: str, plain: str) -> bool:
    try:
        return _hasher.verify(hash_, plain)
    except VerifyMismatchError:
        return False
    except Exception:
        return False


def needs_rehash(hash_: str) -> bool:
    try:
        return _hasher.check_needs_rehash(hash_)
    except Exception:
        return False


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
