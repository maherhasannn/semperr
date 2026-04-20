"""Vercel Python ASGI entrypoint.

Vercel's Python runtime auto-detects an ASGI-compatible `app` exported from
any file under /api. All routes are funnelled here via vercel.json rewrites.
"""
from __future__ import annotations

from app.main import app  # noqa: F401  -- re-exported for Vercel
