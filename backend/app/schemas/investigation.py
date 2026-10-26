"""NEXTRACE Investigation Schemas."""

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class InvestigationStatusEnum(StrEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    REVIEW = "review"
    CLOSED = "closed"
    ARCHIVED = "archived"


class PriorityEnum(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class InvestigationCreate(BaseModel):
    """Request to create an investigation."""

    model_config = ConfigDict(from_attributes=True)

    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    organization: str | None = None
    target_brand: str | None = None
    target_platform: str | None = None
    priority: PriorityEnum = PriorityEnum.MEDIUM
    tags: list[str] = Field(default_factory=list)


class InvestigationUpdate(BaseModel):
    """Request to update an investigation."""

    title: str | None = None
    description: str | None = None
    status: InvestigationStatusEnum | None = None
    priority: PriorityEnum | None = None
    tags: list[str] | None = None


class InvestigationStats(BaseModel):
    """Statistics for an investigation."""

    findings_count: int = 0
    evidence_count: int = 0
    reports_count: int = 0
    breach_lookups_count: int = 0
    aliases_count: int = 0
    high_risk_findings: int = 0


class InvestigationResponse(BaseModel):
    """Response for an investigation."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    description: str | None = None
    status: str = "draft"
    created_by: str | None = None
    organization: str | None = None
    target_brand: str | None = None
    target_platform: str | None = None
    priority: str = "medium"
    tags: list[str] = []
    stats: InvestigationStats = Field(default_factory=InvestigationStats)
    created_at: datetime | None = None
    updated_at: datetime | None = None
    closed_at: datetime | None = None


class TimelineEvent(BaseModel):
    """An event in the investigation timeline."""

    event_id: str
    event_type: str
    event_source: str = "analyst"  # observed, reported, analyst, synthetic
    timestamp: datetime
    title: str
    description: str = ""
    related_entity_type: str | None = None
    related_entity_id: str | None = None
    metadata: dict = {}


class InvestigationTimeline(BaseModel):
    """Timeline of events for an investigation."""

    investigation_id: str
    events: list[TimelineEvent] = []
    total_events: int = 0
