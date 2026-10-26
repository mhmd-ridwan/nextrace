"""NEXTRACE Social Platform Provider Abstraction."""

import json
from abc import ABC, abstractmethod
from pathlib import Path

from app.core.config import get_settings


class SocialProvider(ABC):
    @abstractmethod
    async def fetch_profiles(self, query: str, platform: str = "") -> list[dict]: ...


class LocalSocialProvider(SocialProvider):
    """Local synthetic social profile provider for offline demonstration."""

    def __init__(self, data_path: Path | None = None):
        settings = get_settings()
        self.data_path = data_path or (settings.data_dir / "demo_profiles.json")

    async def fetch_profiles(self, query: str, platform: str = "") -> list[dict]:
        if self.data_path.exists():
            data = json.loads(self.data_path.read_text(encoding="utf-8"))
            return data.get("candidates", [])
        return []


def get_social_provider() -> SocialProvider:
    return LocalSocialProvider()
