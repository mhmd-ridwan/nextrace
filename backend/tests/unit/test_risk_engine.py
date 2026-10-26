"""
Unit tests for Risk Scoring Engine (Impersonation & Breach calculation).
"""

import pytest

from app.services.risk_engine import RiskEngine


class TestRiskEngine:
    @pytest.fixture
    def engine(self):
        return RiskEngine()

    def test_impersonation_risk_critical(self, engine):
        indicators = {
            "avatar_similarity": 95.0,
            "username_similarity": 90.0,
            "display_name_similarity": 95.0,
            "homoglyph_detected": 100.0,
            "suspicious_links": 100.0,
            "suspicious_contacts": 100.0,
            "bio_indicators": 100.0,
        }
        res = engine.calculate_impersonation_risk(indicators)
        assert res["score"] >= 80.0
        assert res["severity"] == "critical"
        assert len(res["factors"]) > 0
        assert "Risk Score:" in res["explanation"]

    def test_impersonation_risk_low(self, engine):
        indicators = {
            "avatar_similarity": 10.0,
            "username_similarity": 15.0,
            "display_name_similarity": 10.0,
            "homoglyph_detected": 0.0,
            "suspicious_links": 0.0,
            "suspicious_contacts": 0.0,
            "bio_indicators": 0.0,
        }
        res = engine.calculate_impersonation_risk(indicators)
        assert res["score"] < 30.0
        assert res["severity"] == "low"

    def test_breach_risk_assessment_with_credentials(self, engine):
        incidents = [
            {"source_name": "MegaShop"},
            {"source_name": "HealthPlus"},
        ]
        exposed_fields = ["email", "phone", "password", "medical_record"]

        assessment = engine.calculate_breach_risk(incidents, exposed_fields)
        assert assessment.score >= 50.0
        assert assessment.level in ("medium", "high", "critical")
        assert any(f["factor"] == "credential_exposure" and f["value"] is True for f in assessment.factors)
