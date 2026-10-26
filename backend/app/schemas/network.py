"""
NEXTRACE Domain, DNS, and Network OSINT Schemas.
Pydantic v2 data contracts for live domain audit, DNS resolution, and WHOIS intelligence.
"""

from pydantic import BaseModel, ConfigDict, Field


class DomainAuditRequest(BaseModel):
    """Input payload for auditing a domain or URL."""

    domain: str = Field(..., min_length=2, max_length=253, description="Target domain, hostname, or full URL")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "domain": "presidenri.go.id",
            }
        }
    )


class DnsRecordItem(BaseModel):
    """Individual DNS record entry."""

    record_type: str
    value: str
    priority: int | None = None
    ttl: int | None = None


class DomainAuditResponse(BaseModel):
    """Full forensic domain audit and reputation assessment."""

    domain: str
    clean_domain: str
    registrar: str
    created_date: str
    expiry_date: str
    updated_date: str = "-"
    domain_age_days: int | None = None
    domain_age_formatted: str
    nameservers: list[str] = Field(default_factory=list)
    ip_addresses: list[str] = Field(default_factory=list)
    primary_ip: str = "-"
    ssl_issuer: str = "-"
    ssl_expiry: str = "-"
    risk_status: str = "Aman"  # "Aman" | "Sedang" | "Tinggi"
    risk_score: int = 10  # 0 to 100
    risk_reasons: list[str] = Field(default_factory=list)
    reputation_notes: str
    dns_records: dict[str, list[str]] = Field(default_factory=dict)
    raw_whois: str = ""
    is_live_data: bool = True
    audited_at: str

    model_config = ConfigDict(from_attributes=True)
