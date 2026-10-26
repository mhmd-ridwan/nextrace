"""NEXTRACE Breach Intelligence Provider Abstraction."""

import json
from abc import ABC, abstractmethod
from pathlib import Path

from app.core.config import get_settings


class BreachProvider(ABC):
    """Abstract breach intelligence provider."""

    @abstractmethod
    async def search(self, identifier_hash: str, identifier_type: str) -> list[dict]:
        """Search for breach records matching an identifier hash."""
        ...

    @abstractmethod
    def get_provider_info(self) -> dict:
        """Return provider metadata."""
        ...


class LocalBreachProvider(BreachProvider):
    """
    Local synthetic breach provider for offline demonstrations.
    Reads from demo_breaches.json.
    """

    def __init__(self, data_path: Path | None = None):
        settings = get_settings()
        self.data_path = data_path or (settings.data_dir / "demo_breaches.json")
        self._data: list[dict] | None = None

    def _load_data(self) -> list[dict]:
        if self._data is None:
            if self.data_path.exists():
                self._data = json.loads(self.data_path.read_text(encoding="utf-8"))
            else:
                self._data = []
        return self._data

    async def search(self, identifier_hash: str, identifier_type: str) -> list[dict]:
        return self._load_data()

    def get_provider_info(self) -> dict:
        return {
            "name": "local_synthetic",
            "type": "offline",
            "description": "Local synthetic breach dataset for hackathon MVP",
            "is_synthetic": True,
        }


def get_breach_provider() -> BreachProvider:
    """Factory to retrieve configured breach intelligence provider."""
    return LocalBreachProvider()
