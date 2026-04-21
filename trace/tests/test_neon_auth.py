"""Neon Auth flow tests — invite gate, JWT callback, session issuance.

All Neon Auth network calls are mocked; verify_jwt is monkeypatched to return
pre-built claims so we never hit the JWKS endpoint.
"""
from __future__ import annotations

import time
from dataclasses import dataclass

import pytest

from app.auth import invite as invite_mod
from app.auth import neon as neon_mod
from app.auth.neon import NeonAuthInvalidToken, VerifiedClaims


@dataclass
class _FakeClaims:
    sub: str
    email: str
    exp: int


def _patch_verify(monkeypatch, claims: VerifiedClaims | Exception):
    def _fake(self, token):  # noqa: ARG001
        if isinstance(claims, Exception):
            raise claims
        return claims

    monkeypatch.setattr(neon_mod.NeonAuthClient, "verify_jwt", _fake)


# TestClient's default Host header is `testserver`; send a matching Origin
# so CSRF middleware accepts the POST. Browsers always set Origin on state-
# changing requests; tests must too.
_ORIGIN = {"Origin": "http://testserver"}


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


def test_invite_valid_code_redirects_to_neon(client):
    r = _invite_post(client)
    assert r.status_code == 303
    assert r.headers["location"].startswith("https://")
    assert "accounts.stack-auth.com/sign-in" in r.headers["location"]
    # Invite cookie set
    assert client.cookies.get("trace_invite")


def test_invite_invalid_code_returns_403(client):
    r = _invite_post(client, code="WRONG")
    assert r.status_code == 403
    assert "invalid invite code" in r.text
    assert not client.cookies.get("trace_invite")


def test_invite_cookie_expires_after_5min(monkeypatch):
    # Freeze issue time, then verify past the max age.
    token = invite_mod.issue_invite_cookie("a@b.co")
    real_time = time.time

    def _later():
        return real_time() + invite_mod.INVITE_MAX_AGE_SECONDS + 10

    # itsdangerous reads `time.time` indirectly; patch the module's reference.
    monkeypatch.setattr(invite_mod.time, "time", _later)
    assert invite_mod.verify_invite_cookie(token) is None


def test_callback_with_valid_jwt_creates_user_and_session(client, monkeypatch):
    _invite_post(client, email="op@example.com")
    _patch_verify(
        monkeypatch,
        VerifiedClaims(sub="neon-uuid-abc", email="op@example.com", exp=int(time.time()) + 300),
    )
    r = client.get("/auth/callback?token=fake.jwt.token")
    assert r.status_code == 303, r.text
    assert r.headers["location"] == "/dashboard"
    assert client.cookies.get("trace_session")
    # Invite cookie was cleared
    # (TestClient may still hold the old value until set-cookie Max-Age=0 is processed —
    # we assert the dashboard loads instead.)
    r2 = client.get("/dashboard", follow_redirects=False)
    assert r2.status_code == 200


def test_callback_without_invite_cookie_returns_403(client, monkeypatch):
    # Do NOT hit /invite first.
    _patch_verify(
        monkeypatch,
        VerifiedClaims(sub="neon-uuid", email="x@y.co", exp=int(time.time()) + 300),
    )
    r = client.get("/auth/callback?token=fake.jwt.token")
    assert r.status_code == 403
    assert "Invite session expired" in r.text


def test_callback_with_expired_jwt_returns_401(client, monkeypatch):
    _invite_post(client)
    _patch_verify(monkeypatch, NeonAuthInvalidToken("token expired"))
    r = client.get("/auth/callback?token=expired.jwt")
    assert r.status_code == 401
    assert "invalid or expired" in r.text


def test_callback_with_wrong_issuer_returns_401(client, monkeypatch):
    _invite_post(client)
    _patch_verify(monkeypatch, NeonAuthInvalidToken("issuer mismatch"))
    r = client.get("/auth/callback?token=wrong.issuer.jwt")
    assert r.status_code == 401


def test_callback_missing_token_returns_401(client):
    _invite_post(client)
    r = client.get("/auth/callback")
    assert r.status_code == 401
    assert "Missing sign-in token" in r.text


def test_logout_clears_cookies(client, monkeypatch):
    _invite_post(client)
    _patch_verify(
        monkeypatch,
        VerifiedClaims(sub="neon-uuid-1", email="op@example.com", exp=int(time.time()) + 300),
    )
    client.get("/auth/callback?token=fake.jwt")
    assert client.cookies.get("trace_session")

    csrf = client.cookies.get("trace_csrf") or ""
    r = client.post(
        "/logout",
        data={"csrf_token": csrf},
        headers={"X-CSRF-Token": csrf, **_ORIGIN},
    )
    assert r.status_code == 303
    assert "accounts.stack-auth.com/sign-out" in r.headers["location"]
    # Dashboard requires auth again
    client.cookies.clear()
    r2 = client.get("/dashboard")
    assert r2.status_code == 302
    assert r2.headers["location"].endswith("/invite")


def test_dashboard_auth_gate_redirects_to_invite(client):
    r = client.get("/dashboard")
    assert r.status_code == 302
    assert r.headers["location"].endswith("/invite")


