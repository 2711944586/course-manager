from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.classroom import Classroom
from app.schemas.classroom import SchoolClassCreate, SchoolClassRead

router = APIRouter(prefix="/classes")


@router.get("", response_model=list[SchoolClassRead])
def list_classes(db: Session = Depends(get_db)) -> list[Classroom]:
    return list(db.scalars(select(Classroom).order_by(Classroom.id)).all())


@router.get("/{class_id}", response_model=SchoolClassRead)
def get_class(class_id: str, db: Session = Depends(get_db)) -> Classroom:
    school_class = db.get(Classroom, class_id)
    if school_class is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="班级不存在")
    return school_class


@router.post("", response_model=SchoolClassRead, status_code=status.HTTP_201_CREATED)
def create_class(payload: SchoolClassCreate, db: Session = Depends(get_db)) -> Classroom:
    existing = db.get(Classroom, payload.id)
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="班级编号已存在")

    school_class = Classroom(id=payload.id, class_name=payload.class_name)
    db.add(school_class)
    db.commit()
    db.refresh(school_class)
    return school_class


@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_class(class_id: str, db: Session = Depends(get_db)) -> Response:
    school_class = db.get(Classroom, class_id)
    if school_class is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="班级不存在")

    if school_class.students:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="班级下仍有关联学生，无法删除")

    db.delete(school_class)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
