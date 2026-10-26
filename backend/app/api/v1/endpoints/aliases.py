"""NEXTRACE Trackable Email Alias Endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.db.session import get_db
from app.schemas.alias import (
    AliasCreateRequest,
    AliasResponse,
    InboundEventCreate,
    InboundEventResponse,
)
from app.services.alias_service import AliasService

router = APIRouter()
alias_service = AliasService()


@router.post("/generate", response_model=AliasResponse, summary="Generate trackable email alias")
async def generate_alias(
    request: AliasCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate an isolated, trackable email alias for a specific vendor or service.
    Can be used to detect potential downstream credential or email exposure.
    """
    return await alias_service.generate_alias(
        db=db,
        service_label=request.service_label,
        primary_email=request.primary_email,
        investigation_id=request.investigation_id,
    )


@router.get("", response_model=list[AliasResponse], summary="List registered aliases")
async def list_aliases(
    investigation_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List trackable aliases, optionally filtered by investigation ID."""
    return await alias_service.list_aliases(db, investigation_id)


@router.get("/{alias_id}", summary="Get alias details and mapped events")
async def get_alias(
    alias_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get alias details along with chronological inbound event history."""
    alias = await alias_service.get_alias(db, alias_id)
    if not alias:
        raise NotFoundError("Email alias", alias_id)

    events = await alias_service.get_alias_events(db, alias_id)
    return {
        "alias": alias,
        "events": events,
        "note": "Attribution requires verified receipt of unsolicited messages on this isolated alias.",
    }


@router.post(
    "/{alias_id}/events",
    response_model=InboundEventResponse,
    summary="Record inbound email event",
)
async def record_inbound_event(
    alias_id: str,
    event: InboundEventCreate,
    db: AsyncSession = Depends(get_db),
):
    """Record an inbound message event mapped to an alias (inbound webhook / test harness)."""
    res = await alias_service.record_inbound_event(db, alias_id, event)
    if not res:
        raise NotFoundError("Email alias", alias_id)
    return res
