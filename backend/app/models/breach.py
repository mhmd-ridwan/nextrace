"""NEXTRACE Breach & Leak Models."""

import enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.types import JSON

from app.db.base import Base, IDMixin, TimestampMixin


class SourceType(enum.StrEnum):
    CONFIRMED = "confirmed"
    THIRD_PARTY = "third_party"
    SYNTHETIC = "synthetic"


class Severity(enum.StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IdentifierType(enum.StrEnum):
    EMAIL = "email"
    PHONE = "phone"
    ID_HASH = "id_hash"


class VerificationStatus(enum.StrEnum):
    UNVERIFIED = "unverified"
    PENDING = "pending"
    VERIFIED = "verified"
    DISPUTED = "disputed"


class BreachIncident(Base, IDMixin, TimestampMixin):
    """A known data breach incident from the breach intelligence dataset."""

    __tablename__ = "breach_incidents"

    source_name = Column(String(255), nullable=False)
    source_type = Column(Enum(SourceType), default=SourceType.SYNTHETIC, nullable=False)
    breach_date = Column(DateTime(timezone=True), nullable=True)
    reported_date = Column(DateTime(timezone=True), nullable=True)
    exposed_fields = Column(JSON, default=list)
    record_count = Column(Integer, nullable=True)
    severity = Column(Enum(Severity), default=Severity.MEDIUM, nullable=False)
    source_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    matching_patterns = Column(JSON, default=list)
    is_synthetic = Column(Boolean, default=True, nullable=False)


class BreachLookupResult(Base, IDMixin, TimestampMixin):
    """Result of a breach lookup for an identifier."""

    __tablename__ = "breach_lookup_results"

    investigation_id = Column(String(36), ForeignKey("investigations.id"), nullable=True)
    incident_id = Column(String(36), ForeignKey("breach_incidents.id"), nullable=False)
    identifier_type = Column(Enum(IdentifierType), nullable=False)
    identifier_hash = Column(String(64), nullable=False, index=True)
    matched = Column(Boolean, default=False, nullable=False)
    confidence = Column(Float, default=0.0)
    verification_status = Column(
        Enum(VerificationStatus),
        default=VerificationStatus.UNVERIFIED,
    )
    risk_score = Column(Float, default=0.0)
    risk_factors = Column(JSON, default=list)
    lookup_timestamp = Column(DateTime(timezone=True), nullable=False)
    provider_name = Column(String(100), default="local_synthetic")
