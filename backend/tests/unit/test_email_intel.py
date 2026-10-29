"""Unit tests for Email Intelligence Service."""

import pytest

from app.services.email_intel_service import EmailIntelService


@pytest.fixture
def email_intel_service() -> EmailIntelService:
    return EmailIntelService()


def test_email_structure_analysis_dot_trick(email_intel_service: EmailIntelService):
    analysis = email_intel_service.analyze_structure("bantuan.presiden.jokowi@gmail.com", is_disposable=False)
    assert analysis.has_dot_trick is True
    assert analysis.canonical_email == "bantuanpresidenjokowi@gmail.com"
    assert analysis.domain == "gmail.com"
    assert analysis.domain_category == "Layanan Webmail Konsumen"


def test_email_structure_analysis_plus_tag(email_intel_service: EmailIntelService):
    analysis = email_intel_service.analyze_structure("analis+forensic01@nextrace.id", is_disposable=False)
    assert analysis.has_plus_addressing is True
    assert analysis.base_local_part == "analis"
    assert analysis.plus_tag == "forensic01"
    assert analysis.has_dot_trick is False


def test_email_structure_analysis_disposable(email_intel_service: EmailIntelService):
    analysis = email_intel_service.analyze_structure("anon_bot@tempmail.com", is_disposable=True)
    assert analysis.domain_category == "Burner / Disposable Mail"


@pytest.mark.asyncio
async def test_email_dns_security_audit(email_intel_service: EmailIntelService):
    dns_info = await email_intel_service.audit_dns_security("gmail.com")
    assert dns_info.domain == "gmail.com"
    assert dns_info.has_mx is True
    assert len(dns_info.mx_records) > 0
    assert dns_info.security_verdict != ""


@pytest.mark.asyncio
async def test_email_gravatar_offline_resilience(email_intel_service: EmailIntelService):
    # Tests that query runs safely and returns a well-formed GravatarProfile
    profile = await email_intel_service.fetch_gravatar_profile("unknown.test.account.999@domain.xyz")
    assert profile.email_hash is not None
    assert len(profile.email_hash) == 32
