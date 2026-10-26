"""NEXTRACE User Model."""

import enum

from sqlalchemy import Boolean, Column, Enum, String

from app.db.base import Base, IDMixin, TimestampMixin


class UserRole(enum.StrEnum):
    ADMIN = "admin"
    ANALYST = "analyst"
    VIEWER = "viewer"


class User(Base, IDMixin, TimestampMixin):
    """Application user for authentication and authorization."""

    __tablename__ = "users"

    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.ANALYST, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
