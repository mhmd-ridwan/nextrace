"""NEXTRACE Auth Dependency — FastAPI injectable current-user resolver."""

from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User, UserRole
from app.services.auth_service import get_user_by_id, resolve_current_user_from_token

_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token autentikasi tidak ditemukan.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = resolve_current_user_from_token(credentials.credentials)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid atau sudah kedaluwarsa.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    user = await get_user_by_id(db, payload["sub"])
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Akun tidak ditemukan atau telah dinonaktifkan.",
        )
    return user


def require_role(*roles: UserRole):
    """Factory returning a dependency that enforces role membership."""

    async def _check(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Akses ditolak. Peran '{current_user.role}' tidak memiliki izin untuk tindakan ini.",
            )
        return current_user

    return _check


require_admin = require_role(UserRole.ADMIN)
require_analyst_or_above = require_role(UserRole.ADMIN, UserRole.ANALYST)
