from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, asc
from datetime import datetime, timezone, timedelta

from app.db.session import get_db
from app.models.enrollment import Enrollment
from app.models.student import Student
from app.models.course import Course
from app.schemas.enrollment import EnrollmentResponse, EnrollmentCreate, EnrollmentUpdate

router = APIRouter()

def compute_grade(score: int | None) -> str:
    if score is None:
        return "N/A"
    if score >= 90:
        return "A"
    elif score >= 80:
        return "B"
    elif score >= 70:
        return "C"
    elif score >= 60:
        return "D"
    return "F"

@router.get("", response_model=List[EnrollmentResponse])
def get_enrollments(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    student_id: int | None = None,
    course_id: int | None = None,
    status: str | None = None,
    sort: str = "updatedAt",
    order: str = "desc"
) -> Any:
    query = db.query(Enrollment).options(
        joinedload(Enrollment.student),
        joinedload(Enrollment.course)
    )
    
    if student_id:
        query = query.filter(Enrollment.student_id == student_id)
    if course_id:
        query = query.filter(Enrollment.course_id == course_id)
    if status:
        query = query.filter(Enrollment.status == status)

    sort_column = getattr(Enrollment, sort, Enrollment.updated_at)
    if sort == "updatedAt":
        sort_column = Enrollment.updated_at
    elif sort == "score":
        sort_column = Enrollment.score
    
    if order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))
        
    enrollments = query.offset(skip).limit(limit).all()
    
    results = []
    for enr in enrollments:
        dto = EnrollmentResponse.model_validate(enr)
        if enr.student:
            dto.student_name = enr.student.name
        if enr.course:
            dto.course_name = enr.course.name
        results.append(dto)
        
    return results

@router.get("/{enrollment_id}", response_model=EnrollmentResponse)
def get_enrollment(enrollment_id: int, db: Session = Depends(get_db)) -> Any:
    enr = db.query(Enrollment).options(
        joinedload(Enrollment.student),
        joinedload(Enrollment.course)
    ).filter(Enrollment.id == enrollment_id).first()
    
    if not enr:
        raise HTTPException(status_code=404, detail="Enrollment not found")
        
    dto = EnrollmentResponse.model_validate(enr)
    if enr.student:
        dto.student_name = enr.student.name
    if enr.course:
        dto.course_name = enr.course.name
    return dto

@router.post("", response_model=EnrollmentResponse)
def create_enrollment(
    *,
    db: Session = Depends(get_db),
    enr_in: EnrollmentCreate
) -> Any:
    # Check student and course
    student = db.query(Student).filter(Student.id == enr_in.student_id).first()
    if not student:
        raise HTTPException(status_code=400, detail="Student not found")
        
    course = db.query(Course).filter(Course.id == enr_in.course_id).first()
    if not course:
        raise HTTPException(status_code=400, detail="Course not found")
        
    existing = db.query(Enrollment).filter(
        Enrollment.student_id == enr_in.student_id,
        Enrollment.course_id == enr_in.course_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student is already enrolled in this course")
        
    now = datetime.now(timezone.utc)
    db_obj = Enrollment(
        **enr_in.model_dump(),
        grade=compute_grade(enr_in.score),
        sla_deadline=now + timedelta(days=7),
        enroll_date=now,
        updated_at=now
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{enrollment_id}", response_model=EnrollmentResponse)
def update_enrollment(
    *,
    db: Session = Depends(get_db),
    enrollment_id: int,
    enr_in: EnrollmentUpdate
) -> Any:
    enr = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
    if not enr:
        raise HTTPException(status_code=404, detail="Enrollment not found")
        
    update_data = enr_in.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc)
    if "score" in update_data:
        update_data["grade"] = compute_grade(update_data["score"])
        
    if update_data.get("workflow_status") in ["approved", "rejected"] and enr.workflow_status not in ["approved", "rejected"]:
        update_data["decision_at"] = datetime.now(timezone.utc)
    
    for field, value in update_data.items():
        setattr(enr, field, value)
        
    db.add(enr)
    db.commit()
    db.refresh(enr)
    return enr

@router.delete("/{enrollment_id}")
def delete_enrollment(
    *,
    db: Session = Depends(get_db),
    enrollment_id: int
) -> Any:
    enr = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
    if not enr:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    db.delete(enr)
    db.commit()
    return {"message": "Enrollment deleted successfully"}
