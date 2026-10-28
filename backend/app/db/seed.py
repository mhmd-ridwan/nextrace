"""NEXTRACE Data Seeder.

Seeds verified breach intelligence incidents and purges deprecated demonstration data.
"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.session import async_session_factory
from app.models.alias import AliasInboundEvent, EmailAlias
from app.models.breach import BreachIncident, BreachLookupResult, Severity, SourceType
from app.models.buzzer import BuzzerComment, BuzzerScan
from app.models.evidence import EvidenceArtifact, EvidenceCustodyEvent
from app.models.finding import ImpersonationFinding
from app.models.investigation import Investigation
from app.models.profile import BrandBaseline, CandidateProfile
from app.models.report import GeneratedReport


async def purge_previous_data(db: AsyncSession) -> None:
    """Purge all previous demonstration and transient investigation data from the database."""
    await db.execute(delete(GeneratedReport))
    await db.execute(delete(BreachLookupResult))
    await db.execute(delete(BuzzerComment))
    await db.execute(delete(BuzzerScan))
    await db.execute(delete(EvidenceCustodyEvent))
    await db.execute(delete(EvidenceArtifact))
    await db.execute(delete(AliasInboundEvent))
    await db.execute(delete(EmailAlias))
    await db.execute(delete(ImpersonationFinding))
    await db.execute(delete(CandidateProfile))
    await db.execute(delete(BrandBaseline))
    await db.execute(delete(Investigation))
    await db.commit()


async def seed_demo_data(session: AsyncSession | None = None, force_reset: bool = False) -> None:
    """Seed reference threat intelligence records and purge deprecated data."""
    settings = get_settings()
    data_dir = settings.data_dir
    uploads_dir = settings.uploads_dir
    uploads_dir.mkdir(parents=True, exist_ok=True)

    if session is not None:
        await _perform_seed(session, data_dir)
    else:
        async with async_session_factory() as db:
            await _perform_seed(db, data_dir)


async def _perform_seed(db: AsyncSession, data_dir: Path) -> None:
    # Always purge previous data to ensure a clean operational database
    await purge_previous_data(db)

    # Seed breach incidents catalog (Real confirmed Indonesian public breaches)
    breaches_file = data_dir / "demo_breaches.json"
    if breaches_file.exists():
        breaches = json.loads(breaches_file.read_text(encoding="utf-8"))
        for b in breaches:
            existing_b = await db.execute(select(BreachIncident).where(BreachIncident.id == b["id"]))
            if existing_b.scalar_one_or_none():
                continue

            sev = getattr(Severity, b.get("severity", "medium").upper(), Severity.MEDIUM)
            inc = BreachIncident(
                id=b["id"],
                source_name=b["source_name"],
                source_type=SourceType.CONFIRMED,
                breach_date=datetime.fromisoformat(b["breach_date"].replace("Z", "+00:00"))
                if b.get("breach_date")
                else None,
                reported_date=datetime.fromisoformat(b["reported_date"].replace("Z", "+00:00"))
                if b.get("reported_date")
                else None,
                exposed_fields=b.get("exposed_fields", []),
                record_count=b.get("record_count"),
                severity=sev,
                source_url=b.get("source_url"),
                description=b.get("description"),
                matching_patterns=b.get("matching_patterns", []),
                is_synthetic=False,
            )
            db.add(inc)

        await db.commit()
