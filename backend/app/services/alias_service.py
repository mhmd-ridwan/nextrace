"""
NEXTRACE Email Alias Service.
Generates and manages trackable email aliases for leak tracing.
"""

import secrets
import string

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import generate_id, hash_identifier
from app.models.alias import AliasInboundEvent, EmailAlias
from app.schemas.alias import (
    AliasResponse,
    InboundEventCreate,
    InboundEventResponse,
)


class AliasService:
    """
    Manages trackable email aliases for potential leak source identification.
    """

    def __init__(self):
        self.settings = get_settings()

    async def generate_alias(
        self,
        db: AsyncSession,
        service_label: str,
        primary_email: str,
        investigation_id: str | None = None,
    ) -> AliasResponse:
        """
        Generate a unique trackable email alias.
        """
        clean_label = service_label.strip().lower().replace(" ", "_").replace("-", "_")
        clean_label = "".join(c for c in clean_label if c.isalnum() or c == "_")

        provider_type = self.settings.ALIAS_PROVIDER

        if provider_type == "plus_addressing":
            alias_address = self._generate_plus_address(primary_email, clean_label)
        elif provider_type == "catch_all":
            alias_address = self._generate_domain_alias(clean_label)
        else:
            alias_address = self._generate_simulated_alias(primary_email, clean_label)
            provider_type = "simulated"

        email_hash = hash_identifier(primary_email)

        alias = EmailAlias(
            id=generate_id(),
            investigation_id=investigation_id,
            service_label=clean_label,
            alias_address=alias_address,
            primary_email_hash=email_hash,
            provider_type=provider_type,
            provider_status="active" if provider_type == "plus_addressing" else "simulated",
        )
        db.add(alias)
        await db.flush()

        return AliasResponse(
            alias_id=alias.id,
            service_label=alias.service_label,
            alias_address=alias.alias_address,
            provider_type=alias.provider_type,
            provider_status=alias.provider_status,
            investigation_id=alias.investigation_id,
            created_at=alias.created_at,
        )

    async def list_aliases(
        self,
        db: AsyncSession,
        investigation_id: str | None = None,
    ) -> list[AliasResponse]:
        """List all aliases, optionally filtered by investigation."""
        query = select(EmailAlias).order_by(EmailAlias.created_at.desc())
        if investigation_id:
            query = query.where(EmailAlias.investigation_id == investigation_id)

        result = await db.execute(query)
        aliases = result.scalars().all()

        return [
            AliasResponse(
                alias_id=a.id,
                service_label=a.service_label,
                alias_address=a.alias_address,
                provider_type=a.provider_type,
                provider_status=a.provider_status,
                investigation_id=a.investigation_id,
                created_at=a.created_at,
            )
            for a in aliases
        ]

    async def get_alias(self, db: AsyncSession, alias_id: str) -> AliasResponse | None:
        """Get a single alias by ID."""
        result = await db.execute(select(EmailAlias).where(EmailAlias.id == alias_id))
        alias = result.scalar_one_or_none()
        if not alias:
            return None

        return AliasResponse(
            alias_id=alias.id,
            service_label=alias.service_label,
            alias_address=alias.alias_address,
            provider_type=alias.provider_type,
            provider_status=alias.provider_status,
            investigation_id=alias.investigation_id,
            created_at=alias.created_at,
        )

    async def record_inbound_event(
        self,
        db: AsyncSession,
        alias_id: str,
        event_data: InboundEventCreate,
    ) -> InboundEventResponse | None:
        """Record an inbound event for an alias (demo / webhook)."""
        result = await db.execute(select(EmailAlias).where(EmailAlias.id == alias_id))
        alias = result.scalar_one_or_none()
        if not alias:
            return None

        event = AliasInboundEvent(
            id=generate_id(),
            alias_id=alias_id,
            sender_domain=event_data.sender_domain,
            subject_snippet=event_data.subject_snippet,
            received_at=event_data.received_at,
            headers_meta=event_data.headers_meta,
            message_fingerprint=event_data.message_fingerprint,
            evidence_provenance=event_data.evidence_provenance or "demo_simulation",
        )
        db.add(event)
        await db.flush()

        return InboundEventResponse(
            event_id=event.id,
            alias_id=event.alias_id,
            alias_address=alias.alias_address,
            sender_domain=event.sender_domain,
            subject_snippet=event.subject_snippet,
            received_at=event.received_at,
            message_fingerprint=event.message_fingerprint,
            evidence_provenance=event.evidence_provenance,
            created_at=event.created_at,
        )

    async def get_alias_events(self, db: AsyncSession, alias_id: str) -> list[InboundEventResponse]:
        """Get inbound events for an alias."""
        alias_res = await db.execute(select(EmailAlias).where(EmailAlias.id == alias_id))
        alias = alias_res.scalar_one_or_none()
        if not alias:
            return []

        res = await db.execute(
            select(AliasInboundEvent)
            .where(AliasInboundEvent.alias_id == alias_id)
            .order_by(AliasInboundEvent.received_at.desc())
        )
        events = res.scalars().all()

        return [
            InboundEventResponse(
                event_id=e.id,
                alias_id=e.alias_id,
                alias_address=alias.alias_address,
                sender_domain=e.sender_domain,
                subject_snippet=e.subject_snippet,
                received_at=e.received_at,
                message_fingerprint=e.message_fingerprint,
                evidence_provenance=e.evidence_provenance,
                created_at=e.created_at,
            )
            for e in events
        ]

    def _generate_plus_address(self, email: str, label: str) -> str:
        parts = email.split("@")
        if len(parts) != 2:
            raise ValueError("Invalid email format")
        suffix = self._random_suffix(6)
        return f"{parts[0]}+{label}_{suffix}@{parts[1]}"

    def _generate_domain_alias(self, label: str) -> str:
        suffix = self._random_suffix(8)
        domain = self.settings.ALIAS_DOMAIN
        return f"{label}.{suffix}@{domain}"

    def _generate_simulated_alias(self, email: str, label: str) -> str:
        parts = email.split("@")
        local = parts[0] if parts else "user"
        suffix = self._random_suffix(6)
        return f"{local}+{label}_{suffix}@nextrace-alias.test"

    @staticmethod
    def _random_suffix(length: int = 6) -> str:
        chars = string.ascii_lowercase + string.digits
        return "".join(secrets.choice(chars) for _ in range(length))
