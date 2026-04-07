from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.student import Student
from app.models.classroom import Classroom
from app.schemas.student import StudentCreate, StudentRead, StudentUpdate

router = APIRouter()


@router.get("/", response_model=List[StudentRead])
def read_students(db: Session = Depends(get_db)):
    """获取所有学生列表"""
    students = db.scalars(select(Student)).all()
    results = []
    for student in students:
        class_name = student.classroom.grade + student.classroom.name if student.classroom else "未分班"
        
        # 将 date/datetime 用于 JSON 序列化，Pydantic 外层会协助转换
        student_dict = {
            "id": student.id,
            "name": student.name,
            "student_no": student.student_no,
            "gender": student.gender,
            "class_id": student.class_id,
            "birth_date": student.birth_date,
            "score": student.score,
            "updated_at": student.updated_at,
            "className": class_name
        }
        results.append(student_dict)

    return results


@router.get("/{student_id}", response_model=StudentRead)
def read_student(student_id: int, db: Session = Depends(get_db)):
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="学生不存在")

    class_name = student.classroom.grade + student.classroom.name if student.classroom else "未分班"

    return {
        "id": student.id,
        "name": student.name,
        "student_no": student.student_no,
        "gender": student.gender,
        "class_id": student.class_id,
        "birth_date": student.birth_date,
        "score": student.score,
        "updated_at": student.updated_at,
        "className": class_name
    }


@router.post("/", response_model=StudentRead, status_code=status.HTTP_201_CREATED)
def create_student(student_in: StudentCreate, db: Session = Depends(get_db)):
    student = Student(**student_in.model_dump())
    db.add(student)
    db.commit()
    db.refresh(student)

    class_name = student.classroom.grade + student.classroom.name if student.classroom else "未分班"

    return {
        "id": student.id,
        "name": student.name,
        "student_no": student.student_no,
        "gender": student.gender,
        "class_id": student.class_id,
        "birth_date": student.birth_date,
        "score": student.score,
        "updated_at": student.updated_at,
        "className": class_name
    }


@router.put("/{student_id}", response_model=StudentRead)
def update_student(student_id: int, student_in: StudentUpdate, db: Session = Depends(get_db)):
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="学生不存在")

    update_data = student_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(student, field, value)

    db.commit()
    db.refresh(student)

    class_name = student.classroom.grade + student.classroom.name if student.classroom else "未分班"

    return {
        "id": student.id,
        "name": student.name,
        "student_no": student.student_no,
        "gender": student.gender,
        "class_id": student.class_id,
        "birth_date": student.birth_date,
        "score": student.score,
        "updated_at": student.updated_at,
        "className": class_name
    }


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="学生不存在")
    db.delete(student)
    db.commit()
