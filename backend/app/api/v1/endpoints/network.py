"""
NEXTRACE Network OSINT API Endpoints.
Provides live Domain Reputation Audit, DNS Records Resolution, and WHOIS Registry Queries.
"""

from fastapi import APIRouter, Query

from app.schemas.network import DomainAuditRequest, DomainAuditResponse
from app.services.network_osint import NetworkOSINTService

router = APIRouter(prefix="/network", tags=["Network & Domain OSINT"])
service = NetworkOSINTService()


@router.post("/domain-audit", response_model=DomainAuditResponse)
async def audit_domain_post(req: DomainAuditRequest) -> DomainAuditResponse:
    """Execute full live OSINT audit on domain, including DNS, WHOIS, and SSL reputation."""
    return service.audit_domain(req.domain)


@router.get("/domain-audit", response_model=DomainAuditResponse)
async def audit_domain_get(
    domain: str = Query(..., min_length=2, max_length=253, description="Target domain or hostname"),
) -> DomainAuditResponse:
    """Query live domain reputation via GET parameter."""
    return service.audit_domain(domain)


@router.get("/dns")
async def get_dns_records(
    domain: str = Query(..., min_length=2, max_length=253, description="Target domain or hostname"),
) -> dict:
    """Resolve live DNS records (A, AAAA, MX, NS, TXT)."""
    clean = service.clean_domain(domain)
    records, ips = service.resolve_dns(clean)
    return {
        "domain": clean,
        "records": records,
        "ip_addresses": ips,
    }


@router.get("/whois")
async def get_whois_query(
    domain: str = Query(..., min_length=2, max_length=253, description="Target domain or hostname"),
) -> dict:
    """Execute raw WHOIS query and extract structured registrar & registration dates."""
    clean = service.clean_domain(domain)
    raw = service.query_whois_socket(clean)
    fields = service.parse_whois_fields(raw, clean)
    return {
        "domain": clean,
        "fields": fields,
        "raw_whois": raw,
    }
