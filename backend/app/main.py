"""
NEXTRACE — Platform Investigasi OSINT, Deteksi Buzzer & Pelacak Jejak Kebocoran Data
Integrated Intelligence Protection & Digital Threat Hunter Platform.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import setup_logging
from app.db.session import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: configures logging, initializes DB, and seeds demo data."""
    settings = get_settings()
    setup_logging(
        log_level="DEBUG" if settings.DEBUG else "INFO",
        json_output=settings.APP_ENV == "production",
    )

    # Initialize SQLite database schema
    await init_db()

    # Seed synthetic dataset for demonstration
    if settings.DEMO_MODE:
        from app.db.seed import seed_demo_data

        await seed_demo_data()

    yield


def create_app() -> FastAPI:
    """Instantiate and configure the NEXTRACE FastAPI core application."""
    settings = get_settings()

    app = FastAPI(
        title="NEXTRACE API",
        description=(
            "NEXTRACE — Platform Investigasi OSINT & Cyber Threat Hunter.\n\n"
            "An integrated intelligence platform connecting Coordinated Inauthentic Behavior (Buzzer & Bot Hunter), "
            "Data Breach Intelligence, Leak Tracing with Trackable Aliases, Brand Impersonation Hunter, "
            "and Cryptographic Digital Evidence Management."
        ),
        version=settings.APP_VERSION,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # Cross-Origin Resource Sharing
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list + ["http://localhost:3000", "http://127.0.0.1:3000"],
        allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Centralized custom exception handlers
    register_exception_handlers(app)

    # Static assets directory for avatars and uploads
    uploads_dir = settings.uploads_dir
    app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")
    app.mount(
        "/api/v1/uploads",
        StaticFiles(directory=str(uploads_dir)),
        name="api_v1_uploads",
    )

    # API v1 Router
    from app.api.v1.router import api_v1_router

    app.include_router(api_v1_router, prefix="/api/v1")

    @app.get("/", tags=["Root"])
    async def root():
        return {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "tagline": "Sistem Terpadu Identifikasi Akun Tiruan & Pelacak Jejak Kebocoran Data",
            "documentation": "/docs",
            "health_check": "/api/v1/health",
            "demo_mode": settings.DEMO_MODE,
        }

    return app


app = create_app()
