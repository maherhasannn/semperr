"""SQLAlchemy engine / session factory.

Tuned for serverless: small connection pool per warm instance, pre-ping to
recycle connections that a provider (e.g. Neon) may have closed between
invocations.
"""
from __future__ import annotations

from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings


class Base(DeclarativeBase):
    pass


_settings = get_settings()
_engine_kwargs: dict = {"pool_pre_ping": True, "future": True}
if not _settings.database_url.startswith("sqlite"):
    # Small pool: a single serverless instance handles few concurrent requests.
    # Use Neon's pooled endpoint (-pooler.*.neon.tech) for the outer fan-out.
    _engine_kwargs.update({"pool_size": 2, "max_overflow": 3, "pool_recycle": 300})
engine = create_engine(_settings.database_url, **_engine_kwargs)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
