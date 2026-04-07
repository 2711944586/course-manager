from typing import List, Literal, Optional
from datetime import datetime
from pydantic import ConfigDict, Field
from .base import CamelModel

TeacherStatus = Literal['active', 'leave', 'pending']

class TeacherBase(CamelModel):
    employee_no: str
    name: str
    title: str
    department: str
    email: str
    phone: str
    office: str
    expertise: List[str]
    max_weekly_hours: int
    current_weekly_hours: int
    status: TeacherStatus
    active: bool

class TeacherCreate(TeacherBase):
    pass

class TeacherUpdate(CamelModel):
    employee_no: Optional[str] = None
    name: Optional[str] = None
    title: Optional[str] = None
    department: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    office: Optional[str] = None
    expertise: Optional[List[str]] = None
    max_weekly_hours: Optional[int] = None
    current_weekly_hours: Optional[int] = None
    status: Optional[TeacherStatus] = None
    active: Optional[bool] = None

class TeacherResponse(TeacherBase):
    id: int
    last_review_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
