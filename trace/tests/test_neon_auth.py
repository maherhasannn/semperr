"""Neon Auth (Better Auth) email-OTP flow tests.

All HTTP calls to Better Auth are mocked at `app.auth.neon.httpx.post` so
the test suite never touches the network. The mock accepts `(url, *,
json, timeout)` and returns a stub Response with configurable status +
body.
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any, Callable

import pytest

from app.auth import invite as invite_mod
from app.auth import neon as neon_mod


# TestClient's default Host header is `testserver`; send a matching Origin
# so CSRF middleware accepts the POST. Browsers always set Origin on state-
# changing requests; tests must too.
_ORIGIN = {"Origin": "http://testserver"}


@dataclass
class _StubResp:
    status_code: int = 200
    _json: Any = field(default_factory=dict)
    text: str = ""

    def json(self) -> Any:
        return self._json


@dataclass
class _FakePoster:
    """Records calls to httpx.post and returns preprogrammed responses keyed
    by the endpoint path suffix."""

    responses: dict[str, _StubResp] = field(default_factory=dict)
    # Default for any path not in `responses`
    default: _StubResp = field(default_factory=_StubResp)
    calls: list[tuple[str, dict[str, Any]]] = field(default_factory=list)

    def __call__(self, url: str, *, json: dict, timeout=None) -> _StubResp:  # noqa: A002
        self.calls.append((url, json))
        for suffix, resp in self.responses.items():
            if url.endswith(suffix):
                return resp
        return self.default


@pytest.fixture
def fake_post(monkeypatch):
    """Patch httpx.post inside app.auth.neon and return the recorder."""
    poster = _FakePoster()
    monkeypatch.setattr(neon_mod.httpx, "post", poster)
    return poster


def _invite_post(client, email="op@example.com", code="test-invite"):
    client.get("/invite")
    csrf = client.cookies.get("trace_csrf") or ""
    headers = dict(_ORIGIN)
    if csrf:
        headers["X-CSRF-Token"] = csrf
    return client.post(
        "/invite",
        data={"email": email, "invite_code": code, "csrf_token": csrf},
        headers=headers,
    )


def _verify_post(client, otp="123456"):
    # /verify also needs a CSRF cookie; it was seeded by the /verify GET
    # redirect landing after /invite. For tests calling it directly, we
    # re-seed via GET /verify.
    client.get("/verify")
    csrf = client.cookies.get("trace_csrf") or ""
    headers = dict(_ORIGIN)
    if csrf:
        headers["X-CSRF-Token"] = csrf
    return client.post(
        "/verify",
        data={"otp": otp, "csrf_token": csrf},
        headers=headers,
    )


# ---- /invite -----------------------------------------------------------


def test_invite_valid_code_sends_otp_and_redirects_to_verify(client, fake_post):
    r = _invite_post(client)
    assert r.status_code == 303
    assert r.headers["location"] == "/verify"
    # We called Better Auth's send-verification-otp endpoint once
    paths = [url for url, _ in fake_post.calls]
    assert any(p.endswith("/email-otp/send-verification-otp") for p in paths)
    sent = [body for url, body in fake_post.calls
            if url.endswith("/email-otp/send-verification-otp")][0]
    assert sent["email"] == "op@example.com"
    assert sent["type"] == "sign-in"
    # Invite cookie set
    assert client.cookies.get("trace_invite")


def test_invite_invalid_code_returns_403_and_does_not_call_upstream(client, fake_post):
    r = _invite_post(client, code="WRONG")
    assert r.status_code == 403
    assert "invalid invite code" in r.text
    assert not client.cookies.get("trace_invite")
    # Upstream not called
    assert fake_post.calls == []


def test_invite_invalid_email_returns_400(client, fake_post):
    r = _invite_post(client, email="not-an-email")
    assert r.status_code == 400
    assert "valid email required" in r.text
    assert fake_post.calls == []


def test_invite_upstream_5xx_returns_503(client, fake_post):
    fake_post.responses["/email-otp/send-verification-otp"] = _StubResp(
        status_code=502, text="bad gateway"
    )
    r = _invite_post(client)
    assert r.status_code == 503
    assert "unreachable" in r.text
    # No invite cookie on failure
    assert not client.cookies.get("trace_invite")


def test_invite_upstream_4xx_returns_400_with_generic_message(client, fake_post):
    fake_post.responses["/email-otp/send-verification-otp"] = _StubResp(
        status_code=400, text='{"error":"invalid email"}'
    )
    r = _invite_post(client)
    assert r.status_code == 400
    assert "could not send code" in r.text
    assert not client.cookies.get("trace_invite")


# ---- /verify -----------------------------------------------------------


def test_verify_without_invite_cookie_redirects_to_invite(client):
    r = client.get("/verify")
    assert r.status_code == 302
    assert r.headers["location"].endswith("/invite")


def test_verify_happy_path_creates_user_and_session(client, fake_post):
    _invite_post(client, email="op@example.com")
    fake_post.responses["/sign-in/email-otp"] = _StubResp(
        status_code=200,
        _json={"data": {"user": {"id": "ba-user-abc", "email": "op@example.com"}}},
    )
    r = _verify_post(client, otp="123456")
    assert r.status_code == 303, r.text
    assert r.headers["location"] == "/dashboard"
    assert client.cookies.get("trace_session")
    # We actually called sign-in with the expected payload
    sent = [body for url, body in fake_post.calls
            if url.endswith("/sign-in/email-otp")][0]
    assert sent == {"email": "op@example.com", "otp": "123456"}
    # Dashboard loads for the fresh session.
    r2 = client.get("/dashboard", follow_redirects=False)
    assert r2.status_code == 200


def test_verify_bad_otp_returns_401(client, fake_post):
    _invite_post(client, email="op@example.com")
    fake_post.responses["/sign-in/email-otp"] = _StubResp(
        status_code=401, text='{"error":"invalid otp"}'
    )
    r = _verify_post(client, otp="000000")
    assert r.status_code == 401
    assert "invalid or expired code" in r.text
    assert not client.cookies.get("trace_session")


def test_verify_upstream_5xx_returns_503(client, fake_post):
    _invite_post(client, email="op@example.com")
    fake_post.responses["/sign-in/email-otp"] = _StubResp(status_code=503)
    r = _verify_post(client, otp="123456")
    assert r.status_code == 503
    assert "unreachable" in r.text


def test_verify_empty_otp_returns_400_without_upstream_call(client, fake_post):
    _invite_post(client, email="op@example.com")
    pre_calls = list(fake_post.calls)  # after /invite
    r = _verify_post(client, otp="")
    assert r.status_code == 400
    # No extra call to sign-in
    post_calls = [c for c in fake_post.calls if c not in pre_calls]
    assert all(not url.endswith("/sign-in/email-otp") for url, _ in post_calls)


def test_verify_rejects_provider_email_mismatch(client, fake_post):
    """Belt-and-braces login-CSRF defense: even if Better Auth accepts the
    OTP, refuse to mint a session when the echoed email doesn't match the
    invite cookie's email."""
    _invite_post(client, email="victim@example.com")
    fake_post.responses["/sign-in/email-otp"] = _StubResp(
        status_code=200,
        _json={"data": {"user": {"id": "x", "email": "attacker@example.com"}}},
    )
    r = _verify_post(client, otp="123456")
    assert r.status_code == 403
    assert "identity mismatch" in r.text
    assert not client.cookies.get("trace_session")


