"""NEXTRACE Takedown & Incident Report Endpoints."""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.db.session import get_db
from app.schemas.report import ReportGenerateRequest, ReportResponse
from app.services.report_service import ReportService

router = APIRouter()
report_service = ReportService()


@router.post(
    "/generate",
    response_model=ReportResponse,
    summary="Generate takedown/evidence report",
)
async def generate_report(
    request: ReportGenerateRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate an auditable digital report (PDF or JSON).
    Embeds findings, visual similarity scores, links, and SHA-256 evidence manifest.
    Marked as DRAFT for mandatory human review.
    """
    return await report_service.generate_report(db, request)


@router.get("", summary="List generated reports")
async def list_reports(
    investigation_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List historical reports generated for an investigation or across all cases."""
    reports = await report_service.list_reports(db, investigation_id)
    return {"reports": reports, "total": len(reports)}


@router.get("/{report_id}", response_model=ReportResponse, summary="Get report metadata")
async def get_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve metadata, SHA-256 hash, and download URL for a generated report."""
    res = await report_service.get_report(db, report_id)
    if not res:
        raise NotFoundError("Report", report_id)
    return res


@router.get("/{report_id}/download", summary="Download report file (PDF/JSON)")
async def download_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Download the binary PDF dossier or structured JSON report document."""
    res = await report_service.get_report_file(db, report_id)
    if not res:
        raise NotFoundError("Report file", report_id)

    file_path, content_type = res
    filename = f"nextrace_evidence_{report_id[:8]}"
    if content_type == "application/json":
        filename += ".json"
    else:
        filename += ".pdf"

    return FileResponse(
        path=file_path,
        media_type=content_type,
        filename=filename,
    )
