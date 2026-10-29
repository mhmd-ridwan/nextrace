"""Unit tests for Phone Intelligence Service."""

import pytest

from app.services.phone_intel_service import PhoneIntelService


@pytest.fixture
def phone_intel_service() -> PhoneIntelService:
    return PhoneIntelService()


def test_phone_hlr_resolution_telkomsel(phone_intel_service: PhoneIntelService):
    hlr = phone_intel_service.resolve_hlr("08119882233")
    assert hlr.mcc == "510"
    assert hlr.mnc == "10"
    assert "Telkomsel" in hlr.mcc_mnc_label
    assert "VIP" in hlr.origin_city or "Jakarta" in hlr.origin_city


def test_phone_hlr_resolution_xl(phone_intel_service: PhoneIntelService):
    hlr = phone_intel_service.resolve_hlr("087809717636")
    assert hlr.mcc == "510"
    assert hlr.mnc == "11"
    assert "XL Axiata" in hlr.mcc_mnc_label


def test_phone_virtual_voip_detection(phone_intel_service: PhoneIntelService):
    # Standard cellular
    cell = phone_intel_service.detect_virtual_voip("081234567890")
    assert cell.is_virtual_voip is False
    assert "Physical SIM" in cell.line_nature

    # Virtual cloud PBX
    voip = phone_intel_service.detect_virtual_voip("02150889900")
    assert voip.is_virtual_voip is True
    assert "VoIP" in voip.line_nature or "PBX" in voip.line_nature


def test_phone_crowdsourced_reputation_scoring(phone_intel_service: PhoneIntelService):
    # Suspicious with breach history
    suspect = phone_intel_service.evaluate_reputation("087809717636", has_breaches=True, is_virtual=False)
    assert suspect.is_spam_suspect is True
    assert suspect.spam_score >= 60
    assert len(suspect.popular_tags) > 0

    # Clean without breaches
    clean = phone_intel_service.evaluate_reputation("08119882233", has_breaches=False, is_virtual=False)
    assert len(clean.popular_tags) > 0
