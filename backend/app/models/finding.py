"""NEXTRACE Impersonation Finding Model."""

import enum

from sqlalchemy import Boolean, Column, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.types import JSON

from app.db.base import Base, IDMixin, TimestampMixin


class RiskSeverity(enum.StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ReviewStatus(enum.StrEnum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    CONFIRMED = "confirmed"
    DISMISSED = "dismissed"


class ImpersonationFinding(Base, IDMixin, TimestampMixin):
    """Result of comparing a candidate profile against a brand baseline."""

    __tablename__ = "impersonation_findings"

    investigation_id = Column(String(36), ForeignKey("investigations.id"), nullable=True)
    baseline_id = Column(String(36), ForeignKey("brand_baselines.id"), nullable=False)
    candidate_id = Column(String(36), ForeignKey("candidate_profiles.id"), nullable=False)

    # Image similarity
    avatar_similarity_score = Column(Float, nullable=True)
    avatar_hash_distance = Column(Integer, nullable=True)
    avatar_algorithm = Column(String(50), nullable=True)

    # Username similarity
    username_similarity_score = Column(Float, nullable=True)
    display_name_similarity_score = Column(Float, nullable=True)

    # Homoglyph detection
    homoglyph_detected = Column(Boolean, default=False)
    confusable_chars = Column(JSON, default=list)

    # Link and contact analysis
    suspicious_links = Column(JSON, default=list)
    suspicious_contacts = Column(JSON, default=list)
    bio_indicators = Column(JSON, default=list)

    # Risk assessment
    risk_score = Column(Float, default=0.0)
    risk_severity = Column(Enum(RiskSeverity), default=RiskSeverity.LOW)
    risk_factors = Column(JSON, default=list)

    # Review
    analyst_notes = Column(Text, nullable=True)
    review_status = Column(Enum(ReviewStatus), default=ReviewStatus.PENDING)
