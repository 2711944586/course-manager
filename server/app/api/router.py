from fastapi import APIRouter

from app.api.routes.classes import router as classes_router
from app.api.routes.health import router as health_router
from app.api.routes.courses import router as courses_router
from app.api.routes.students import router as students_router
from app.api.routes.teachers import router as teachers_router
from app.api.routes.enrollments import router as enrollments_router
from app.api.routes.analytics import router as analytics_router

api_router = APIRouter()
api_router.include_router(classes_router, tags=["classes"])
api_router.include_router(health_router, tags=["health"])

# Our new Iteration 4 routes didn't specify prefix inherently, so we inject them here
api_router.include_router(courses_router, prefix="/courses", tags=["courses"])
api_router.include_router(students_router, prefix="/students", tags=["students"])
api_router.include_router(teachers_router, prefix="/teachers", tags=["teachers"])
api_router.include_router(enrollments_router, prefix="/enrollments", tags=["enrollments"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
