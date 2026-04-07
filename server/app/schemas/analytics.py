from typing import List
from pydantic import BaseModel
from .base import CamelModel

class SummaryCard(CamelModel):
    total_courses: int
    total_students: int
    total_teachers: int
    total_enrollments: int

class GradeDistributionItem(CamelModel):
    grade: str
    count: int

class PassRateSummary(CamelModel):
    pass_rate: float
    total_passed: int
    total_failed: int

class AnalyticsDashboardResponse(CamelModel):
    summary: SummaryCard
    grade_distribution: List[GradeDistributionItem]
    pass_rate: PassRateSummary
