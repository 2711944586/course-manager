from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.course import Course


class Teacher(Base):
    __tablename__ = "teachers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_no: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    title: Mapped[str] = mapped_column(String(64))
    department: Mapped[str] = mapped_column(String(120), index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    phone: Mapped[str] = mapped_column(String(32))
    office: Mapped[str] = mapped_column(String(120))
    expertise: Mapped[list[str]] = mapped_column(JSON, default=list)
    max_weekly_hours: Mapped[int] = mapped_column(Integer)
    current_weekly_hours: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(32), index=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_review_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)

    courses: Mapped[list["Course"]] = relationship(back_populates="teacher")
