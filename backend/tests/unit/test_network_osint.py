"""
Unit tests for NetworkOSINTService (clean_domain, reputation heuristics, whois parser).
"""

from app.services.network_osint import NetworkOSINTService


def test_clean_domain_sanitization():
    service = NetworkOSINTService()
    assert service.clean_domain("https://www.presidenri.go.id/tentang/") == "presidenri.go.id"
    assert service.clean_domain("http://sub.domain.com:8080/path?q=1") == "sub.domain.com"
    assert service.clean_domain("WWW.KEMKES.GO.ID") == "kemkes.go.id"


def test_government_domain_reputation():
    service = NetworkOSINTService()
    status, score, reasons, notes = service.calculate_reputation(
        domain="presidenri.go.id",
        age_days=7000,
        registrar="Kominfo",
        ssl_issuer="Google Trust Services",
        dns_records={"MX": ["mail.presidenri.go.id"]},
    )
    assert status == "Aman"
    assert score == 0
    assert any("pemerintah" in r.lower() for r in reasons)


def test_fresh_phishing_domain_reputation():
    service = NetworkOSINTService()
    status, score, reasons, notes = service.calculate_reputation(
        domain="jokowi-bantuan-dana-2026.xyz",
        age_days=3,
        registrar="NameCheap",
        ssl_issuer="None",
        dns_records={"MX": []},
    )
    assert status == "Tinggi"
    assert score >= 60
    assert any("baru" in r.lower() for r in reasons)
    assert any("pemancingan" in r.lower() or "phishing" in r.lower() for r in reasons)


def test_whois_field_parsing():
    service = NetworkOSINTService()
    raw_sample = """
Domain Name: SAMPLE-TARGET.COM
Registry Domain ID: 12345_DOMAIN_COM
Creation Date: 2020-05-10T12:00:00Z
Registry Expiry Date: 2026-05-10T12:00:00Z
Registrar: MarkMonitor Inc.
Name Server: NS1.SAMPLE.COM
Name Server: NS2.SAMPLE.COM
"""
    fields = service.parse_whois_fields(raw_sample, "sample-target.com")
    assert fields["registrar"] == "MarkMonitor Inc."
    assert "2020-05-10" in fields["created_date"]
    assert "2026-05-10" in fields["expiry_date"]
    assert fields["age_days"] is not None
    assert fields["age_days"] > 1000
