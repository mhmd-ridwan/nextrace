"""NEXTRACE Profile Models (Brand Baseline & Candidate)."""

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.types import JSON

from app.db.base import Base, IDMixin, TimestampMixin


class BrandBaseline(Base, IDMixin, TimestampMixin):
    """The official brand/identity baseline for impersonation comparison."""

    __tablename__ = "brand_baselines"

    investigation_id = Column(String(36), ForeignKey("investigations.id"), nullable=True)
    brand_name = Column(String(255), nullable=False)
    official_username = Column(String(100), nullable=False)
    display_name = Column(String(255), nullable=False)
    avatar_path = Column(String(500), nullable=True)
    website_url = Column(String(500), nullable=True)
    contact_info = Column(JSON, default=dict)
    business_category = Column(String(100), nullable=True)


class CandidateProfile(Base, IDMixin, TimestampMixin):
    """A candidate profile to be analyzed for potential impersonation."""

    __tablename__ = "candidate_profiles"

    investigation_id = Column(String(36), ForeignKey("investigations.id"), nullable=True)
    platform = Column(String(100), nullable=False)
    profile_url = Column(String(500), nullable=True)
    username = Column(String(100), nullable=False)
    display_name = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    avatar_path = Column(String(500), nullable=True)
    contact_info = Column(JSON, default=dict)
    observation_timestamp = Column(DateTime(timezone=True), nullable=True)
    collection_method = Column(String(100), default="manual_submission")
