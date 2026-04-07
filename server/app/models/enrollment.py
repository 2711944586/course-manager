from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.course import Course
    from app.models.student import Student


class Enrollment(Base):
    __tablename__ = "enrollments"
    __table_args__ = (UniqueConstraint("student_id", "course_id", name="uq_enrollment_student_course"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), index=True)
    score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    grade: Mapped[str] = mapped_column(String(16), default="N/A")
    status: Mapped[str] = mapped_column(String(32), index=True)
    workflow_status: Mapped[str] = mapped_column(String(32), index=True)
    priority: Mapped[str] = mapped_column(String(32), index=True)
    operator: Mapped[str] = mapped_column(String(120), default="教务运营台")
    decision_reason: Mapped[str] = mapped_column(Text, default="")
    decision_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sla_deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    risk_flags: Mapped[list[str]] = mapped_column(JSON, default=list)
    enroll_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)

    student: Mapped["Student"] = relationship(back_populates="enrollments")
    course: Mapped["Course"] = relationship(back_populates="enrollments")
