"""NEXTRACE Report Model."""

import enum

from sqlalchemy import Column, Enum, ForeignKey, String
from sqlalchemy.types import JSON

from app.db.base import Base, IDMixin, TimestampMixin


class ReportType(enum.StrEnum):
    TAKEDOWN = "takedown"
    BREACH_SUMMARY = "breach_summary"
    INVESTIGATION_FULL = "investigation_full"
    BUZZER_THREAT_DOSSIER = "buzzer_threat_dossier"


class ReportFormat(enum.StrEnum):
    JSON = "json"
    PDF = "pdf"


class ReportStatus(enum.StrEnum):
    DRAFT = "draft"
    REVIEW = "review"
    FINALIZED = "finalized"


class GeneratedReport(Base, IDMixin, TimestampMixin):
    """A generated report for an investigation or specific findings."""

    __tablename__ = "generated_reports"

    investigation_id = Column(String(36), ForeignKey("investigations.id"), nullable=True)
    report_type = Column(Enum(ReportType), nullable=False)
    format = Column(Enum(ReportFormat), nullable=False)
    status = Column(Enum(ReportStatus), default=ReportStatus.DRAFT, nullable=False)
    version = Column(String(20), default="1.0")
    file_path = Column(String(500), nullable=True)
    file_hash_sha256 = Column(String(64), nullable=True)
    metadata_json = Column(JSON, default=dict)
    generated_by = Column(String(100), nullable=True)
