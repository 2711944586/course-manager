"""add classes and student class relation

Revision ID: 20260407_0002
Revises: 20260407_0001
Create Date: 2026-04-07 00:30:00
"""

from alembic import op
import sqlalchemy as sa

revision = '20260407_0002'
down_revision = '20260407_0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'classes',
        sa.Column('id', sa.String(length=32), nullable=False),
        sa.Column('class_name', sa.String(length=120), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_classes_class_name'), 'classes', ['class_name'], unique=True)
    with op.batch_alter_table('students', schema=None) as batch_op:
        batch_op.add_column(sa.Column('class_id', sa.String(length=32), nullable=True))
        batch_op.create_index(batch_op.f('ix_students_class_id'), ['class_id'], unique=False)
        batch_op.create_foreign_key('fk_students_class_id', 'classes', ['class_id'], ['id'])


def downgrade() -> None:
    with op.batch_alter_table('students', schema=None) as batch_op:
        batch_op.drop_constraint('fk_students_class_id', type_='foreignkey')
        batch_op.drop_index(batch_op.f('ix_students_class_id'))
        batch_op.drop_column('class_id')
    op.drop_index(op.f('ix_classes_class_name'), table_name='classes')
    op.drop_table('classes')
