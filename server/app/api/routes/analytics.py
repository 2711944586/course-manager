from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.course import Course
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.enrollment import Enrollment
from app.schemas.analytics import AnalyticsDashboardResponse, SummaryCard, PassRateSummary

router = APIRouter()

def get_grade_distribution(db: Session):
    return db.query(
        Enrollment.grade,
        func.count(Enrollment.id).label('count')
    ).group_by(Enrollment.grade).all()
    
def get_pass_rate(db: Session, total_enrollments: int):
    # Pass grades are A, B, C, D (>= 60 essentially in enrollment grade logic)
    passed_count = db.query(func.count(Enrollment.id)).filter(Enrollment.grade.in_(['A', 'B', 'C', 'D'])).scalar() or 0
    failed_count = total_enrollments - passed_count
    
    rate = 0.0
    if total_enrollments > 0:
        rate = round((passed_count / total_enrollments) * 100, 2)
        
    return PassRateSummary(
        pass_rate=rate,
        total_passed=passed_count,
        total_failed=failed_count
    )

@router.get("/dashboard", response_model=AnalyticsDashboardResponse)
def get_dashboard_summary(db: Session = Depends(get_db)) -> Any:
    # Aggregations
    total_courses = db.query(func.count(Course.id)).scalar() or 0
    total_students = db.query(func.count(Student.id)).scalar() or 0
    total_teachers = db.query(func.count(Teacher.id)).scalar() or 0
    total_enrollments = db.query(func.count(Enrollment.id)).scalar() or 0
    
    summary = SummaryCard(
        total_courses=total_courses,
        total_students=total_students,
        total_teachers=total_teachers,
        total_enrollments=total_enrollments
    )
    
    grade_dist = get_grade_distribution(db)
    
    pass_rate_info = get_pass_rate(db, total_enrollments)
    
    return AnalyticsDashboardResponse(
        summary=summary,
        grade_distribution=[{"grade": gd[0] or "N/A", "count": gd[1]} for gd in grade_dist],
        pass_rate=pass_rate_info
    )
