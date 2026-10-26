"""
Unit tests for Link Analyzer Service.
Validates URL heuristics without making network requests.
"""

import pytest

from app.services.link_analyzer import LinkAnalyzerService


class TestLinkAnalyzer:
    @pytest.fixture
    def service(self):
        return LinkAnalyzerService()

    def test_ordinary_public_website(self, service):
        res = service.analyze_single(
            "https://batiknusantara.co.id/catalog",
            official_domain="batiknusantara.co.id",
        )
        assert res.risk_level == "low"
        assert res.is_shortened is False
        assert res.is_punycode is False
        assert res.has_suspicious_redirect is False

    def test_shortened_url(self, service):
        res = service.analyze_single("https://bit.ly/claim-promo-batik")
        assert res.is_shortened is True
        assert res.risk_level in ("medium", "high")
        assert any("shortener" in ind.lower() for ind in res.risk_indicators)

    def test_punycode_domain(self, service):
        res = service.analyze_single("https://xn--batiknusantra-y4b.com/login")
        assert res.is_punycode is True
        assert res.risk_level == "high"
        assert any("punycode" in ind.lower() for ind in res.risk_indicators)

    def test_suspicious_redirect_parameter(self, service):
        res = service.analyze_single("https://safe-domain.example/out?redirect=https://evil.example")
        assert res.has_suspicious_redirect is True
        assert any("redirect" in ind.lower() for ind in res.risk_indicators)

    def test_malformed_url(self, service):
        res = service.analyze_single("http://[invalid:ipv6:format")
        assert res.risk_level in ("low", "medium")
