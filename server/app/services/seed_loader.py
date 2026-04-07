from __future__ import annotations

import json
from datetime import date, datetime
from pathlib import Path
from typing import Any

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models import ActivityLog, Classroom, Course, Enrollment, Student, Teacher

DEFAULT_CLASSES = [
    {'id': 'CS2021', 'className': '计算机 2021 级'},
    {'id': 'SE2021', 'className': '软件工程 2021 级'},
    {'id': 'AI2021', 'className': '人工智能 2021 级'},
    {'id': 'NET2021', 'className': '网络工程 2021 级'},
    {'id': 'DS2021', 'className': '数据科学 2021 级'},
    {'id': 'BUS2021', 'className': '数字商务 2021 级'},
]


def _parse_datetime(value: str | None) -> datetime | None:
    if value is None:
        return None
    normalized = value.replace('Z', '+00:00')
    return datetime.fromisoformat(normalized)


def _parse_date(value: str) -> date:
    return date.fromisoformat(value)


def load_workspace_seed(session: Session, payload: dict[str, Any]) -> dict[str, int]:
    classes = payload.get('classes', DEFAULT_CLASSES)
    teachers = payload.get('teachers', [])
    courses = payload.get('courses', [])
    students = payload.get('students', [])
    enrollments = payload.get('enrollments', [])
    activities = payload.get('activities', [])

    session.execute(delete(Enrollment))
    session.execute(delete(Course))
    session.execute(delete(Student))
    session.execute(delete(Teacher))
    session.execute(delete(ActivityLog))
    session.execute(delete(Classroom))
    session.flush()

    class_entities = [
        Classroom(
            id=item['id'],
            class_name=item.get('className') or item.get('class_name') or item['id'],
        )
        for item in classes
    ]
    session.add_all(class_entities)
    session.flush()

    class_ids = [item.id for item in class_entities]

    teacher_entities = [
        Teacher(
            id=item['id'],
            employee_no=item['employeeNo'],
            name=item['name'],
            title=item['title'],
            department=item['department'],
            email=item['email'],
            phone=item['phone'],
            office=item['office'],
            expertise=list(item.get('expertise', [])),
            max_weekly_hours=item['maxWeeklyHours'],
            current_weekly_hours=item['currentWeeklyHours'],
            status=item['status'],
            active=item['active'],
            last_review_at=_parse_datetime(item['lastReviewAt']),
            updated_at=_parse_datetime(item['updatedAt']),
        )
        for item in teachers
    ]
    session.add_all(teacher_entities)
    session.flush()

    teacher_name_to_id = {teacher.name: teacher.id for teacher in teacher_entities}

    course_entities = [
        Course(
            id=item['id'],
            name=item['name'],
            teacher_id=teacher_name_to_id.get(item.get('instructor', '')),
            schedule=item['schedule'],
            description=item['description'],
            progress=item['progress'],
            status=item['status'],
            icon=item['icon'],
            updated_at=_parse_datetime(item['updatedAt']),
        )
        for item in courses
    ]
    session.add_all(course_entities)

    student_entities = [
        Student(
            id=item['id'],
            name=item['name'],
            student_no=item['studentNo'],
            gender=item['gender'],
            class_id=item.get('classId') or class_ids[(item['id'] - 1) % len(class_ids)] if class_ids else None,
            birth_date=_parse_date(item['birthDate']),
            score=item['score'],
            updated_at=_parse_datetime(item['updatedAt']),
        )
        for item in students
    ]
    session.add_all(student_entities)

    enrollment_entities = [
        Enrollment(
            id=item['id'],
            student_id=item['studentId'],
            course_id=item['courseId'],
            score=item.get('score'),
            grade=item.get('grade', 'N/A'),
            status=item['status'],
            workflow_status=item.get('workflowStatus', 'draft'),
            priority=item.get('priority', 'routine'),
            operator=item.get('operator', '教务运营台'),
            decision_reason=item.get('decisionReason', ''),
            decision_at=_parse_datetime(item.get('decisionAt')),
            sla_deadline=_parse_datetime(item['slaDeadline']),
            risk_flags=list(item.get('riskFlags', [])),
            enroll_date=_parse_datetime(item['enrollDate']),
            updated_at=_parse_datetime(item['updatedAt']),
        )
        for item in enrollments
    ]
    session.add_all(enrollment_entities)

    activity_entities = [
        ActivityLog(
            id=item['id'],
            action=item['action'],
            entity=item['entity'],
            entity_name=item['entityName'],
            detail=item['detail'],
            timestamp=_parse_datetime(item['timestamp']),
        )
        for item in activities
    ]
    session.add_all(activity_entities)

    session.commit()

    return {
        'classes': len(class_entities),
        'teachers': len(teacher_entities),
        'courses': len(course_entities),
        'students': len(student_entities),
        'enrollments': len(enrollment_entities),
        'activities': len(activity_entities),
    }


def load_workspace_seed_from_file(session: Session, file_path: str | Path) -> dict[str, int]:
    resolved_path = Path(file_path)
    payload = json.loads(resolved_path.read_text(encoding='utf-8'))
    return load_workspace_seed(session, payload)
