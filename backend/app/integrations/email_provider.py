"""NEXTRACE Email Alias Provider Abstraction."""

import secrets
import string
from abc import ABC, abstractmethod

from app.core.config import get_settings


class EmailProvider(ABC):
    @abstractmethod
    def generate_alias(self, primary_email: str, label: str) -> str: ...

    @abstractmethod
    def get_provider_info(self) -> dict: ...


class PlusAddressingProvider(EmailProvider):
    def generate_alias(self, primary_email: str, label: str) -> str:
        parts = primary_email.split("@")
        suffix = "".join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(6))
        return f"{parts[0]}+{label}_{suffix}@{parts[1]}"

    def get_provider_info(self):
        return {"type": "plus_addressing", "status": "active"}


class CatchAllDomainProvider(EmailProvider):
    def __init__(self, domain: str):
        self.domain = domain

    def generate_alias(self, primary_email: str, label: str) -> str:
        suffix = "".join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(8))
        return f"{label}.{suffix}@{self.domain}"

    def get_provider_info(self):
        return {"type": "catch_all", "domain": self.domain, "status": "active"}


class SimulatedProvider(EmailProvider):
    """Simulated provider using .test TLD — clearly labeled as non-routable."""

    def generate_alias(self, primary_email: str, label: str) -> str:
        parts = primary_email.split("@")
        local = parts[0] if parts else "user"
        suffix = "".join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(6))
        return f"{local}+{label}_{suffix}@nextrace-alias.test"

    def get_provider_info(self):
        return {
            "type": "simulated",
            "status": "simulated",
            "note": "Uses .test domain. Cannot receive public email.",
        }


def get_email_provider() -> EmailProvider:
    settings = get_settings()
    if settings.ALIAS_PROVIDER == "plus_addressing":
        return PlusAddressingProvider()
    elif settings.ALIAS_PROVIDER == "catch_all":
        return CatchAllDomainProvider(settings.ALIAS_DOMAIN)
    return SimulatedProvider()
