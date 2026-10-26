"""NEXTRACE Investigation Model."""

import enum

from sqlalchemy import Column, DateTime, Enum, String, Text
from sqlalchemy.types import JSON

from app.db.base import Base, IDMixin, TimestampMixin


class InvestigationStatus(enum.StrEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    REVIEW = "review"
    CLOSED = "closed"
    ARCHIVED = "archived"


class Priority(enum.StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Investigation(Base, IDMixin, TimestampMixin):
    """An investigation that groups breach lookups, impersonation findings, and evidence."""

    __tablename__ = "investigations"

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(
        Enum(InvestigationStatus),
        default=InvestigationStatus.DRAFT,
        nullable=False,
    )
    created_by = Column(String(100), nullable=True)
    organization = Column(String(255), nullable=True)
    target_brand = Column(String(255), nullable=True)
    target_platform = Column(String(100), nullable=True)
    priority = Column(Enum(Priority), default=Priority.MEDIUM, nullable=False)
    tags = Column(JSON, default=list)
    closed_at = Column(DateTime(timezone=True), nullable=True)
