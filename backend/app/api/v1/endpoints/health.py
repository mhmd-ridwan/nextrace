"""NEXTRACE Health & Readiness Endpoints."""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.session import get_db

router = APIRouter()


@router.get("", summary="Liveness check")
async def health_check():
    """Basic liveness probe."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(UTC).isoformat(),
    }


@router.get("/ready", summary="Readiness check")
async def readiness_check(db: AsyncSession = Depends(get_db)):
    """Readiness probe validating database connectivity."""
    try:
        await db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "ready" if db_status == "connected" else "not_ready",
        "database": db_status,
        "timestamp": datetime.now(UTC).isoformat(),
    }


@router.get("/info", summary="Platform metadata")
async def system_info():
    """Returns platform version, active modules, and demo mode indicator."""
    settings = get_settings()
    return {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
        "demo_mode": settings.DEMO_MODE,
        "capabilities": {
            "leak_tracer": "active",
            "impersonation_hunter": "active",
            "digital_evidence": "active",
            "takedown_reports": "active",
            "visual_phash": "active",
            "homoglyph_detector": "active",
        },
    }
