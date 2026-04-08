from __future__ import annotations

from datetime import datetime
from typing import Optional

from app.schemas.base import CamelModel


class CourseBase(CamelModel):
    name: str
    schedule: str
    description: str
    progress: int
    status: str
    icon: str
    teacher_id: Optional[int] = None


class CourseCreate(CourseBase):
    instructor: Optional[str] = None


class CourseUpdate(CamelModel):
    name: Optional[str] = None
    schedule: Optional[str] = None
    description: Optional[str] = None
    progress: Optional[int] = None
    status: Optional[str] = None
    icon: Optional[str] = None
    teacher_id: Optional[int] = None
    instructor: Optional[str] = None


class CourseRead(CourseBase):
    id: int
    updated_at: datetime
    instructor: str
    students: int
