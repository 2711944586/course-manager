from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.teacher import Teacher
from app.schemas.course import CourseCreate, CourseRead, CourseUpdate

router = APIRouter()


@router.get("/", response_model=List[CourseRead])
def read_courses(db: Session = Depends(get_db)):
    """获取所有课程，包含转换后的 instructor 和 students 数量"""
    courses = db.scalars(select(Course)).all()
    results = []
    for course in courses:
        # 获取关联信息，用于前端显示映射
        instructor_name = course.teacher.name if course.teacher else "待定"
        student_count = len(course.enrollments) if course.enrollments else 0

        # 由于 Pydantic model_validate 有严格对应映射，我们将 SQLAlchemy Model 解析并替换字段
        course_dict = {
            "id": course.id,
            "name": course.name,
            "teacher_id": course.teacher_id,
            "schedule": course.schedule,
            "description": course.description,
            "progress": course.progress,
            "status": course.status,
            "icon": course.icon,
            "updated_at": course.updated_at,
            "instructor": instructor_name,
            "students": student_count
        }
        results.append(course_dict)

    return results


@router.get("/{course_id}", response_model=CourseRead)
def read_course(course_id: int, db: Session = Depends(get_db)):
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")

    instructor_name = course.teacher.name if course.teacher else "待定"
    student_count = len(course.enrollments) if course.enrollments else 0

    return {
        "id": course.id,
        "name": course.name,
        "teacher_id": course.teacher_id,
        "schedule": course.schedule,
        "description": course.description,
        "progress": course.progress,
        "status": course.status,
        "icon": course.icon,
        "updated_at": course.updated_at,
        "instructor": instructor_name,
        "students": student_count
    }


@router.post("/", response_model=CourseRead, status_code=status.HTTP_201_CREATED)
def create_course(course_in: CourseCreate, db: Session = Depends(get_db)):
    course = Course(**course_in.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)

    instructor_name = course.teacher.name if course.teacher else "待定"
    student_count = 0  # 刚创建肯定没人选

    return {
        "id": course.id,
        "name": course.name,
        "teacher_id": course.teacher_id,
        "schedule": course.schedule,
        "description": course.description,
        "progress": course.progress,
        "status": course.status,
        "icon": course.icon,
        "updated_at": course.updated_at,
        "instructor": instructor_name,
        "students": student_count
    }


@router.put("/{course_id}", response_model=CourseRead)
def update_course(course_id: int, course_in: CourseUpdate, db: Session = Depends(get_db)):
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")

    update_data = course_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(course, field, value)

    db.commit()
    db.refresh(course)

    instructor_name = course.teacher.name if course.teacher else "待定"
    student_count = len(course.enrollments) if course.enrollments else 0

    return {
        "id": course.id,
        "name": course.name,
        "teacher_id": course.teacher_id,
        "schedule": course.schedule,
        "description": course.description,
        "progress": course.progress,
        "status": course.status,
        "icon": course.icon,
        "updated_at": course.updated_at,
        "instructor": instructor_name,
        "students": student_count
    }


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(course_id: int, db: Session = Depends(get_db)):
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")
    db.delete(course)
    db.commit()
