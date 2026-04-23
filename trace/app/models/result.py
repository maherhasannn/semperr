from __future__ import annotations

from datetime import date, datetime
from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CompanyResult(Base):
    __tablename__ = "company_results"

    id: Mapped[int] = mapped_column(primary_key=True)
    run_id: Mapped[int] = mapped_column(ForeignKey("runs.id", ondelete="CASCADE"), index=True)
    company: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    label: Mapped[str] = mapped_column(String(32), nullable=False)  # Low/Medium/High
    summary: Mapped[str] = mapped_column(Text, default="", nullable=False)
    why_now: Mapped[str] = mapped_column(Text, default="", nullable=False)
    opportunity_angle: Mapped[str] = mapped_column(Text, default="", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    run = relationship("Run", back_populates="results")
    findings: Mapped[list["SignalFinding"]] = relationship(
        back_populates="result", cascade="all, delete-orphan"
    )


class SignalFinding(Base):
    __tablename__ = "signal_findings"

    id: Mapped[int] = mapped_column(primary_key=True)
    result_id: Mapped[int] = mapped_column(
        ForeignKey("company_results.id", ondelete="CASCADE"), index=True
    )
    signal_type: Mapped[str] = mapped_column(String(120), nullable=False)  # canonical
    raw_phrase: Mapped[str] = mapped_column(Text, default="", nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    event_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    source_url: Mapped[str] = mapped_column(Text, default="", nullable=False)
    raw_text: Mapped[str] = mapped_column(Text, default="", nullable=False)
    weight_applied: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    result = relationship("CompanyResult", back_populates="findings")
