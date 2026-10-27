"""
NEXTRACE Attack Surface Management (ASM) & Nuclei Vulnerability Schemas.
Pydantic v2 data models for Subdomain Enumeration and Nuclei Scan results.
"""

from pydantic import BaseModel, ConfigDict, Field


class SubdomainItem(BaseModel):
    """Discovered subdomain asset with live telemetry."""

    subdomain: str = Field(..., description="Fully Qualified Domain Name of subdomain")
    ip_addresses: list[str] = Field(default_factory=list, description="Resolved IPv4/IPv6 addresses")
    status_code: int | None = Field(default=None, description="HTTP response status code")
    title: str | None = Field(default=None, description="HTML page title if web service is active")
    server: str | None = Field(default=None, description="HTTP Server header banner")
    cname: str | None = Field(default=None, description="CNAME canonical alias pointer")
    is_takeover_risk: bool = Field(default=False, description="Flag indicating dangling DNS takeover vulnerability")
    takeover_service: str | None = Field(default=None, description="Vulnerable provider (e.g., GitHub, S3, Azure)")
    is_live: bool = Field(default=False, description="Whether host responds to DNS or HTTP probe")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "subdomain": "portal.target.go.id",
                "ip_addresses": ["103.10.12.5"],
                "status_code": 200,
                "title": "Portal Resmi Pemerintahan",
                "server": "nginx/1.24.0",
                "cname": None,
                "is_takeover_risk": False,
                "is_live": True,
            }
        }
    )


class SubdomainScanRequest(BaseModel):
    """Input payload to trigger passive/active subdomain enumeration."""

    domain: str = Field(..., min_length=2, max_length=253, description="Target apex root domain (e.g. target.go.id)")
    max_subdomains: int = Field(default=60, ge=5, le=300, description="Maximum number of subdomains to resolve")
    investigation_id: str | None = Field(default=None, description="Optional associated case ID")


class SubdomainScanResponse(BaseModel):
    """Result of subdomain enumeration."""

    target_domain: str
    total_found: int
    live_count: int
    takeover_risk_count: int
    subdomains: list[SubdomainItem] = Field(default_factory=list)
    scanned_at: str
    execution_time_seconds: float


class NucleiVulnerabilityItem(BaseModel):
    """Single vulnerability or exposure detected by Nuclei."""

    template_id: str = Field(..., description="Unique Nuclei template identifier")
    name: str = Field(..., description="Vulnerability or exposure title")
    severity: str = Field(..., description="Severity level: info, low, medium, high, critical")
    matched_at: str = Field(..., description="Exact URL or endpoint that triggered the finding")
    extracted_results: list[str] = Field(default_factory=list, description="Matched tokens, leaked keys, or versions")
    description: str | None = Field(default=None, description="Technical summary of the issue")
    cve_id: str | None = Field(default=None, description="CVE ID if applicable")
    type: str | None = Field(default=None, description="Protocol type: http, dns, ssl")
    curl_command: str | None = Field(default=None, description="Reproducible curl command")
    remediation: str | None = Field(default=None, description="Suggested mitigation steps")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "template_id": "env-file-disclosure",
                "name": "Environment Variables File Exposure",
                "severity": "critical",
                "matched_at": "https://dev.target.go.id/.env",
                "extracted_results": ["DB_PASSWORD=secret", "APP_KEY=base64:..."],
                "description": "Sensitive environment configuration file accessible over public web.",
                "cve_id": None,
                "type": "http",
            }
        }
    )


class NucleiScanRequest(BaseModel):
    """Input payload to trigger a focused Nuclei vulnerability scan."""

    target: str = Field(..., min_length=3, max_length=500, description="Target URL or hostname")
    tags: list[str] = Field(
        default_factory=lambda: ["exposure", "misconfig", "takeover", "phishing", "panel", "cve"],
        description="Nuclei template tags filter",
    )
    severity: list[str] = Field(
        default_factory=lambda: ["critical", "high", "medium", "low"],
        description="Severity levels to report",
    )
    investigation_id: str | None = Field(default=None, description="Optional associated case ID")


class NucleiScanResponse(BaseModel):
    """Aggregated report of Nuclei security assessment."""

    target: str
    total_findings: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    info_count: int
    findings: list[NucleiVulnerabilityItem] = Field(default_factory=list)
    scanned_at: str
    execution_time_seconds: float
