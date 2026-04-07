from pydantic import Field

from app.schemas.base import CamelModel


class SchoolClassRead(CamelModel):
    id: str
    class_name: str


class SchoolClassCreate(CamelModel):
    id: str = Field(min_length=2, max_length=32)
    class_name: str = Field(min_length=2, max_length=120)
