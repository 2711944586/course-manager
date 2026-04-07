from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings


def _build_connect_args() -> dict[str, object]:
    if settings.normalized_database_url.startswith("sqlite"):
        return {"check_same_thread": False}
    return {}


def _ensure_database_path() -> None:
    if not settings.normalized_database_url.startswith("sqlite:///"):
        return

    database_path = settings.normalized_database_url.removeprefix("sqlite:///")
    Path(database_path).parent.mkdir(parents=True, exist_ok=True)


_ensure_database_path()


engine = create_engine(
    settings.normalized_database_url,
    echo=settings.environment == "development",
    future=True,
    connect_args=_build_connect_args(),
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, class_=Session)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
