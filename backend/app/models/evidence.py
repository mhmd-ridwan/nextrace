"""NEXTRACE Evidence Models."""

import enum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.types import JSON

from app.db.base import Base, IDMixin, TimestampMixin


class EvidenceType(enum.StrEnum):
    SCREENSHOT = "screenshot"
    IMAGE = "image"
    DOCUMENT = "document"
    LOG = "log"
    HASH_RECORD = "hash_record"
    REPORT = "report"
    API_RESPONSE = "api_response"


class CustodyEventType(enum.StrEnum):
    COLLECTED = "collected"
    VERIFIED = "verified"
    PROCESSED = "processed"
    EXPORTED = "exported"
    REVIEWED = "reviewed"


class EvidenceArtifact(Base, IDMixin, TimestampMixin):
    """A piece of evidence linked to an investigation."""

    __tablename__ = "evidence_artifacts"

    investigation_id = Column(String(36), ForeignKey("investigations.id"), nullable=False)
    evidence_type = Column(Enum(EvidenceType), nullable=False)
    source_url = Column(String(500), nullable=True)
    collection_method = Column(String(100), nullable=True)
    observation_timestamp = Column(DateTime(timezone=True), nullable=True)
    collection_timestamp = Column(DateTime(timezone=True), nullable=True)
    file_path = Column(String(500), nullable=True)
    file_hash_sha256 = Column(String(64), nullable=True)
    metadata_json = Column(JSON, default=dict)
    processing_history = Column(JSON, default=list)


class EvidenceCustodyEvent(Base, IDMixin, TimestampMixin):
    """Chain-of-custody event log entry for evidence artifacts."""

    __tablename__ = "evidence_custody_events"

    evidence_id = Column(String(36), ForeignKey("evidence_artifacts.id"), nullable=False)
    event_type = Column(Enum(CustodyEventType), nullable=False)
    actor = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    event_timestamp = Column(DateTime(timezone=True), nullable=False)
    metadata_json = Column(JSON, default=dict)
