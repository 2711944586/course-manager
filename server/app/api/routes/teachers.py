from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from datetime import datetime, timezone

from app.db.session import get_db
from app.models.teacher import Teacher
from app.schemas.teacher import TeacherResponse, TeacherCreate, TeacherUpdate

router = APIRouter()

@router.get("", response_model=List[TeacherResponse])
def get_teachers(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    q: str | None = None,
    department: str | None = None,
    status: str | None = None,
    sort: str = "updatedAt",
    order: str = "desc"
) -> Any:
    # 1. Base Query
    query = db.query(Teacher)
    
    # 2. Search / Filter
    if q:
        query = query.filter(
            or_(
                Teacher.name.ilike(f"%{q}%"),
                Teacher.employee_no.ilike(f"%{q}%"),
                Teacher.email.ilike(f"%{q}%")
            )
        )
        
    if department:
        query = query.filter(Teacher.department == department)
        
    if status:
        query = query.filter(Teacher.status == status)

    # 3. Sorting
    sort_column = getattr(Teacher, sort, Teacher.updated_at)
    # 兼容驼峰传参
    if sort == "updatedAt":
        sort_column = Teacher.updated_at
    elif sort == "employeeNo":
        sort_column = Teacher.employee_no
    elif sort == "maxWeeklyHours":
        sort_column = Teacher.max_weekly_hours
    elif sort == "currentWeeklyHours":
        sort_column = Teacher.current_weekly_hours
    
    if order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))
        
    teachers = query.offset(skip).limit(limit).all()
    return teachers

@router.get("/{teacher_id}", response_model=TeacherResponse)
def get_teacher(teacher_id: int, db: Session = Depends(get_db)) -> Any:
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher

@router.post("", response_model=TeacherResponse)
def create_teacher(
    *,
    db: Session = Depends(get_db),
    teacher_in: TeacherCreate
) -> Any:
    teacher = db.query(Teacher).filter(Teacher.employee_no == teacher_in.employee_no).first()
    if teacher:
        raise HTTPException(status_code=400, detail="Teacher with this employee_no already exists")
    
    db_obj = Teacher(
        **teacher_in.model_dump(),
        last_review_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{teacher_id}", response_model=TeacherResponse)
def update_teacher(
    *,
    db: Session = Depends(get_db),
    teacher_id: int,
    teacher_in: TeacherUpdate
) -> Any:
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
        
    update_data = teacher_in.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    for field, value in update_data.items():
        setattr(teacher, field, value)
        
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    return teacher

@router.delete("/{teacher_id}")
def delete_teacher(
    *,
    db: Session = Depends(get_db),
    teacher_id: int
) -> Any:
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    db.delete(teacher)
    db.commit()
    return {"message": "Teacher deleted successfully"}
