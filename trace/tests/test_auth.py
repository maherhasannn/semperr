"""Auth + session + CSRF + dashboard gate tests."""
from __future__ import annotations

from fastapi.testclient import TestClient


def _register(client: TestClient, email="op@example.com", pw="correct-horse-battery"):
    # Hit login page to seed CSRF cookie
    client.get("/trace/register")
    csrf = client.cookies.get("trace_csrf") or ""
    r = client.post(
        "/auth/register",
        json={"email": email, "password": pw, "invite_code": "test-invite"},
        headers={"X-CSRF-Token": csrf} if csrf else {},
    )
    return r


def test_register_requires_invite_code(client):
    client.get("/trace/register")
    csrf = client.cookies.get("trace_csrf") or ""
    r = client.post(
        "/auth/register",
        json={"email": "a@b.co", "password": "correct-horse-battery", "invite_code": "WRONG"},
        headers={"X-CSRF-Token": csrf} if csrf else {},
    )
    assert r.status_code == 403


def test_register_and_session_flow(client):
    r = _register(client)
    assert r.status_code == 201, r.text
    # Cookie present
    assert client.cookies.get("trace_session")
    # Access dashboard
    r2 = client.get("/trace/dashboard")
    assert r2.status_code == 200
    assert "Your sourcing mandates" in r2.text


def test_login_logout(client):
    _register(client, email="u1@example.com")
    # Login
    client.get("/trace/login")
    csrf = client.cookies.get("trace_csrf") or ""
    r = client.post(
        "/auth/login",
        json={"email": "u1@example.com", "password": "correct-horse-battery"},
        headers={"X-CSRF-Token": csrf} if csrf else {},
    )
    assert r.status_code == 200
    # Logout
    csrf = client.cookies.get("trace_csrf") or ""
    r = client.post("/auth/logout", headers={"X-CSRF-Token": csrf})
    assert r.status_code == 204
    # After logout, dashboard redirects to login
    r = client.get("/trace/dashboard")
    assert r.status_code == 302
    assert r.headers["location"].endswith("/trace/login")


def test_dashboard_auth_gate_redirects(client):
    # Fresh client; no session -> should be redirected to /trace/login
    r = client.get("/trace/dashboard")
    assert r.status_code == 302
    assert r.headers["location"].endswith("/trace/login")


def test_invalid_credentials(client):
    _register(client, email="good@example.com")
    # Clear cookies to simulate fresh attempt
    client.cookies.clear()
    client.get("/trace/login")
    csrf = client.cookies.get("trace_csrf") or ""
    r = client.post(
        "/auth/login",
        json={"email": "good@example.com", "password": "wrong-password-value"},
        headers={"X-CSRF-Token": csrf} if csrf else {},
    )
    assert r.status_code == 401
