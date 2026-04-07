from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.enrollment import Enrollment
    from app.models.teacher import Teacher


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(160), index=True)
    teacher_id: Mapped[int | None] = mapped_column(ForeignKey("teachers.id"), nullable=True, index=True)
    schedule: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    progress: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(32), index=True)
    icon: Mapped[str] = mapped_column(String(64))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)

    teacher: Mapped["Teacher"] = relationship(back_populates="courses")
    enrollments: Mapped[list["Enrollment"]] = relationship(back_populates="course", cascade="all, delete-orphan")
