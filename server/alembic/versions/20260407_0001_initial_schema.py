"""initial schema

Revision ID: 20260407_0001
Revises: 
Create Date: 2026-04-07 00:00:00
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20260407_0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'activity_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(length=32), nullable=False),
        sa.Column('entity', sa.String(length=32), nullable=False),
        sa.Column('entity_name', sa.String(length=120), nullable=False),
        sa.Column('detail', sa.Text(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_activity_logs_action'), 'activity_logs', ['action'], unique=False)
    op.create_index(op.f('ix_activity_logs_entity'), 'activity_logs', ['entity'], unique=False)
    op.create_index(op.f('ix_activity_logs_timestamp'), 'activity_logs', ['timestamp'], unique=False)

    op.create_table(
        'students',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=120), nullable=False),
        sa.Column('student_no', sa.String(length=32), nullable=False),
        sa.Column('gender', sa.String(length=16), nullable=False),
        sa.Column('birth_date', sa.Date(), nullable=False),
        sa.Column('score', sa.Integer(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_students_gender'), 'students', ['gender'], unique=False)
    op.create_index(op.f('ix_students_name'), 'students', ['name'], unique=False)
    op.create_index(op.f('ix_students_student_no'), 'students', ['student_no'], unique=True)
    op.create_index(op.f('ix_students_updated_at'), 'students', ['updated_at'], unique=False)

    op.create_table(
        'teachers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('employee_no', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=120), nullable=False),
        sa.Column('title', sa.String(length=64), nullable=False),
        sa.Column('department', sa.String(length=120), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=32), nullable=False),
        sa.Column('office', sa.String(length=120), nullable=False),
        sa.Column('expertise', sa.JSON(), nullable=False),
        sa.Column('max_weekly_hours', sa.Integer(), nullable=False),
        sa.Column('current_weekly_hours', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('active', sa.Boolean(), nullable=False),
        sa.Column('last_review_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_teachers_department'), 'teachers', ['department'], unique=False)
    op.create_index(op.f('ix_teachers_employee_no'), 'teachers', ['employee_no'], unique=True)
    op.create_index(op.f('ix_teachers_name'), 'teachers', ['name'], unique=False)
    op.create_index(op.f('ix_teachers_status'), 'teachers', ['status'], unique=False)
    op.create_index(op.f('ix_teachers_updated_at'), 'teachers', ['updated_at'], unique=False)
    op.create_index('ix_teachers_email_unique', 'teachers', ['email'], unique=True)

    op.create_table(
        'courses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=160), nullable=False),
        sa.Column('teacher_id', sa.Integer(), nullable=True),
        sa.Column('schedule', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('progress', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('icon', sa.String(length=64), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['teacher_id'], ['teachers.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_courses_name'), 'courses', ['name'], unique=False)
    op.create_index(op.f('ix_courses_status'), 'courses', ['status'], unique=False)
    op.create_index(op.f('ix_courses_teacher_id'), 'courses', ['teacher_id'], unique=False)
    op.create_index(op.f('ix_courses_updated_at'), 'courses', ['updated_at'], unique=False)

    op.create_table(
        'enrollments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('score', sa.Integer(), nullable=True),
        sa.Column('grade', sa.String(length=16), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('workflow_status', sa.String(length=32), nullable=False),
        sa.Column('priority', sa.String(length=32), nullable=False),
        sa.Column('operator', sa.String(length=120), nullable=False),
        sa.Column('decision_reason', sa.Text(), nullable=False),
        sa.Column('decision_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('sla_deadline', sa.DateTime(timezone=True), nullable=False),
        sa.Column('risk_flags', sa.JSON(), nullable=False),
        sa.Column('enroll_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id']),
        sa.ForeignKeyConstraint(['student_id'], ['students.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('student_id', 'course_id', name='uq_enrollment_student_course'),
    )
    op.create_index(op.f('ix_enrollments_course_id'), 'enrollments', ['course_id'], unique=False)
    op.create_index(op.f('ix_enrollments_priority'), 'enrollments', ['priority'], unique=False)
    op.create_index(op.f('ix_enrollments_status'), 'enrollments', ['status'], unique=False)
    op.create_index(op.f('ix_enrollments_student_id'), 'enrollments', ['student_id'], unique=False)
    op.create_index(op.f('ix_enrollments_updated_at'), 'enrollments', ['updated_at'], unique=False)
    op.create_index(op.f('ix_enrollments_workflow_status'), 'enrollments', ['workflow_status'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_enrollments_workflow_status'), table_name='enrollments')
    op.drop_index(op.f('ix_enrollments_updated_at'), table_name='enrollments')
    op.drop_index(op.f('ix_enrollments_student_id'), table_name='enrollments')
    op.drop_index(op.f('ix_enrollments_status'), table_name='enrollments')
    op.drop_index(op.f('ix_enrollments_priority'), table_name='enrollments')
    op.drop_index(op.f('ix_enrollments_course_id'), table_name='enrollments')
    op.drop_table('enrollments')

    op.drop_index(op.f('ix_courses_updated_at'), table_name='courses')
    op.drop_index(op.f('ix_courses_teacher_id'), table_name='courses')
    op.drop_index(op.f('ix_courses_status'), table_name='courses')
    op.drop_index(op.f('ix_courses_name'), table_name='courses')
    op.drop_table('courses')

    op.drop_index('ix_teachers_email_unique', table_name='teachers')
    op.drop_index(op.f('ix_teachers_updated_at'), table_name='teachers')
    op.drop_index(op.f('ix_teachers_status'), table_name='teachers')
    op.drop_index(op.f('ix_teachers_name'), table_name='teachers')
    op.drop_index(op.f('ix_teachers_employee_no'), table_name='teachers')
    op.drop_index(op.f('ix_teachers_department'), table_name='teachers')
    op.drop_table('teachers')

    op.drop_index(op.f('ix_students_updated_at'), table_name='students')
    op.drop_index(op.f('ix_students_student_no'), table_name='students')
    op.drop_index(op.f('ix_students_name'), table_name='students')
    op.drop_index(op.f('ix_students_gender'), table_name='students')
    op.drop_table('students')

    op.drop_index(op.f('ix_activity_logs_timestamp'), table_name='activity_logs')
    op.drop_index(op.f('ix_activity_logs_entity'), table_name='activity_logs')
    op.drop_index(op.f('ix_activity_logs_action'), table_name='activity_logs')
    op.drop_table('activity_logs')
