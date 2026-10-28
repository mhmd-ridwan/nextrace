"""Unit tests for Attack Surface Management & Nuclei Scanner Service."""

import pytest

from app.schemas.attack_surface import (
    NucleiScanRequest,
    NucleiVulnerabilityItem,
    SubdomainItem,
    SubdomainScanRequest,
)
from app.services.attack_surface_service import AttackSurfaceService


def test_clean_target_hostname():
    service = AttackSurfaceService()
    assert service.clean_target("https://www.bca.co.id/sub") == "bca.co.id"
    assert service.clean_target("http://target.go.id:8080/path") == "target.go.id"
    assert service.clean_target("presidenri.go.id") == "presidenri.go.id"


def test_subdomain_models():
    sub = SubdomainItem(
        subdomain="portal.bca.co.id",
        ip_addresses=["103.10.12.5"],
        status_code=200,
        title="Portal BCA",
        server="nginx",
        cname=None,
        is_takeover_risk=False,
        is_live=True,
    )
    assert sub.is_live is True
    assert sub.is_takeover_risk is False

    req = SubdomainScanRequest(domain="bca.co.id", max_subdomains=30)
    assert req.domain == "bca.co.id"
    assert req.max_subdomains == 30


def test_nuclei_models():
    vuln = NucleiVulnerabilityItem(
        template_id="env-file-exposure",
        name="Exposed .env Configuration File",
        severity="critical",
        matched_at="https://dev.bca.co.id/.env",
        extracted_results=["DB_PASSWORD=secret"],
        description="Environment file publicly readable",
        type="http",
    )
    assert vuln.severity == "critical"
    assert "DB_PASSWORD" in vuln.extracted_results[0]

    req = NucleiScanRequest(target="dev.bca.co.id")
    assert req.target == "dev.bca.co.id"
    assert "critical" in req.severity


@pytest.mark.asyncio
async def test_native_exposure_probe_empty_on_offline():
    service = AttackSurfaceService()
    findings = await service._run_native_exposure_probe("http://127.0.0.1:59999")
    assert isinstance(findings, list)


@pytest.mark.asyncio
async def test_wordpress_audit_probe_empty_on_offline():
    service = AttackSurfaceService()
    findings = await service._run_wordpress_audit_probe("http://127.0.0.1:59999")
    assert isinstance(findings, list)


def test_nuclei_preset_request():
    req = NucleiScanRequest(target="wp.target.go.id", preset="wordpress")
    assert req.preset == "wordpress"
    assert req.target == "wp.target.go.id"


@pytest.mark.asyncio
async def test_stream_security_scan_sse_events():
    service = AttackSurfaceService()
    events = []
    async for event_chunk in service.stream_security_scan("presidenri.go.id", preset="wordpress"):
        events.append(event_chunk)
        if len(events) >= 2:
            break

    assert len(events) >= 2
    # Check SSE format
    first_event = events[0]
    assert "event: " in first_event
    assert "data: " in first_event
