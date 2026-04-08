from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from app.schemas.base import CamelModel


class StudentBase(CamelModel):
    name: str
    student_no: str
    gender: str
    class_id: Optional[str] = None
    birth_date: date
    score: int


class StudentCreate(StudentBase):
    pass


class StudentUpdate(CamelModel):
    name: Optional[str] = None
    student_no: Optional[str] = None
    gender: Optional[str] = None
    class_id: Optional[str] = None
    birth_date: Optional[date] = None
    score: Optional[int] = None


class StudentRead(StudentBase):
    id: int
    updated_at: datetime
    className: Optional[str] = None  # Mapped classroom name
