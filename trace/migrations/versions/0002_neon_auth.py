"""neon auth — drop password_hash, add auth_user_id + email_verified_at

Destructive: wipes all user-scoped data before altering the schema.

Revision ID: 0002_neon_auth
Revises: 0001_initial
Create Date: 2026-04-21
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0002_neon_auth"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Wipe data first — user identity moves to Neon Auth and integer PKs reset.
    op.execute("DELETE FROM signal_findings")
    op.execute("DELETE FROM company_results")
    op.execute("DELETE FROM score_snapshots")
    op.execute("DELETE FROM runs")
    op.execute("DELETE FROM signal_defs")
    op.execute("DELETE FROM strategies")
    op.execute("DELETE FROM users")

    op.drop_column("users", "password_hash")
    op.add_column(
        "users",
        sa.Column("auth_user_id", sa.String(length=128), nullable=False),
    )
    op.add_column(
        "users",
        sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_unique_constraint("uq_users_auth_user_id", "users", ["auth_user_id"])
    op.create_index("ix_users_auth_user_id", "users", ["auth_user_id"])


def downgrade() -> None:
    op.drop_index("ix_users_auth_user_id", table_name="users")
    op.drop_constraint("uq_users_auth_user_id", "users", type_="unique")
    op.drop_column("users", "email_verified_at")
    op.drop_column("users", "auth_user_id")
    op.add_column(
        "users",
        sa.Column(
            "password_hash", sa.String(length=255), nullable=False, server_default=""
        ),
    )