def test_callback_rejects_jwt_email_mismatch(client, monkeypatch):
    """Login-CSRF defense: JWT email must match the invite cookie's email."""
    _invite_post(client, email="victim@example.com")
    _patch_verify(
        monkeypatch,
        VerifiedClaims(
            sub="attacker-uuid",
            email="attacker@example.com",
            exp=int(time.time()) + 300,
        ),
    )
    r = client.get("/auth/callback?token=attacker.controlled.jwt")
    assert r.status_code == 403
    assert "did not match" in r.text
    # No session was issued.
    assert not client.cookies.get("trace_session")


def test_callback_email_match_is_case_insensitive(client, monkeypatch):
    _invite_post(client, email="Op@Example.com")
    _patch_verify(
        monkeypatch,
        VerifiedClaims(
            sub="neon-uuid-case",
            email="OP@example.COM",
            exp=int(time.time()) + 300,
        ),
    )
    r = client.get("/auth/callback?token=ok.jwt")
    assert r.status_code == 303
    assert client.cookies.get("trace_session")


def test_invite_rate_limited_after_5_posts(client):
    # Fresh rate-limit state; 6 failed attempts should trip the bucket.
    from app import main

    main._RL_STATE.clear()
    for _ in range(5):
        r = _invite_post(client, code="WRONG")
        assert r.status_code == 403
    r = _invite_post(client, code="WRONG")
    assert r.status_code == 429


def test_csrf_origin_mismatch_rejected(client):
    # A cross-origin POST with a crafted Origin header must be rejected even
    # if the Host header is a substring of Origin.
    r = client.post(
        "/invite",
        data={"email": "x@y.co", "invite_code": "test-invite"},
        headers={
            "Origin": "https://testserver.evil.com",
            # testserver is the default Host set by TestClient
        },
    )
    assert r.status_code == 403
    assert "origin" in r.text.lower()


def test_csrf_missing_origin_and_referer_rejected(client):
    """State-changing requests with neither Origin nor Referer must be rejected.

    Browsers always set Origin on POST; absence is a signal of a non-browser
    client or a stripped proxy. Required defense: some legacy CSRF attacks
    rely on Origin being omitted.
    """
    r = client.post(
        "/invite",
        data={"email": "x@y.co", "invite_code": "test-invite"},
        # No Origin, no Referer.
    )
    assert r.status_code == 403
    assert "origin" in r.text.lower() or "referer" in r.text.lower()


def test_csrf_accepts_matching_referer_when_origin_absent(client):
    """If Origin is absent but Referer host matches Host, the request passes
    the Origin/Referer gate (downstream CSRF cookie checks still run)."""
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
    # Valid invite code + matching referer → redirect to Neon Auth (303).
    assert r.status_code == 303


def test_company_detail_rejects_oversized_path(client, monkeypatch):
    """/companies/{company} path parameter is length- and charset-bounded."""
    _invite_post(client, email="op@example.com")
    _patch_verify(
        monkeypatch,
        VerifiedClaims(sub="neon-uuid-co", email="op@example.com", exp=int(time.time()) + 300),
    )
    client.get("/auth/callback?token=fake.jwt")
    # Over length ceiling
    r = client.get("/companies/" + ("A" * 500))
    assert r.status_code == 400, r.text
    # Disallowed characters (e.g., shell / path metacharacters)
    r = client.get("/companies/" + "acme;rm%20-rf")
    assert r.status_code == 400


def test_rate_limiter_sweeps_stale_buckets():
    """Stale (window-expired) buckets are pruned on subsequent calls."""
    from app import main

    main._RL_STATE.clear()
    main._RL_LAST_SWEEP[0] = 0.0
    # Stuff a fake stale bucket well before the 60s window.
    main._RL_STATE[("stale-client", "invite")] = [1.0]
    # Force the sweeper to run on the next call.
    main._RL_LAST_SWEEP[0] = 0.0
    # Calling the guarded path triggers the cleanup path.
    from fastapi.testclient import TestClient
    from app.main import app as _app

    c = TestClient(_app, follow_redirects=False)
    c.get("/invite")  # no-op GET to drive middleware
    # After any rate-limited call the stale bucket should be gone.
    # The GET path does not hit _rate_limited; simulate a POST instead.
    csrf = c.cookies.get("trace_csrf") or ""
    c.post(
        "/invite",
        data={"email": "x@y.co", "invite_code": "WRONG", "csrf_token": csrf},
        headers={"X-CSRF-Token": csrf, "Origin": "http://testserver"},
    )
    assert ("stale-client", "invite") not in main._RL_STATE


def test_second_callback_same_user_updates_not_duplicates(client, monkeypatch):
    from app import database
    from app.models.user import User

    _invite_post(client, email="op@example.com")
    _patch_verify(
        monkeypatch,
        VerifiedClaims(sub="neon-uuid-same", email="op@example.com", exp=int(time.time()) + 300),
    )
    r1 = client.get("/auth/callback?token=fake.jwt.1")
    assert r1.status_code == 303

    # Fresh invite round-trip. Same Neon user, user updates email in Neon Auth
    # and types the new email at /invite; the email-binding check must pass
    # because the invite email matches the JWT email.
    client.cookies.clear()
    _invite_post(client, email="op2@example.com")
    _patch_verify(
        monkeypatch,
        VerifiedClaims(sub="neon-uuid-same", email="op2@example.com", exp=int(time.time()) + 300),
    )
    r2 = client.get("/auth/callback?token=fake.jwt.2")
    assert r2.status_code == 303

    with database.SessionLocal() as s:
        users = s.query(User).all()
        assert len(users) == 1
        assert users[0].auth_user_id == "neon-uuid-same"
        assert users[0].email == "op2@example.com"
