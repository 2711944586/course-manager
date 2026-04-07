from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.classroom import Classroom
    from app.models.enrollment import Enrollment


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    student_no: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    gender: Mapped[str] = mapped_column(String(16), index=True)
    class_id: Mapped[str | None] = mapped_column(ForeignKey("classes.id"), nullable=True, index=True)
    birth_date: Mapped[date] = mapped_column(Date)
    score: Mapped[int] = mapped_column(Integer)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)

    classroom: Mapped["Classroom"] = relationship(back_populates="students")
    enrollments: Mapped[list["Enrollment"]] = relationship(back_populates="student", cascade="all, delete-orphan")
