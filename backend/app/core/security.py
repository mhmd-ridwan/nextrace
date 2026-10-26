"""
NEXTRACE Core Security Module.
Handles password hashing, JWT tokens, and secure ID generation.
"""

import hashlib
import hmac
import secrets
import uuid
from datetime import UTC, datetime, timedelta

from passlib.context import CryptContext

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def generate_id() -> str:
    """Generate a unique UUID4 string identifier."""
    return str(uuid.uuid4())


def generate_token(length: int = 32) -> str:
    """Generate a cryptographically secure random token."""
    return secrets.token_urlsafe(length)


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def hash_identifier(identifier: str) -> str:
    """Create a SHA-256 hash of an identifier for privacy-preserving storage."""
    return hashlib.sha256(identifier.strip().lower().encode("utf-8")).hexdigest()


def hmac_fingerprint(data: str, secret_key: str) -> str:
    """
    Create an HMAC-SHA256 fingerprint for privacy-preserving matching.

    Note: This provides matching capability without storing the raw value.
    Limitation: The secret key must be kept secure; if compromised,
    all fingerprints can be recomputed from a dictionary of known values.
    """
    return hmac.new(
        secret_key.encode("utf-8"),
        data.strip().lower().encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def compute_file_hash(file_path: str) -> str:
    """Compute SHA-256 hash of a file for integrity verification."""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def create_jwt_token(
    data: dict,
    secret_key: str,
    algorithm: str = "HS256",
    expires_minutes: int = 60,
) -> str:
    """Create a JWT access token."""
    try:
        from jose import jwt
    except ImportError:
        from jose import jwt

    to_encode = data.copy()
    expire = datetime.now(UTC) + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire, "iat": datetime.now(UTC)})
    return jwt.encode(to_encode, secret_key, algorithm=algorithm)


def decode_jwt_token(
    token: str,
    secret_key: str,
    algorithm: str = "HS256",
) -> dict:
    """Decode and verify a JWT token."""
    from jose import JWTError, jwt

    try:
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        return payload
    except JWTError as e:
        raise ValueError(f"Invalid token: {e}") from e
