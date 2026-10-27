"""
NEXTRACE Attack Surface Management (ASM) & Security Scanner Endpoints.
Provides Subdomain Enumeration (Subfinder + CT Logs) and Nuclei Vulnerability Intelligence.
"""

from fastapi import APIRouter, Query

from app.schemas.attack_surface import (
    NucleiScanRequest,
    NucleiScanResponse,
    SubdomainScanRequest,
    SubdomainScanResponse,
)
from app.services.attack_surface_service import AttackSurfaceService

router = APIRouter(prefix="/attack-surface", tags=["Module H: Attack Surface Management & Nuclei"])
service = AttackSurfaceService()


@router.post("/subdomains", response_model=SubdomainScanResponse, summary="Enumerate subdomains and takeover risks")
async def scan_subdomains_post(req: SubdomainScanRequest) -> SubdomainScanResponse:
    """Execute high-speed passive and active subdomain enumeration with takeover detection."""
    return await service.enumerate_subdomains(req.domain, req.max_subdomains)


@router.get("/subdomains", response_model=SubdomainScanResponse, summary="Enumerate subdomains via GET")
async def scan_subdomains_get(
    domain: str = Query(..., min_length=2, max_length=253, description="Target domain"),
    max_subdomains: int = Query(60, ge=5, le=300, description="Max subdomains to return"),
) -> SubdomainScanResponse:
    """Enumerate subdomains using query parameters."""
    return await service.enumerate_subdomains(domain, max_subdomains)


@router.post("/nuclei", response_model=NucleiScanResponse, summary="Execute focused Nuclei vulnerability scan")
async def scan_nuclei_post(req: NucleiScanRequest) -> NucleiScanResponse:
    """
    Run focused vulnerability assessment on target host/URL using Nuclei engine
    and native exposure heuristics (detects .env leak, panels, takeover, CVEs).
    """
    return await service.run_security_scan(
        target_input=req.target,
        tags=req.tags,
        severity=req.severity,
    )
