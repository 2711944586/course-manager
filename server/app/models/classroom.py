from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.student import Student


class Classroom(Base):
    __tablename__ = "classes"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    class_name: Mapped[str] = mapped_column(String(120), unique=True, index=True)

    students: Mapped[list["Student"]] = relationship(back_populates="classroom")
