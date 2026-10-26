"""
NextRace application configuration using Pydantic Settings.
Loads from environment variables and .env file.
"""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    APP_NAME: str = "NextRace"
    APP_VERSION: str = "2.0.0"
    APP_ENV: str = "development"
    DEBUG: bool = True
    DEMO_MODE: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./nextrace.db"

    # Security
    SECRET_KEY: str = "dev-secret-key-change-in-production-abc123xyz"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000"

    # Alias
    ALIAS_DOMAIN: str = "nextrace-alias.test"
    ALIAS_PROVIDER: str = "plus_addressing"

    # Rate limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60

    # Upload
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_IMAGE_EXTENSIONS: str = ".jpg,.jpeg,.png,.gif,.webp"

    # Storage paths
    EVIDENCE_STORAGE_PATH: str = "./evidence_store"
    REPORTS_PATH: str = "./reports"

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def allowed_image_extensions_list(self) -> list[str]:
        """Parse comma-separated image extensions into a list."""
        return [ext.strip() for ext in self.ALLOWED_IMAGE_EXTENSIONS.split(",")]

    @property
    def max_upload_size_bytes(self) -> int:
        """Max upload size in bytes."""
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    @property
    def base_dir(self) -> Path:
        """Base directory of the backend application."""
        return Path(__file__).resolve().parent.parent.parent

    @property
    def uploads_dir(self) -> Path:
        """Uploads directory path."""
        path = self.base_dir / "uploads"
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def evidence_dir(self) -> Path:
        """Evidence storage directory path."""
        path = Path(self.EVIDENCE_STORAGE_PATH)
        if not path.is_absolute():
            path = self.base_dir / path
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def reports_dir(self) -> Path:
        """Reports directory path."""
        path = Path(self.REPORTS_PATH)
        if not path.is_absolute():
            path = self.base_dir / path
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def data_dir(self) -> Path:
        """Demo/seed data directory."""
        return self.base_dir / "data"


def get_settings() -> Settings:
    """Get cached application settings instance."""
    return Settings()
