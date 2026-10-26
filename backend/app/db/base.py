"""
NEXTRACE Database Base Model and Declarative Base.
"""

import uuid
from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, String
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all database models."""

    pass


class TimestampMixin:
    """Mixin that adds created_at and updated_at timestamps."""

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=True,
    )


class IDMixin:
    """Mixin that adds a UUID primary key."""

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        nullable=False,
    )


# Import all models here so Alembic can detect them
def import_all_models():
    """Import all models to ensure they are registered with the Base metadata."""
    from app.models import (  # noqa: F401
        alias,
        breach,
        buzzer,
        evidence,
        finding,
        investigation,
        profile,
        report,
        user,
    )
