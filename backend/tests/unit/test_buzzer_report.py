"""Unit test for Buzzer Threat Dossier report generation and evidence vault."""

from pathlib import Path

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.evidence import EvidenceCreateRequest
from app.schemas.report import ReportFormatEnum, ReportGenerateRequest, ReportTypeEnum
from app.services.evidence_service import EvidenceService
from app.services.report_service import ReportService


@pytest.mark.asyncio
async def test_buzzer_threat_dossier_pdf_generation(test_db: AsyncSession):
    service = ReportService()
    req = ReportGenerateRequest(
        investigation_id="inv-test-buzzer",
        report_type=ReportTypeEnum.BUZZER_THREAT_DOSSIER,
        format=ReportFormatEnum.PDF,
        reporting_organization="Satgas Intelijen Siber NEXTRACE",
        target_platform="Instagram",
        requested_action="Investigasi & Takedown Akun Inautentik",
    )
    res = await service.generate_report(test_db, req)
    assert res.report_id is not None
    assert res.report_type == "buzzer_threat_dossier"
    assert res.file_hash_sha256 is not None
    assert len(res.file_hash_sha256) == 64

    # Verify file exists on disk
    file_path, media_type = await service.get_report_file(test_db, res.report_id)
    assert Path(file_path).exists()
    assert media_type == "application/pdf"
    assert Path(file_path).stat().st_size > 0


@pytest.mark.asyncio
async def test_evidence_service_push_with_auto_investigation(test_db: AsyncSession):
    ev_service = EvidenceService()
    req = EvidenceCreateRequest(
        investigation_id="inv-auto-vault-test",
        evidence_type="log",
        source_url="https://www.instagram.com/mhmmd.ridwan/",
        collection_method="osint_buzzer_hunter",
        metadata={"author": "mhmmd.ridwan", "risk_score": 0},
    )
    res = await ev_service.create_evidence(test_db, req)
    assert res.evidence_id is not None
    assert res.file_hash_sha256 is not None
    assert len(res.file_hash_sha256) == 64

    # Verify integrity passes
    verify_res = await ev_service.verify_integrity(test_db, res.evidence_id)
    assert verify_res.is_valid is True
    assert verify_res.actual_hash == res.file_hash_sha256
