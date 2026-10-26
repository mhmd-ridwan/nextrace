"""NEXTRACE Alias Schemas."""

from datetime import UTC, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class AliasCreateRequest(BaseModel):
    """Request to generate a trackable email alias."""

    model_config = ConfigDict(from_attributes=True)

    service_label: str = Field(..., min_length=1, max_length=100)
    primary_email: EmailStr
    investigation_id: str | None = None


class AliasResponse(BaseModel):
    """Response for an email alias."""

    model_config = ConfigDict(from_attributes=True)

    alias_id: str
    service_label: str
    alias_address: str
    provider_type: str
    provider_status: str = "active"
    investigation_id: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class AliasListResponse(BaseModel):
    """List of aliases."""

    aliases: list[AliasResponse] = []
    total: int = 0


class InboundEventCreate(BaseModel):
    """Request to record an inbound event (for testing/demo)."""

    sender_domain: str = Field(..., min_length=1, max_length=255)
    subject_snippet: str | None = Field(None, max_length=255)
    received_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    headers_meta: dict = Field(default_factory=dict)
    message_fingerprint: str | None = None
    evidence_provenance: str | None = None


class InboundEventResponse(BaseModel):
    """Response for an inbound event."""

    model_config = ConfigDict(from_attributes=True)

    event_id: str
    alias_id: str
    alias_address: str | None = None
    sender_domain: str | None = None
    subject_snippet: str | None = None
    received_at: datetime | None = None
    message_fingerprint: str | None = None
    evidence_provenance: str | None = None
    created_at: datetime | None = None
