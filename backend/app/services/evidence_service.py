"""
NEXTRACE Evidence Management Service.
Handles evidence artifacts, integrity verification, and chain of custody.
"""

import json
from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import compute_file_hash, generate_id
from app.models.evidence import (
    CustodyEventType,
    EvidenceArtifact,
    EvidenceCustodyEvent,
    EvidenceType,
)
from app.models.investigation import Investigation, InvestigationStatus, Priority
from app.schemas.evidence import (
    CustodyEventCreate,
    CustodyEventResponse,
    EvidenceCreateRequest,
    EvidenceResponse,
    EvidenceVerifyResponse,
)


class EvidenceService:
    """Manages digital evidence artifacts and chain of custody."""

    def __init__(self):
        self.settings = get_settings()

    async def create_evidence(
        self,
        db: AsyncSession,
        data: EvidenceCreateRequest,
        file_content: bytes | None = None,
        filename: str | None = None,
    ) -> EvidenceResponse:
        """Create an evidence artifact with optional file and compute SHA-256."""
        evidence_id = generate_id()
        now = datetime.now(UTC)
        file_path = None
        file_hash = None

        # Ensure investigation exists to preserve referential integrity
        inv_id = data.investigation_id or "inv-jokowi-001"
        inv_res = await db.execute(select(Investigation).where(Investigation.id == inv_id))
        if not inv_res.scalar_one_or_none():
            inv = Investigation(
                id=inv_id,
                title=f"Investigasi Forensik Kasus ({inv_id})",
                status=InvestigationStatus.ACTIVE,
                priority=Priority.HIGH,
                organization="NEXTRACE Threat Intelligence Unit",
            )
            db.add(inv)
            await db.flush()

        if file_content and filename:
            file_path, file_hash = self._store_file(evidence_id, file_content, filename)
        else:
            record_doc = {
                "evidence_id": evidence_id,
                "investigation_id": inv_id,
                "evidence_type": data.evidence_type,
                "source_url": data.source_url,
                "collection_method": data.collection_method,
                "observation_timestamp": (
                    data.observation_timestamp.isoformat() if data.observation_timestamp else None
                ),
                "collection_timestamp": now.isoformat(),
                "metadata": data.metadata,
            }
            raw_bytes = json.dumps(record_doc, indent=2, default=str).encode("utf-8")
            file_path, file_hash = self._store_file(evidence_id, raw_bytes, f"evidence_{evidence_id}.json")

        try:
            ev_type = EvidenceType(data.evidence_type)
        except ValueError:
            ev_type = EvidenceType.DOCUMENT

        evidence = EvidenceArtifact(
            id=evidence_id,
            investigation_id=inv_id,
            evidence_type=ev_type,
            source_url=data.source_url,
            collection_method=data.collection_method,
            observation_timestamp=data.observation_timestamp,
            collection_timestamp=now,
            file_path=file_path,
            file_hash_sha256=file_hash,
            metadata_json=data.metadata,
            processing_history=[
                {
                    "action": "registered",
                    "timestamp": now.isoformat(),
                    "actor": "system",
                }
            ],
        )
        db.add(evidence)

        custody_event = EvidenceCustodyEvent(
            id=generate_id(),
            evidence_id=evidence_id,
            event_type=CustodyEventType.COLLECTED,
            actor="analyst",
            description="Evidence registered in NEXTRACE custody",
            event_timestamp=now,
            metadata_json={"file_hash": file_hash, "method": data.collection_method},
        )
        db.add(custody_event)
        await db.flush()

        res = await self.get_evidence(db, evidence_id)
        if not res:
            raise RuntimeError(f"Failed to retrieve created evidence {evidence_id}")
        return res

    async def list_evidence(
        self,
        db: AsyncSession,
        investigation_id: str | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> dict:
        """List paginated evidence artifacts."""
        query = select(EvidenceArtifact)
        if investigation_id:
            query = query.where(EvidenceArtifact.investigation_id == investigation_id)

        count_res = await db.execute(query)
        total = len(count_res.scalars().all())

        offset = (page - 1) * per_page
        res = await db.execute(query.order_by(EvidenceArtifact.created_at.desc()).offset(offset).limit(per_page))
        artifacts = res.scalars().all()

        items = []
        for ev in artifacts:
            item = await self.get_evidence(db, ev.id)
            if item:
                items.append(item)

        return {
            "items": items,
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page if per_page > 0 else 0,
        }

    async def get_evidence(self, db: AsyncSession, evidence_id: str) -> EvidenceResponse | None:
        """Get evidence by ID with custody chain."""
        res = await db.execute(select(EvidenceArtifact).where(EvidenceArtifact.id == evidence_id))
        ev = res.scalar_one_or_none()
        if not ev:
            return None

        events_res = await db.execute(
            select(EvidenceCustodyEvent)
            .where(EvidenceCustodyEvent.evidence_id == evidence_id)
            .order_by(EvidenceCustodyEvent.event_timestamp)
        )
        events = events_res.scalars().all()

        custody_list = [
            CustodyEventResponse(
                event_id=e.id,
                evidence_id=e.evidence_id,
                event_type=e.event_type.value if hasattr(e.event_type, "value") else str(e.event_type),
                actor=e.actor,
                description=e.description,
                event_timestamp=e.event_timestamp,
                metadata=e.metadata_json or {},
            )
            for e in events
        ]

        return EvidenceResponse(
            evidence_id=ev.id,
            investigation_id=ev.investigation_id,
            evidence_type=ev.evidence_type.value if hasattr(ev.evidence_type, "value") else str(ev.evidence_type),
            source_url=ev.source_url,
            collection_method=ev.collection_method,
            observation_timestamp=ev.observation_timestamp,
            collection_timestamp=ev.collection_timestamp,
            file_path=ev.file_path,
            file_hash_sha256=ev.file_hash_sha256,
            metadata=ev.metadata_json or {},
            processing_history=ev.processing_history or [],
            custody_events=custody_list,
            created_at=ev.created_at,
        )

    async def verify_integrity(self, db: AsyncSession, evidence_id: str) -> EvidenceVerifyResponse:
        """Verify artifact SHA-256 integrity."""
        res = await db.execute(select(EvidenceArtifact).where(EvidenceArtifact.id == evidence_id))
        ev = res.scalar_one_or_none()
        if not ev:
            return EvidenceVerifyResponse(
                evidence_id=evidence_id,
                is_valid=False,
                message="Evidence not found",
            )

        if not ev.file_path or not ev.file_hash_sha256:
            return EvidenceVerifyResponse(
                evidence_id=evidence_id,
                is_valid=False,
                expected_hash=ev.file_hash_sha256,
                message="No stored file or recorded hash",
            )

        p = Path(ev.file_path)
        if not p.exists():
            return EvidenceVerifyResponse(
                evidence_id=evidence_id,
                is_valid=False,
                expected_hash=ev.file_hash_sha256,
                message="File missing from evidence storage",
            )

        actual_hash = compute_file_hash(str(p))
        is_valid = actual_hash.lower() == ev.file_hash_sha256.lower()

        custody_event = EvidenceCustodyEvent(
            id=generate_id(),
            evidence_id=evidence_id,
            event_type=CustodyEventType.VERIFIED,
            actor="system_validator",
            description=f"Integrity check: {'PASSED' if is_valid else 'FAILED'}",
            event_timestamp=datetime.now(UTC),
            metadata_json={
                "expected": ev.file_hash_sha256,
                "actual": actual_hash,
                "match": is_valid,
            },
        )
        db.add(custody_event)
        await db.flush()

        return EvidenceVerifyResponse(
            evidence_id=evidence_id,
            is_valid=is_valid,
            expected_hash=ev.file_hash_sha256,
            actual_hash=actual_hash,
            message="SHA-256 hash verified successfully" if is_valid else "TAMPERING ALERT: SHA-256 hash mismatch!",
        )

    async def add_custody_event(
        self, db: AsyncSession, evidence_id: str, data: CustodyEventCreate
    ) -> CustodyEventResponse | None:
        """Add custody event log entry."""
        res = await db.execute(select(EvidenceArtifact).where(EvidenceArtifact.id == evidence_id))
        if not res.scalar_one_or_none():
            return None

        now = datetime.now(UTC)
        try:
            ev_type = CustodyEventType(data.event_type)
        except ValueError:
            ev_type = CustodyEventType.REVIEWED

        event = EvidenceCustodyEvent(
            id=generate_id(),
            evidence_id=evidence_id,
            event_type=ev_type,
            actor=data.actor,
            description=data.description,
            event_timestamp=now,
            metadata_json=data.metadata,
        )
        db.add(event)
        await db.flush()

        return CustodyEventResponse(
            event_id=event.id,
            evidence_id=event.evidence_id,
            event_type=event.event_type.value,
            actor=event.actor,
            description=event.description,
            event_timestamp=event.event_timestamp,
            metadata=event.metadata_json or {},
        )

    def _store_file(self, evidence_id: str, content: bytes, filename: str) -> tuple[str, str]:
        evidence_dir = self.settings.evidence_dir / evidence_id
        evidence_dir.mkdir(parents=True, exist_ok=True)

        safe_filename = "".join(c for c in filename if c.isalnum() or c in "._-")
        if not safe_filename:
            safe_filename = "artifact.dat"

        target_file = evidence_dir / safe_filename
        target_file.write_bytes(content)

        file_hash = compute_file_hash(str(target_file))
        return str(target_file), file_hash
