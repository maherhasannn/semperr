from __future__ import annotations

from datetime import datetime
from sqlalchemy import DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Strategy(Base):
    __tablename__ = "strategies"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    signals: Mapped[list["SignalDef"]] = relationship(
        back_populates="strategy",
        cascade="all, delete-orphan",
        order_by="SignalDef.id",
    )
    runs: Mapped[list["Run"]] = relationship(back_populates="strategy", cascade="all, delete-orphan")  # type: ignore[name-defined] # noqa: F821


class SignalDef(Base):
    __tablename__ = "signal_defs"

    id: Mapped[int] = mapped_column(primary_key=True)
    strategy_id: Mapped[int] = mapped_column(
        ForeignKey("strategies.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)  # canonical signal_type
    weight: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)

    strategy: Mapped[Strategy] = relationship(back_populates="signals")
