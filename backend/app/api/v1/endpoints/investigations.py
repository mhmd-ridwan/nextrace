"""NEXTRACE Investigation Workflow Endpoints."""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.core.security import generate_id
from app.db.session import get_db
from app.models.alias import EmailAlias
from app.models.breach import BreachLookupResult
from app.models.evidence import EvidenceArtifact
from app.models.finding import ImpersonationFinding
from app.models.investigation import Investigation, InvestigationStatus, Priority
from app.models.report import GeneratedReport
from app.schemas.investigation import (
    InvestigationCreate,
    InvestigationResponse,
    InvestigationStats,
    InvestigationTimeline,
    InvestigationUpdate,
    TimelineEvent,
)

router = APIRouter()


@router.post("", response_model=InvestigationResponse, summary="Create new investigation")
async def create_investigation(
    data: InvestigationCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a unified brand protection or breach trace investigation."""
    try:
        prio = Priority(data.priority.value)
    except Exception:
        prio = Priority.MEDIUM

    inv = Investigation(
        id=generate_id(),
        title=data.title,
        description=data.description,
        organization=data.organization,
        target_brand=data.target_brand,
        target_platform=data.target_platform,
        priority=prio,
        tags=data.tags,
        status=InvestigationStatus.ACTIVE,
    )
    db.add(inv)
    await db.flush()

    return InvestigationResponse(
        id=inv.id,
        title=inv.title,
        description=inv.description,
        status=inv.status.value,
        organization=inv.organization,
        target_brand=inv.target_brand,
        target_platform=inv.target_platform,
        priority=inv.priority.value,
        tags=inv.tags or [],
        created_at=inv.created_at,
        updated_at=inv.updated_at,
    )


@router.get("", summary="List investigations")
async def list_investigations(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List investigations with pagination."""
    offset = (page - 1) * per_page
    all_res = await db.execute(select(Investigation))
    total = len(all_res.scalars().all())

    res = await db.execute(
        select(Investigation).order_by(Investigation.created_at.desc()).offset(offset).limit(per_page)
    )
    investigations = res.scalars().all()

    items = []
    for inv in investigations:
        items.append(
            InvestigationResponse(
                id=inv.id,
                title=inv.title,
                description=inv.description,
                status=inv.status.value if hasattr(inv.status, "value") else str(inv.status),
                organization=inv.organization,
                target_brand=inv.target_brand,
                target_platform=inv.target_platform,
                priority=inv.priority.value if hasattr(inv.priority, "value") else str(inv.priority),
                tags=inv.tags or [],
                created_at=inv.created_at,
                updated_at=inv.updated_at,
                closed_at=inv.closed_at,
            )
        )

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.get(
    "/{investigation_id}",
    response_model=InvestigationResponse,
    summary="Get investigation detail",
)
async def get_investigation(
    investigation_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve investigation detail with aggregated metrics and stats."""
    res = await db.execute(select(Investigation).where(Investigation.id == investigation_id))
    inv = res.scalar_one_or_none()
    if not inv:
        raise NotFoundError("Investigation", investigation_id)

    # Compute live stats
    find_res = await db.execute(
        select(ImpersonationFinding).where(ImpersonationFinding.investigation_id == investigation_id)
    )
    findings = find_res.scalars().all()

    ev_res = await db.execute(select(EvidenceArtifact).where(EvidenceArtifact.investigation_id == investigation_id))
    evidence_cnt = len(ev_res.scalars().all())

    rep_res = await db.execute(select(GeneratedReport).where(GeneratedReport.investigation_id == investigation_id))
    reports_cnt = len(rep_res.scalars().all())

    look_res = await db.execute(
        select(BreachLookupResult).where(BreachLookupResult.investigation_id == investigation_id)
    )
    lookups_cnt = len(look_res.scalars().all())

    al_res = await db.execute(select(EmailAlias).where(EmailAlias.investigation_id == investigation_id))
    aliases_cnt = len(al_res.scalars().all())

    high_risk_findings = sum(1 for f in findings if f.risk_score and f.risk_score >= 60.0)

    stats = InvestigationStats(
        findings_count=len(findings),
        evidence_count=evidence_cnt,
        reports_count=reports_cnt,
        breach_lookups_count=lookups_cnt,
        aliases_count=aliases_cnt,
        high_risk_findings=high_risk_findings,
    )

    return InvestigationResponse(
        id=inv.id,
        title=inv.title,
        description=inv.description,
        status=inv.status.value if hasattr(inv.status, "value") else str(inv.status),
        organization=inv.organization,
        target_brand=inv.target_brand,
        target_platform=inv.target_platform,
        priority=inv.priority.value if hasattr(inv.priority, "value") else str(inv.priority),
        tags=inv.tags or [],
        stats=stats,
        created_at=inv.created_at,
        updated_at=inv.updated_at,
        closed_at=inv.closed_at,
    )


@router.patch(
    "/{investigation_id}",
    response_model=InvestigationResponse,
    summary="Update investigation",
)
async def update_investigation(
    investigation_id: str,
    data: InvestigationUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Modify investigation attributes or triage status."""
    res = await db.execute(select(Investigation).where(Investigation.id == investigation_id))
    inv = res.scalar_one_or_none()
    if not inv:
        raise NotFoundError("Investigation", investigation_id)

    if data.title is not None:
        inv.title = data.title
    if data.description is not None:
        inv.description = data.description
    if data.status is not None:
        inv.status = InvestigationStatus(data.status.value)
        if data.status.value == "closed":
            inv.closed_at = datetime.now(UTC)
    if data.priority is not None:
        inv.priority = Priority(data.priority.value)
    if data.tags is not None:
        inv.tags = data.tags

    await db.flush()

    return InvestigationResponse(
        id=inv.id,
        title=inv.title,
        description=inv.description,
        status=inv.status.value,
        organization=inv.organization,
        target_brand=inv.target_brand,
        target_platform=inv.target_platform,
        priority=inv.priority.value,
        tags=inv.tags or [],
        created_at=inv.created_at,
        updated_at=inv.updated_at,
        closed_at=inv.closed_at,
    )


@router.get(
    "/{investigation_id}/timeline",
    response_model=InvestigationTimeline,
    summary="Unified chronological timeline",
)
async def get_timeline(
    investigation_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Build unified investigation timeline distinguishing observed, reported, analyst, and demo events."""
    res = await db.execute(select(Investigation).where(Investigation.id == investigation_id))
    inv = res.scalar_one_or_none()
    if not inv:
        raise NotFoundError("Investigation", investigation_id)

    events: list[TimelineEvent] = []

    # 1. Investigation created
    events.append(
        TimelineEvent(
            event_id=f"inv-{inv.id[:8]}",
            event_type="investigation_created",
            event_source="analyst",
            timestamp=inv.created_at or datetime.now(UTC),
            title=f"Investigation Opened: {inv.title}",
            description=inv.description or "Investigation docket registered in NEXTRACE.",
            related_entity_type="investigation",
            related_entity_id=inv.id,
        )
    )

    # 2. Impersonation findings
    findings_res = await db.execute(
        select(ImpersonationFinding).where(ImpersonationFinding.investigation_id == investigation_id)
    )
    for f in findings_res.scalars().all():
        events.append(
            TimelineEvent(
                event_id=f"finding-{f.id[:8]}",
                event_type="impersonation_detected",
                event_source="observed",
                timestamp=f.created_at or datetime.now(UTC),
                title=f"Impersonation Signal Flagged (Risk: {f.risk_score:.0f}/100)",
                description=f"Multi-signal heuristic score: {f.risk_severity.value if hasattr(f.risk_severity, 'value') else str(f.risk_severity)}. Factors: {', '.join((f.risk_factors or [])[:3])}",
                related_entity_type="finding",
                related_entity_id=f.id,
                metadata={"risk_score": f.risk_score},
            )
        )

    # 3. Breach lookups
    look_res = await db.execute(
        select(BreachLookupResult).where(BreachLookupResult.investigation_id == investigation_id)
    )
    for lookup in look_res.scalars().all():
        events.append(
            TimelineEvent(
                event_id=f"breach-{lookup.id[:8]}",
                event_type="breach_lookup",
                event_source="reported",
                timestamp=lookup.lookup_timestamp or datetime.now(UTC),
                title=f"Breach Trace Match (Conf: {int(lookup.confidence * 100)}%)",
                description=f"Identifier matched documented incident records via {lookup.provider_name}",
                related_entity_type="breach_lookup",
                related_entity_id=lookup.id,
            )
        )

    # 4. Evidence collections
    ev_res = await db.execute(select(EvidenceArtifact).where(EvidenceArtifact.investigation_id == investigation_id))
    for e in ev_res.scalars().all():
        events.append(
            TimelineEvent(
                event_id=f"ev-{e.id[:8]}",
                event_type="evidence_secured",
                event_source="analyst",
                timestamp=e.collection_timestamp or e.created_at or datetime.now(UTC),
                title=f"Evidence Artifact Anchored ({e.evidence_type.value if hasattr(e.evidence_type, 'value') else str(e.evidence_type)})",
                description=f"Captured via {e.collection_method}. SHA-256: {(e.file_hash_sha256 or 'N/A')[:16]}...",
                related_entity_type="evidence",
                related_entity_id=e.id,
            )
        )

    # Chronological sort
    events.sort(key=lambda x: x.timestamp)

    return InvestigationTimeline(
        investigation_id=investigation_id,
        events=events,
        total_events=len(events),
    )
