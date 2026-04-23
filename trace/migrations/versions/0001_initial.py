"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-04-20
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=320), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False, server_default="operator"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "strategies",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_strategies_owner_id", "strategies", ["owner_id"])

    op.create_table(
        "signal_defs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("strategy_id", sa.Integer(), sa.ForeignKey("strategies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("weight", sa.Float(), nullable=False, server_default="1.0"),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
    )
    op.create_index("ix_signal_defs_strategy_id", "signal_defs", ["strategy_id"])

    run_status = sa.Enum(
        "pending", "running", "completed", "failed", name="run_status"
    )
    op.create_table(
        "runs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("strategy_id", sa.Integer(), sa.ForeignKey("strategies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("query_override", sa.Text(), nullable=True),
        sa.Column("status", run_status, nullable=False, server_default="pending"),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_runs_strategy_id", "runs", ["strategy_id"])
    op.create_index("ix_runs_user_id", "runs", ["user_id"])

    op.create_table(
        "company_results",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("run_id", sa.Integer(), sa.ForeignKey("runs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("company", sa.String(length=255), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("label", sa.String(length=32), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False, server_default=""),
        sa.Column("why_now", sa.Text(), nullable=False, server_default=""),
        sa.Column("opportunity_angle", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_company_results_run_id", "company_results", ["run_id"])
    op.create_index("ix_company_results_company", "company_results", ["company"])

    op.create_table(
        "signal_findings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("result_id", sa.Integer(), sa.ForeignKey("company_results.id", ondelete="CASCADE"), nullable=False),
        sa.Column("signal_type", sa.String(length=120), nullable=False),
        sa.Column("raw_phrase", sa.Text(), nullable=False, server_default=""),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("event_date", sa.Date(), nullable=True),
        sa.Column("source_url", sa.Text(), nullable=False, server_default=""),
        sa.Column("raw_text", sa.Text(), nullable=False, server_default=""),
        sa.Column("weight_applied", sa.Float(), nullable=False, server_default="0.0"),
    )
    op.create_index("ix_signal_findings_result_id", "signal_findings", ["result_id"])

    op.create_table(
        "score_snapshots",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("strategy_id", sa.Integer(), sa.ForeignKey("strategies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("run_id", sa.Integer(), sa.ForeignKey("runs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("company", sa.String(length=255), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("delta_from_prev", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_score_snapshots_strategy_id", "score_snapshots", ["strategy_id"])
    op.create_index("ix_score_snapshots_run_id", "score_snapshots", ["run_id"])
    op.create_index("ix_score_snapshots_company", "score_snapshots", ["company"])
    op.create_index(
        "ix_score_strategy_company_run", "score_snapshots", ["strategy_id", "company", "run_id"]
    )


def downgrade() -> None:
    op.drop_table("score_snapshots")
    op.drop_table("signal_findings")
    op.drop_table("company_results")
    op.drop_table("runs")
    sa.Enum(name="run_status").drop(op.get_bind(), checkfirst=True)
    op.drop_table("signal_defs")
    op.drop_table("strategies")
    op.drop_table("users")
