"""NEXTRACE Auth Unit Tests."""

from app.core.config import get_settings
from app.core.security import (
    create_jwt_token,
    decode_jwt_token,
    hash_password,
    verify_password,
)
from app.models.user import UserRole
from app.schemas.auth import LoginRequest, TokenResponse, UserProfile


def test_password_hashing_and_verification():
    plain = "SuperSecret2026!"
    hashed = hash_password(plain)
    assert hashed != plain
    assert verify_password(plain, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_jwt_token_lifecycle():
    settings = get_settings()
    data = {"sub": "user-test-123", "username": "analis_test", "role": "analyst"}
    token = create_jwt_token(
        data=data,
        secret_key=settings.SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
        expires_minutes=15,
    )
    assert isinstance(token, str)
    assert len(token) > 20

    payload = decode_jwt_token(
        token=token,
        secret_key=settings.SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    assert payload["sub"] == "user-test-123"
    assert payload["username"] == "analis_test"
    assert payload["role"] == "analyst"


def test_auth_schemas_validation():
    login_req = LoginRequest(username="admin", password="password123")
    assert login_req.username == "admin"

    profile = UserProfile(
        id="user-001",
        username="owner",
        email="owner@taya.web.id",
        full_name="Owner TAYA",
        role=UserRole.ADMIN,
        is_active=True,
    )
    assert profile.role == UserRole.ADMIN

    token_resp = TokenResponse(
        access_token="dummy_token_abc",
        token_type="bearer",
        expires_in=3600,
        user=profile,
    )
    assert token_resp.token_type == "bearer"
    assert token_resp.user.email == "owner@taya.web.id"
