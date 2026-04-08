from datetime import datetime, timezone
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.db.session import get_db
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.teacher import Teacher
from app.schemas.course import CourseCreate, CourseRead, CourseUpdate

router = APIRouter()


def _serialize_course(course: Course) -> dict[str, Any]:
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
        "students": student_count,
    }


def _resolve_teacher_id(db: Session, teacher_id: int | None, instructor: str | None) -> int | None:
    if teacher_id is not None:
        teacher = db.get(Teacher, teacher_id)
        if teacher is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="授课教师不存在")
        return teacher.id

    normalized_instructor = instructor.strip() if isinstance(instructor, str) else ""
    if not normalized_instructor:
        return None

    teacher = db.scalar(select(Teacher).where(Teacher.name == normalized_instructor))
    if teacher is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="未找到匹配的授课教师，请先创建教师档案后再保存课程。",
        )

    return teacher.id


@router.get("/", response_model=List[CourseRead])
def read_courses(db: Session = Depends(get_db)):
    """获取所有课程，包含转换后的 instructor 和 students 数量"""
    courses = db.scalars(
        select(Course)
        .options(joinedload(Course.teacher), selectinload(Course.enrollments))
        .order_by(Course.updated_at.desc())
    ).unique().all()
    return [_serialize_course(course) for course in courses]


@router.get("/{course_id}", response_model=CourseRead)
def read_course(course_id: int, db: Session = Depends(get_db)):
    course = db.scalar(
        select(Course)
        .options(joinedload(Course.teacher), selectinload(Course.enrollments))
        .where(Course.id == course_id)
    )
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")
    return _serialize_course(course)


@router.post("/", response_model=CourseRead, status_code=status.HTTP_201_CREATED)
def create_course(course_in: CourseCreate, db: Session = Depends(get_db)):
    course = Course(
        name=course_in.name,
        teacher_id=_resolve_teacher_id(db, course_in.teacher_id, course_in.instructor),
        schedule=course_in.schedule,
        description=course_in.description,
        progress=course_in.progress,
        status=course_in.status,
        icon=course_in.icon,
        updated_at=datetime.now(timezone.utc),
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    db.refresh(course, attribute_names=["teacher", "enrollments"])
    return _serialize_course(course)


@router.put("/{course_id}", response_model=CourseRead)
def update_course(course_id: int, course_in: CourseUpdate, db: Session = Depends(get_db)):
    course = db.scalar(
        select(Course)
        .options(joinedload(Course.teacher), selectinload(Course.enrollments))
        .where(Course.id == course_id)
    )
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")

    update_data = course_in.model_dump(exclude_unset=True, exclude={"teacher_id", "instructor"})
    for field, value in update_data.items():
        setattr(course, field, value)

    if "teacher_id" in course_in.model_fields_set or "instructor" in course_in.model_fields_set:
        course.teacher_id = _resolve_teacher_id(db, course_in.teacher_id, course_in.instructor)

    course.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(course)
    db.refresh(course, attribute_names=["teacher", "enrollments"])
    return _serialize_course(course)


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(course_id: int, db: Session = Depends(get_db)) -> Response:
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")
    db.delete(course)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