def test_verify_upsert_is_idempotent_across_sessions(client, fake_post):
    from app import database
    from app.models.user import User

    _invite_post(client, email="op@example.com")
    fake_post.responses["/sign-in/email-otp"] = _StubResp(
        status_code=200,
        _json={"data": {"user": {"id": "ba-1", "email": "op@example.com"}}},
    )
    r1 = _verify_post(client, otp="111111")
    assert r1.status_code == 303

    # Sign in again in a fresh browser session — still one user row.
    client.cookies.clear()
    _invite_post(client, email="op@example.com")
    fake_post.responses["/sign-in/email-otp"] = _StubResp(
        status_code=200,
        _json={"data": {"user": {"id": "ba-1", "email": "op@example.com"}}},
    )
    r2 = _verify_post(client, otp="222222")
    assert r2.status_code == 303

    with database.SessionLocal() as s:
        users = s.query(User).all()
        assert len(users) == 1
        assert users[0].email == "op@example.com"


# ---- Invite cookie expiry ---------------------------------------------


def test_invite_cookie_expires_after_5min(monkeypatch):
    token = invite_mod.issue_invite_cookie("a@b.co")
    real_time = time.time

    def _later():
        return real_time() + invite_mod.INVITE_MAX_AGE_SECONDS + 10

    monkeypatch.setattr(invite_mod.time, "time", _later)
    assert invite_mod.verify_invite_cookie(token) is None


# ---- /logout -----------------------------------------------------------


def test_logout_clears_cookies(client, fake_post):
    _invite_post(client, email="op@example.com")
    fake_post.responses["/sign-in/email-otp"] = _StubResp(
        status_code=200,
        _json={"data": {"user": {"id": "ba-1", "email": "op@example.com"}}},
    )
    _verify_post(client, otp="123456")
    assert client.cookies.get("trace_session")

    csrf = client.cookies.get("trace_csrf") or ""
    r = client.post(
        "/logout",
        data={"csrf_token": csrf},
        headers={"X-CSRF-Token": csrf, **_ORIGIN},
    )
    assert r.status_code == 303
    assert r.headers["location"] == "/invite"
    # Dashboard requires auth again.
    client.cookies.clear()
    r2 = client.get("/dashboard")
    assert r2.status_code == 302
    assert r2.headers["location"].endswith("/invite")


