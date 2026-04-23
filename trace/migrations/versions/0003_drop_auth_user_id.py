"""drop auth_user_id — switch to Better Auth email-OTP (email is identity)

Revision ID: 0003_drop_auth_user_id
Revises: 0002_neon_auth
Create Date: 2026-04-21

Neon Auth migrated from Stack Auth (JWT callback) to Better Auth (email-OTP).
We no longer receive a stable provider user id up front; email is the key.
Wipes users (and their dependent rows) so the column can be dropped cleanly.
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0003_drop_auth_user_id"
down_revision = "0002_neon_auth"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Identity scheme change — wipe first so integer PKs restart cleanly.
    op.execute("DELETE FROM signal_findings")
    op.execute("DELETE FROM company_results")
    op.execute("DELETE FROM score_snapshots")
    op.execute("DELETE FROM runs")
    op.execute("DELETE FROM signal_defs")
    op.execute("DELETE FROM strategies")
    op.execute("DELETE FROM users")

    op.drop_index("ix_users_auth_user_id", table_name="users")
    op.drop_constraint("uq_users_auth_user_id", "users", type_="unique")
    op.drop_column("users", "auth_user_id")


def downgrade() -> None:
    op.add_column(
        "users",
        sa.Column("auth_user_id", sa.String(length=128), nullable=False, server_default=""),
    )
    op.create_unique_constraint("uq_users_auth_user_id", "users", ["auth_user_id"])
    op.create_index("ix_users_auth_user_id", "users", ["auth_user_id"])
