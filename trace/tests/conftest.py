"""Test harness: in-process SQLite, mocked LLM/Exa, FastAPI TestClient."""
from __future__ import annotations

import os

os.environ.setdefault("SECRET_KEY", "x" * 32)
os.environ.setdefault("INVITE_CODE", "test-invite")
os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
os.environ.setdefault("GEMINI_API_KEY", "test-key")
os.environ.setdefault("EXA_API_KEY", "test-key")
os.environ.setdefault("NEON_AUTH_URL", "https://auth.test.local/testdb/auth")
os.environ.setdefault("ENV", "test")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool


@pytest.fixture(scope="session", autouse=True)
def _setup_schema():
    # Create tables on the shared in-memory engine
    from app import database
    from app.database import Base
    from app import models  # noqa: F401 — populate metadata

    engine = create_engine(
        "sqlite+pysqlite:///file:trace-test?mode=memory&cache=shared&uri=true",
        poolclass=StaticPool,
        connect_args={"check_same_thread": False, "uri": True},
        future=True,
    )
    # Replace module-level engine + SessionLocal with test engine
    database.engine = engine
    database.SessionLocal = sessionmaker(
        bind=engine, autoflush=False, autocommit=False, expire_on_commit=False
    )
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture(autouse=True)
def _clean_tables(_setup_schema):
    """Wipe tables + rate-limit state between tests to keep them independent."""
    yield
    from app import database, main
    from app.database import Base

    with database.engine.begin() as conn:
        for t in reversed(Base.metadata.sorted_tables):
            conn.execute(t.delete())
    main._RL_STATE.clear()


@pytest.fixture
def client(_setup_schema) -> TestClient:
    from app.main import app
    return TestClient(app, follow_redirects=False)


# ---- Mock LLM client ----

class FakeLLM:
    """Deterministic LLM stub. Returns minimal valid JSON for the requested schema."""

    def __init__(self, responses: dict[type, object] | None = None) -> None:
        self.responses = responses or {}
        self.calls: list[tuple[str, str, type]] = []

    async def generate_json(self, system, prompt, schema, *, temperature: float = 0.2):
        self.calls.append((system[:80], prompt[:120], schema))
        if schema in self.responses:
            return self.responses[schema]
        # Try to construct a minimal instance
        try:
            return schema()  # type: ignore[call-arg]
        except Exception:
            pass
        raise AssertionError(f"FakeLLM: no canned response for {schema}")


class FakeExa:
    def __init__(self, docs_by_query: dict[str, list] | None = None, default: list | None = None):
        self.docs_by_query = docs_by_query or {}
        self.default = default or []
        self.calls: list[str] = []

    async def search(self, query: str, *, num_results: int = 8):
        self.calls.append(query)
        return self.docs_by_query.get(query, self.default)
