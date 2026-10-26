"""
NEXTRACE Custom Exception Classes and FastAPI Exception Handlers.
"""

from typing import Any

from fastapi import Request
from fastapi.responses import JSONResponse


class NextRaceError(Exception):
    """Base exception for NextRace application."""

    def __init__(self, message: str = "An error occurred", detail: Any = None):
        self.message = message
        self.detail = detail
        super().__init__(self.message)


# Backward compatibility alias
NextRaceError = NextRaceError


class NotFoundError(NextRaceError):
    """Resource not found."""

    def __init__(self, resource: str = "Resource", resource_id: str = ""):
        message = f"{resource} not found"
        if resource_id:
            message = f"{resource} '{resource_id}' not found"
        super().__init__(message=message)


class ValidationError(NextRaceError):
    """Input validation error."""

    pass


class AuthenticationError(NextRaceError):
    """Authentication failure."""

    def __init__(self, message: str = "Authentication required"):
        super().__init__(message=message)


class AuthorizationError(NextRaceError):
    """Authorization failure."""

    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(message=message)


class RateLimitError(NextRaceError):
    """Rate limit exceeded."""

    def __init__(self, message: str = "Rate limit exceeded. Please try again later."):
        super().__init__(message=message)


class ExternalServiceError(NextRaceError):
    """External service integration error."""

    pass


class EvidenceIntegrityError(NextRaceError):
    """Evidence integrity verification failure."""

    pass


# --- FastAPI Exception Handlers ---


async def nextrace_error_handler(request: Request, exc: NextRaceError) -> JSONResponse:
    """Handle base NEXTRACE errors."""
    return JSONResponse(
        status_code=500,
        content={
            "error_code": "INTERNAL_ERROR",
            "message": exc.message,
            "detail": exc.detail,
        },
    )


async def not_found_handler(request: Request, exc: NotFoundError) -> JSONResponse:
    """Handle not found errors."""
    return JSONResponse(
        status_code=404,
        content={
            "error_code": "NOT_FOUND",
            "message": exc.message,
            "detail": exc.detail,
        },
    )


async def validation_error_handler(request: Request, exc: ValidationError) -> JSONResponse:
    """Handle validation errors."""
    return JSONResponse(
        status_code=422,
        content={
            "error_code": "VALIDATION_ERROR",
            "message": exc.message,
            "detail": exc.detail,
        },
    )


async def auth_error_handler(request: Request, exc: AuthenticationError) -> JSONResponse:
    """Handle authentication errors."""
    return JSONResponse(
        status_code=401,
        content={
            "error_code": "AUTHENTICATION_ERROR",
            "message": exc.message,
        },
    )


async def authz_error_handler(request: Request, exc: AuthorizationError) -> JSONResponse:
    """Handle authorization errors."""
    return JSONResponse(
        status_code=403,
        content={
            "error_code": "AUTHORIZATION_ERROR",
            "message": exc.message,
        },
    )


async def rate_limit_handler(request: Request, exc: RateLimitError) -> JSONResponse:
    """Handle rate limit errors."""
    return JSONResponse(
        status_code=429,
        content={
            "error_code": "RATE_LIMIT_EXCEEDED",
            "message": exc.message,
        },
    )


async def external_service_handler(request: Request, exc: ExternalServiceError) -> JSONResponse:
    """Handle external service errors."""
    return JSONResponse(
        status_code=502,
        content={
            "error_code": "EXTERNAL_SERVICE_ERROR",
            "message": exc.message,
            "detail": exc.detail,
        },
    )


async def evidence_integrity_handler(request: Request, exc: EvidenceIntegrityError) -> JSONResponse:
    """Handle evidence integrity errors."""
    return JSONResponse(
        status_code=409,
        content={
            "error_code": "EVIDENCE_INTEGRITY_ERROR",
            "message": exc.message,
            "detail": exc.detail,
        },
    )


def register_exception_handlers(app) -> None:
    """Register all custom exception handlers with the FastAPI app."""
    app.add_exception_handler(NotFoundError, not_found_handler)
    app.add_exception_handler(ValidationError, validation_error_handler)
    app.add_exception_handler(AuthenticationError, auth_error_handler)
    app.add_exception_handler(AuthorizationError, authz_error_handler)
    app.add_exception_handler(RateLimitError, rate_limit_handler)
    app.add_exception_handler(ExternalServiceError, external_service_handler)
    app.add_exception_handler(EvidenceIntegrityError, evidence_integrity_handler)
    app.add_exception_handler(NextRaceError, nextrace_error_handler)
