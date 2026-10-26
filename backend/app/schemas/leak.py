"""NEXTRACE Leak / Breach Schemas."""

import re
from datetime import UTC, datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, model_validator


class IdentifierType(StrEnum):
    EMAIL = "email"
    PHONE = "phone"
    ID_HASH = "id_hash"


class LeakCheckRequest(BaseModel):
    """Request to check an identifier against breach databases."""

    model_config = ConfigDict(from_attributes=True)

    identifier: str = Field(..., min_length=3, max_length=255)
    identifier_type: IdentifierType
    investigation_id: str | None = None

    @model_validator(mode="after")
    def validate_identifier_format(self) -> "LeakCheckRequest":
        v = self.identifier.strip()
        id_type = self.identifier_type
        if id_type == IdentifierType.EMAIL:
            if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", v):
                raise ValueError("Invalid email format")
        elif id_type == IdentifierType.PHONE:
            cleaned = re.sub(r"[\s\-\(\)]", "", v)
            if not re.match(r"^\+?\d{8,16}$", cleaned):
                raise ValueError("Invalid phone number format")
        elif id_type == IdentifierType.ID_HASH:
            cleaned = re.sub(r"[\s\-\.]", "", v)
            if re.match(r"^\d{16}$", cleaned):
                # 16-digit Indonesian National ID (NIK) accepted and will be hashed
                pass
            elif not re.match(r"^[a-fA-F0-9]{64}$", cleaned):
                raise ValueError("Format NIK harus 16 digit angka atau 64-karakter SHA-256 hash")
        self.identifier = v
        return self


class BreachIncidentResponse(BaseModel):
    """Response for a single breach incident."""

    model_config = ConfigDict(from_attributes=True)

    incident_id: str
    source_name: str
    source_type: str
    breach_date: datetime | None = None
    reported_date: datetime | None = None
    exposed_fields: list[str] = []
    record_count: int | None = None
    confidence: float = 0.0
    severity: str = "medium"
    source_url: str | None = None
    description: str | None = None
    verification_status: str = "unverified"
    is_synthetic: bool = True
    lookup_timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))


class RiskAssessment(BaseModel):
    """Transparent risk assessment with explanations."""

    score: float = Field(ge=0, le=100)
    level: str  # low, medium, high, critical
    factors: list[dict] = []
    explanation: str = ""


class IntelligenceMetadata(BaseModel):
    """Carrier, network, and domain enrichment data."""

    model_config = ConfigDict(from_attributes=True)

    carrier: str | None = None
    operator_group: str | None = None
    country: str = "Indonesia (+62)"
    line_type: str | None = None
    prefix: str | None = None
    is_valid_format: bool = True
    is_disposable_email: bool = False
    disposable_service: str | None = None
    fraud_risk_score: int | None = None
    telecom_category: str | None = None
    threat_vectors: list[str] = []
    remediation_steps: list[str] = []


class LeakCheckResponse(BaseModel):
    """Response for a breach check operation."""

    model_config = ConfigDict(from_attributes=True)

    query: str | None = None
    investigation_id: str | None = None
    identifier_type: str
    identifier_masked: str
    total_incidents: int = 0
    risk_score: float = 0.0
    risk_level: str = "low"
    risk_factors: list[str] = []
    risk_assessment: RiskAssessment | None = None
    intelligence_metadata: IntelligenceMetadata | None = None
    incidents: list[BreachIncidentResponse] = []
    checked_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    provider_name: str = "local_synthetic"
    disclaimer: str = (
        "Results are based on the available dataset. "
        "No match does not guarantee the identifier has never been compromised. "
        "Synthetic demo records are clearly labeled."
    )
