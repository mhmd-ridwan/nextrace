"""NEXTRACE Auth Service — user CRUD, credential verification, and JWT issuance."""

from __future__ import annotations

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import (
    create_jwt_token,
    decode_jwt_token,
    hash_password,
    verify_password,
)
from app.models.user import User, UserRole
from app.schemas.auth import TokenResponse, UserCreateRequest, UserProfile

_settings = get_settings()

_DEMO_USERS: list[dict] = [
    {
        "id": "user-admin-001",
        "username": "admin",
        "email": "admin@nextrace.id",
        "full_name": "Admin Nextrace",
        "role": UserRole.ADMIN,
        "password": "nextrace2026",
    },
    {
        "id": "user-owner-001",
        "username": "owner",
        "email": "owner@taya.web.id",
        "full_name": "TAYA System Owner",
        "role": UserRole.ADMIN,
        "password": "nextrace2026",
    },
    {
        "id": "user-analyst-001",
        "username": "analis",
        "email": "analis@nextrace.id",
        "full_name": "Analis Siber",
        "role": UserRole.ANALYST,
        "password": "analis2026",
    },
    {
        "id": "user-viewer-001",
        "username": "viewer",
        "email": "viewer@nextrace.id",
        "full_name": "Viewer OSINT",
        "role": UserRole.VIEWER,
        "password": "viewer2026",
    },
]


async def ensure_demo_users(db: AsyncSession) -> None:
    """Seed initial system users idempotently."""
    for u in _DEMO_USERS:
        existing = await db.execute(
            select(User).where(
                or_(
                    User.username == u["username"],
                    User.email == u["email"],
                )
            )
        )
        if existing.scalar_one_or_none():
            continue

        user = User(
            id=u["id"],
            username=u["username"],
            email=u["email"],
            full_name=u["full_name"],
            role=u["role"],
            hashed_password=hash_password(u["password"]),
            is_active=True,
        )
        db.add(user)

    await db.commit()


async def authenticate_user(
    db: AsyncSession,
    identifier: str,
    password: str,
) -> User | None:
    """Return the User if credentials are valid, supporting username or email."""
    ident = identifier.strip().lower()
    result = await db.execute(
        select(User).where(
            or_(
                User.username.ilike(ident),
                User.email.ilike(ident),
            )
        )
    )
    user: User | None = result.scalar_one_or_none()

    if not user or not user.is_active:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def issue_token(user: User) -> TokenResponse:
    """Create and return a signed JWT access token for the given user."""
    expires_in = _settings.JWT_EXPIRE_MINUTES * 60
    payload = {
        "sub": user.id,
        "username": user.username,
        "role": user.role.value,
    }
    token = create_jwt_token(
        data=payload,
        secret_key=_settings.SECRET_KEY,
        algorithm=_settings.JWT_ALGORITHM,
        expires_minutes=_settings.JWT_EXPIRE_MINUTES,
    )
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=expires_in,
        user=UserProfile.model_validate(user),
    )


async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, payload: UserCreateRequest) -> User:
    user = User(
        username=payload.username,
        email=payload.email,
        full_name=payload.full_name,
        role=payload.role,
        hashed_password=hash_password(payload.password),
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


def resolve_current_user_from_token(token: str) -> dict:
    """Decode JWT and return the raw payload dict (sub, username, role)."""
    return decode_jwt_token(
        token=token,
        secret_key=_settings.SECRET_KEY,
        algorithm=_settings.JWT_ALGORITHM,
    )
