"""NEXTRACE Email Alias Models."""

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.types import JSON

from app.db.base import Base, IDMixin, TimestampMixin


class EmailAlias(Base, IDMixin, TimestampMixin):
    """A trackable email alias generated for leak source identification."""

    __tablename__ = "email_aliases"

    investigation_id = Column(String(36), ForeignKey("investigations.id"), nullable=True)
    service_label = Column(String(255), nullable=False)
    alias_address = Column(String(255), unique=True, nullable=False, index=True)
    primary_email_hash = Column(String(64), nullable=False)
    provider_type = Column(String(50), nullable=False)
    provider_status = Column(String(50), default="active")


class AliasInboundEvent(Base, IDMixin, TimestampMixin):
    """An inbound event received at a trackable email alias."""

    __tablename__ = "alias_inbound_events"

    alias_id = Column(String(36), ForeignKey("email_aliases.id"), nullable=False)
    sender_domain = Column(String(255), nullable=True)
    subject_snippet = Column(String(255), nullable=True)
    received_at = Column(DateTime(timezone=True), nullable=False)
    headers_meta = Column(JSON, default=dict)
    message_fingerprint = Column(String(64), nullable=True)
    evidence_provenance = Column(Text, nullable=True)