def test_dashboard_auth_gate_redirects_to_invite(client):
    r = client.get("/dashboard")
    assert r.status_code == 302
    assert r.headers["location"].endswith("/invite")


# ---- Rate limits & CSRF (unchanged from previous suite) ---------------


def test_invite_rate_limited_after_5_posts(client, fake_post):
    from app import main

    main._RL_STATE.clear()
    for _ in range(5):
        r = _invite_post(client, code="WRONG")
        assert r.status_code == 403
    r = _invite_post(client, code="WRONG")
    assert r.status_code == 429


def test_verify_rate_limited_after_10_posts(client, fake_post):
    from app import main

    _invite_post(client, email="op@example.com")
    main._RL_STATE.clear()
    fake_post.responses["/sign-in/email-otp"] = _StubResp(
        status_code=401, text="bad otp"
    )
    for _ in range(10):
        r = _verify_post(client, otp="000000")
        assert r.status_code == 401
    r = _verify_post(client, otp="000000")
    assert r.status_code == 429


def test_csrf_origin_mismatch_rejected(client):
    r = client.post(
        "/invite",
        data={"email": "x@y.co", "invite_code": "test-invite"},
        headers={"Origin": "https://testserver.evil.com"},
    )
    assert r.status_code == 403
    assert "origin" in r.text.lower()


def test_csrf_missing_origin_and_referer_rejected(client):
    r = client.post(
        "/invite",
        data={"email": "x@y.co", "invite_code": "test-invite"},
    )
    assert r.status_code == 403
    assert "origin" in r.text.lower() or "referer" in r.text.lower()


def test_csrf_accepts_matching_referer_when_origin_absent(client, fake_post):
    client.get("/invite")
    csrf = client.cookies.get("trace_csrf") or ""
    r = client.post(
        "/invite",
        data={"email": "x@y.co", "invite_code": "test-invite", "csrf_token": csrf},
        headers={
            "X-CSRF-Token": csrf,
            "Referer": "http://testserver/invite",
        },
    )
    # Valid invite code + matching referer → OTP sent → redirect to /verify.
    assert r.status_code == 303
    assert r.headers["location"] == "/verify"


def test_company_detail_rejects_oversized_path(client, fake_post):
    _invite_post(client, email="op@example.com")
    fake_post.responses["/sign-in/email-otp"] = _StubResp(
        status_code=200,
        _json={"data": {"user": {"id": "ba-1", "email": "op@example.com"}}},
    )
    _verify_post(client, otp="123456")
    r = client.get("/companies/" + ("A" * 500))
    assert r.status_code == 400, r.text
    r = client.get("/companies/" + "acme;rm%20-rf")
    assert r.status_code == 400


def test_rate_limiter_sweeps_stale_buckets():
    from app import main

    main._RL_STATE.clear()
    main._RL_LAST_SWEEP[0] = 0.0
    main._RL_STATE[("stale-client", "invite")] = [1.0]
    main._RL_LAST_SWEEP[0] = 0.0
    from fastapi.testclient import TestClient
    from app.main import app as _app

    c = TestClient(_app, follow_redirects=False)
    c.get("/invite")
    csrf = c.cookies.get("trace_csrf") or ""
    c.post(
        "/invite",
        data={"email": "x@y.co", "invite_code": "WRONG", "csrf_token": csrf},
        headers={"X-CSRF-Token": csrf, "Origin": "http://testserver"},
    )
    assert ("stale-client", "invite") not in main._RL_STATE


# ---- NeonAuthClient unit coverage -------------------------------------


def test_neon_client_requires_url(monkeypatch):
    """Instantiating the client with an empty NEON_AUTH_URL is a loud fail."""
    from app.config import Settings

    s = Settings(
        secret_key="x" * 32,
        invite_code="test-invite",
        database_url="sqlite+pysqlite:///:memory:",
        neon_auth_url="",
    )
    with pytest.raises(neon_mod.NeonAuthError):
        neon_mod.NeonAuthClient(s)


def test_neon_client_network_error_becomes_unavailable(monkeypatch):
    import httpx

    def _raise(*a, **kw):
        raise httpx.ConnectError("dns failure")

    monkeypatch.setattr(neon_mod.httpx, "post", _raise)
    c = neon_mod.NeonAuthClient()
    with pytest.raises(neon_mod.NeonAuthUnavailable):
        c.send_otp("a@b.co")
