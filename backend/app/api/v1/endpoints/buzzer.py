"""NEXTRACE Buzzer & Coordinated Comment Threat Intelligence Endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.db.session import get_db
from app.schemas.buzzer import (
    BuzzerScanRequest,
    BuzzerScanResponse,
    BuzzerStatsResponse,
)
from app.services.buzzer_service import BuzzerService

router = APIRouter()
buzzer_service = BuzzerService()


@router.post(
    "/scan",
    response_model=BuzzerScanResponse,
    summary="Scan post comments for buzzer & threat lures",
)
async def scan_comments(
    request: BuzzerScanRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Execute dual-layer forensic scan on a post or profile comment section:
    1. Detects inauthentic astroturfing & buzzer networks (CIB, handle entropy, ratio asymmetry).
    2. Identifies threat lures (phishing WhatsApp contacts, giveaway scams, target seeking/doxxing).
    """
    return await buzzer_service.scan_comments(db, request)


@router.get(
    "/scans",
    response_model=list[BuzzerScanResponse],
    summary="List recent buzzer scans",
)
async def list_scans(
    investigation_id: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve history of analyzed social media posts and comment threads."""
    return await buzzer_service.list_scans(db, investigation_id, limit)


@router.get(
    "/scans/{scan_id}",
    response_model=BuzzerScanResponse,
    summary="Get full scan report",
)
async def get_scan(
    scan_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full algorithmic breakdown for a specific comment scan session."""
    res = await buzzer_service.get_scan(db, scan_id)
    if not res:
        raise NotFoundError("BuzzerScan", scan_id)
    return res


@router.delete("/scans/{scan_id}", summary="Delete buzzer scan")
async def delete_scan(
    scan_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Delete a scan report and all its analyzed comment records."""
    success = await buzzer_service.delete_scan(db, scan_id)
    if not success:
        raise NotFoundError("BuzzerScan", scan_id)
    return {"success": True, "message": f"Scan {scan_id} deleted"}


@router.get("/stats", response_model=BuzzerStatsResponse, summary="Get buzzer threat telemetry")
async def get_stats(
    db: AsyncSession = Depends(get_db),
):
    """Get high-level summary metrics for executive dashboard and threat telemetry."""
    return await buzzer_service.get_stats(db)
