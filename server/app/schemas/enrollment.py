from typing import List, Literal, Optional
from datetime import datetime
from pydantic import ConfigDict, Field
from .base import CamelModel

EnrollmentStatus = Literal['enrolled', 'completed', 'dropped']
EnrollmentWorkflowStatus = Literal['draft', 'pending-review', 'approved', 'rejected']
EnrollmentPriority = Literal['routine', 'attention', 'urgent']

class EnrollmentBase(CamelModel):
    student_id: int
    course_id: int
    score: Optional[int] = None
    status: str
    workflow_status: EnrollmentWorkflowStatus = 'draft'
    priority: EnrollmentPriority = 'routine'
    operator: str = '教务运营台'
    decision_reason: str = ''

class EnrollmentCreate(EnrollmentBase):
    pass

class EnrollmentUpdate(CamelModel):
    score: Optional[int] = None
    status: Optional[str] = None
    workflow_status: Optional[EnrollmentWorkflowStatus] = None
    priority: Optional[EnrollmentPriority] = None
    operator: Optional[str] = None
    decision_reason: Optional[str] = None

class EnrollmentResponse(EnrollmentBase):
    id: int
    grade: str
    decision_at: Optional[datetime] = None
    sla_deadline: datetime
    risk_flags: List[str]
    enroll_date: datetime
    updated_at: datetime
    
    # Client projection compatibility placeholders (if frontend queries these)
    student_name: Optional[str] = None
    course_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
