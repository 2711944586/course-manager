from datetime import datetime, timezone
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models.student import Student
from app.models.classroom import Classroom
from app.schemas.student import StudentCreate, StudentRead, StudentUpdate

router = APIRouter()


def _serialize_student(student: Student) -> dict[str, Any]:
    class_name = student.classroom.class_name if student.classroom else "未分班"
    return {
        "id": student.id,
        "name": student.name,
        "student_no": student.student_no,
        "gender": student.gender,
        "class_id": student.class_id,
        "birth_date": student.birth_date,
        "score": student.score,
        "updated_at": student.updated_at,
        "className": class_name,
    }


def _ensure_class_exists(db: Session, class_id: str | None) -> None:
    if class_id is None:
        return

    if db.get(Classroom, class_id) is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="班级不存在")


@router.get("/", response_model=List[StudentRead])
def read_students(db: Session = Depends(get_db)):
    """获取所有学生列表"""
    students = db.scalars(
        select(Student)
        .options(joinedload(Student.classroom))
        .order_by(Student.updated_at.desc())
    ).unique().all()
    return [_serialize_student(student) for student in students]


@router.get("/{student_id}", response_model=StudentRead)
def read_student(student_id: int, db: Session = Depends(get_db)):
    student = db.scalar(
        select(Student)
        .options(joinedload(Student.classroom))
        .where(Student.id == student_id)
    )
    if not student:
        raise HTTPException(status_code=404, detail="学生不存在")
    return _serialize_student(student)


@router.post("/", response_model=StudentRead, status_code=status.HTTP_201_CREATED)
def create_student(student_in: StudentCreate, db: Session = Depends(get_db)):
    _ensure_class_exists(db, student_in.class_id)
    student = Student(
        **student_in.model_dump(),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    db.refresh(student, attribute_names=["classroom"])
    return _serialize_student(student)


@router.put("/{student_id}", response_model=StudentRead)
def update_student(student_id: int, student_in: StudentUpdate, db: Session = Depends(get_db)):
    student = db.scalar(
        select(Student)
        .options(joinedload(Student.classroom))
        .where(Student.id == student_id)
    )
    if not student:
        raise HTTPException(status_code=404, detail="学生不存在")

    update_data = student_in.model_dump(exclude_unset=True)
    if "class_id" in update_data:
        _ensure_class_exists(db, update_data["class_id"])

    for field, value in update_data.items():
        setattr(student, field, value)

    student.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(student)
    db.refresh(student, attribute_names=["classroom"])
    return _serialize_student(student)


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="学生不存在")
    db.delete(student)
    db.commit()
