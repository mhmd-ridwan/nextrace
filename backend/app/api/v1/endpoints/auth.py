"""NEXTRACE Auth Endpoints — login, /me, user management."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, require_admin
from app.core.security import hash_password, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    AdminResetPasswordRequest,
    ChangePasswordRequest,
    LoginRequest,
    TokenResponse,
    UserCreateRequest,
    UserProfile,
    UserUpdateRequest,
)
from app.services.auth_service import (
    authenticate_user,
    create_user,
    get_user_by_id,
    issue_token,
)

router = APIRouter()


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login dan dapatkan JWT access token",
)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    user = await authenticate_user(db, payload.username, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau kata sandi salah.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return issue_token(user)


@router.get(
    "/me",
    response_model=UserProfile,
    summary="Profil user yang sedang login",
)
async def get_me(current_user: User = Depends(get_current_user)) -> UserProfile:
    return UserProfile.model_validate(current_user)


@router.post(
    "/users",
    response_model=UserProfile,
    status_code=status.HTTP_201_CREATED,
    summary="Buat user baru (Admin only)",
)
async def create_new_user(
    payload: UserCreateRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> UserProfile:
    user = await create_user(db, payload)
    return UserProfile.model_validate(user)


@router.get(
    "/users",
    response_model=list[UserProfile],
    summary="Daftar seluruh user (Admin only)",
)
async def list_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[UserProfile]:
    from sqlalchemy import select

    from app.models.user import User as UserModel

    result = await db.execute(select(UserModel).order_by(UserModel.created_at))
    users = result.scalars().all()
    return [UserProfile.model_validate(u) for u in users]


@router.post(
    "/change-password",
    summary="Ganti kata sandi",
)
async def change_password(
    payload: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kata sandi saat ini tidak sesuai.",
        )
    current_user.hashed_password = hash_password(payload.new_password)
    db.add(current_user)
    await db.commit()
    return {"success": True, "message": "Kata sandi berhasil diperbarui."}


@router.patch(
    "/users/{user_id}",
    response_model=UserProfile,
    summary="Perbarui data user atau role (Admin only)",
)
async def update_user(
    user_id: str,
    payload: UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> UserProfile:
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User tidak ditemukan.",
        )
    if user.id == admin.id:
        if payload.is_active is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Anda tidak dapat menonaktifkan akun admin Anda sendiri.",
            )
        if payload.role and payload.role != admin.role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Anda tidak dapat mengubah peran akun admin Anda sendiri.",
            )

    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.email is not None:
        user.email = payload.email
    if payload.role is not None:
        user.role = payload.role
    if payload.is_active is not None:
        user.is_active = payload.is_active

    db.add(user)
    await db.commit()
    await db.refresh(user)
    return UserProfile.model_validate(user)


@router.post(
    "/users/{user_id}/reset-password",
    summary="Reset kata sandi user (Admin only)",
)
async def admin_reset_password(
    user_id: str,
    payload: AdminResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> dict:
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User tidak ditemukan.",
        )
    user.hashed_password = hash_password(payload.new_password)
    db.add(user)
    await db.commit()
    return {"success": True, "message": f"Kata sandi untuk '{user.username}' berhasil diperbarui."}


@router.delete(
    "/users/{user_id}",
    summary="Hapus user (Admin only)",
)
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> dict:
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Anda tidak dapat menghapus akun Anda sendiri.",
        )
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User tidak ditemukan.",
        )
    await db.delete(user)
    await db.commit()
    return {"success": True, "message": f"User '{user.username}' berhasil dihapus."}
