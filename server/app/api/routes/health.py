from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(prefix="/health")


@router.get("")
def read_health() -> dict[str, object]:
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "apiPrefix": settings.api_prefix,
    }
