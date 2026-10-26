"""NEXTRACE Digital Evidence Management Endpoints."""

import json

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.db.session import get_db
from app.schemas.evidence import (
    CustodyEventCreate,
    CustodyEventResponse,
    EvidenceCreateRequest,
    EvidenceResponse,
    EvidenceVerifyResponse,
)
from app.services.evidence_service import EvidenceService

router = APIRouter()
evidence_service = EvidenceService()


@router.get("", summary="List evidence artifacts")
async def list_evidence(
    investigation_id: str | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List paginated evidence artifacts with custody summary."""
    return await evidence_service.list_evidence(db, investigation_id, page, per_page)


@router.post("", response_model=EvidenceResponse, summary="Ingest evidence artifact")
async def create_evidence(
    investigation_id: str = Form("inv-jokowi-001"),
    evidence_type: str = Form("document"),
    source_url: str | None = Form(None),
    collection_method: str = Form("manual_upload"),
    metadata: str | None = Form(None),
    file: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Ingest a digital evidence artifact (screenshot, export, raw packet/HTTP log).
    Computes cryptographic SHA-256 hash immediately for tamper detection.
    """
    parsed_metadata = {}
    if metadata:
        try:
            parsed_metadata = json.loads(metadata)
        except Exception:
            parsed_metadata = {"raw": metadata}

    data = EvidenceCreateRequest(
        investigation_id=investigation_id,
        evidence_type=evidence_type,
        source_url=source_url,
        collection_method=collection_method,
        metadata=parsed_metadata,
    )

    file_content = None
    filename = None
    if file:
        file_content = await file.read()
        filename = file.filename

    return await evidence_service.create_evidence(db, data, file_content, filename)


@router.get("/{evidence_id}", response_model=EvidenceResponse, summary="Get evidence artifact")
async def get_evidence(
    evidence_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve evidence artifact details and chain-of-custody audit trail."""
    res = await evidence_service.get_evidence(db, evidence_id)
    if not res:
        raise NotFoundError("Evidence artifact", evidence_id)
    return res


@router.get(
    "/{evidence_id}/verify",
    response_model=EvidenceVerifyResponse,
    summary="Verify SHA-256 integrity",
)
async def verify_evidence(
    evidence_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Recompute SHA-256 hash of the stored file on disk and compare against the custody log.
    Detects any local file tampering or bit-rot.
    """
    return await evidence_service.verify_integrity(db, evidence_id)


@router.post(
    "/{evidence_id}/custody",
    response_model=CustodyEventResponse,
    summary="Append custody audit event",
)
async def add_custody_event(
    evidence_id: str,
    event: CustodyEventCreate,
    db: AsyncSession = Depends(get_db),
):
    """Append an immutable chain-of-custody log event (review, export, or forensics check)."""
    res = await evidence_service.add_custody_event(db, evidence_id, event)
    if not res:
        raise NotFoundError("Evidence artifact", evidence_id)
    return res
