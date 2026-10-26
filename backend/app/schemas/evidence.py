"""NEXTRACE Evidence Schemas."""

from datetime import UTC, datetime

from pydantic import BaseModel, ConfigDict, Field


class EvidenceCreateRequest(BaseModel):
    """Request to create an evidence artifact."""

    model_config = ConfigDict(from_attributes=True)

    investigation_id: str
    evidence_type: str = "document"
    source_url: str | None = None
    collection_method: str = "manual_upload"
    observation_timestamp: datetime | None = None
    metadata: dict = Field(default_factory=dict)


class CustodyEventCreate(BaseModel):
    """Request to add a custody event."""

    event_type: str = "collected"
    actor: str = "system"
    description: str = ""
    metadata: dict = Field(default_factory=dict)


class CustodyEventResponse(BaseModel):
    """Response for a custody event."""

    model_config = ConfigDict(from_attributes=True)

    event_id: str
    evidence_id: str
    event_type: str
    actor: str | None = None
    description: str | None = None
    event_timestamp: datetime | None = None
    metadata: dict = {}


class EvidenceResponse(BaseModel):
    """Response for an evidence artifact."""

    model_config = ConfigDict(from_attributes=True)

    evidence_id: str
    investigation_id: str
    evidence_type: str
    source_url: str | None = None
    collection_method: str | None = None
    observation_timestamp: datetime | None = None
    collection_timestamp: datetime | None = None
    file_path: str | None = None
    file_hash_sha256: str | None = None
    metadata: dict = {}
    processing_history: list = []
    custody_events: list[CustodyEventResponse] = []
    created_at: datetime | None = None


class EvidenceVerifyResponse(BaseModel):
    """Response for evidence integrity verification."""

    evidence_id: str
    is_valid: bool
    expected_hash: str | None = None
    actual_hash: str | None = None
    message: str = ""
    verified_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
