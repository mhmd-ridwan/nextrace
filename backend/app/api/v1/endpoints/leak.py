"""NEXTRACE Leak Tracer & Breach Intelligence Endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.db.session import get_db
from app.schemas.leak import LeakCheckRequest, LeakCheckResponse
from app.services.breach_service import BreachService

router = APIRouter()
breach_service = BreachService()


@router.post("/check", response_model=LeakCheckResponse, summary="Query breach intelligence")
async def check_leak(
    request: LeakCheckRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Search whether an authorized identifier (email, phone, ID hash) appears in breach records.
    Never stores plaintext national IDs or sensitive unmasked values.
    Returns breach provenance and risk scoring.
    """
    return await breach_service.check_identifier(
        db=db,
        identifier=request.identifier,
        identifier_type=request.identifier_type,
        investigation_id=request.investigation_id,
    )


@router.get("/incidents", summary="List known breach incidents")
async def list_incidents(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve catalog of documented breach incidents with pagination."""
    return await breach_service.get_incidents(db, page, per_page)


@router.get("/incidents/{incident_id}", summary="Get breach incident detail")
async def get_incident(
    incident_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve details, exposed fields, and provenance for a single breach incident."""
    res = await breach_service.get_incident(db, incident_id)
    if not res:
        raise NotFoundError("Breach incident", incident_id)
    return res
