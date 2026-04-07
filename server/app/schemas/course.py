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
    updated_at: datetime


class CourseCreate(CourseBase):
    pass


class CourseUpdate(CamelModel):
    name: Optional[str] = None
    schedule: Optional[str] = None
    description: Optional[str] = None
    progress: Optional[int] = None
    status: Optional[str] = None
    icon: Optional[str] = None
    teacher_id: Optional[int] = None
    updated_at: Optional[datetime] = None


class CourseRead(CourseBase):
    id: int
    instructor: str
    students: int
