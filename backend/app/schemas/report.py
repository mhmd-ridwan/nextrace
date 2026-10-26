"""NEXTRACE Report Schemas."""

from datetime import UTC, datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class ReportTypeEnum(StrEnum):
    TAKEDOWN = "takedown"
    BREACH_SUMMARY = "breach_summary"
    INVESTIGATION_FULL = "investigation_full"
    BUZZER_THREAT_DOSSIER = "buzzer_threat_dossier"


class ReportFormatEnum(StrEnum):
    JSON = "json"
    PDF = "pdf"


class ReportGenerateRequest(BaseModel):
    """Request to generate a report."""

    model_config = ConfigDict(from_attributes=True)

    investigation_id: str | None = None
    report_type: ReportTypeEnum = ReportTypeEnum.INVESTIGATION_FULL
    format: ReportFormatEnum = ReportFormatEnum.PDF
    target_platform: str | None = None
    reporting_organization: str | None = None
    contact_info: dict = Field(default_factory=dict)
    requested_action: str | None = None
    finding_ids: list[str] = Field(default_factory=list)


class ReportResponse(BaseModel):
    """Response for a generated report."""

    model_config = ConfigDict(from_attributes=True)

    report_id: str
    investigation_id: str | None = None
    report_type: str
    format: str
    status: str = "draft"
    version: str = "1.0"
    file_hash_sha256: str | None = None
    metadata: dict = {}
    generated_by: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    download_url: str | None = None


class ReportListResponse(BaseModel):
    """List of reports."""

    reports: list[ReportResponse] = []
    total: int = 0
