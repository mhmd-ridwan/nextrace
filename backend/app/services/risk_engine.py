"""
NEXTRACE Risk Scoring Engine.
Transparent, configurable risk assessment with explanations.
"""

from app.schemas.leak import RiskAssessment

# Default weights for impersonation risk factors
DEFAULT_IMPERSONATION_WEIGHTS = {
    "avatar_similarity": 0.30,
    "username_similarity": 0.25,
    "display_name_similarity": 0.15,
    "homoglyph_detected": 0.10,
    "suspicious_links": 0.10,
    "suspicious_contacts": 0.05,
    "bio_indicators": 0.05,
}

# Sensitivity scoring for exposed data fields in breaches
FIELD_SENSITIVITY = {
    "password": 95,
    "hashed_password": 70,
    "credit_card": 95,
    "bank_account": 90,
    "national_id": 90,
    "ssn": 95,
    "medical_record": 85,
    "biometric": 90,
    "email": 50,
    "phone": 55,
    "full_name": 30,
    "address": 60,
    "date_of_birth": 50,
    "username": 25,
    "ip_address": 35,
    "device_id": 30,
    "location": 40,
    "purchase_history": 35,
    "browsing_history": 30,
}

RISK_LEVELS = [
    (0, 29, "low", "Low risk - routine monitoring recommended"),
    (30, 59, "medium", "Medium risk - further investigation suggested"),
    (60, 79, "high", "High risk - priority review recommended"),
    (80, 100, "critical", "Critical risk - immediate attention advised"),
]


class RiskEngine:
    """
    Transparent risk scoring engine with configurable weights.
    Triage scores (0-100) are heuristic indicators, not calibrated probabilities.
    """

    def __init__(self, weights: dict | None = None):
        self.weights = weights or DEFAULT_IMPERSONATION_WEIGHTS.copy()

    def calculate_impersonation_risk(self, indicators: dict) -> dict:
        """Calculate impersonation risk from multiple signals."""
        factors = []
        weighted_sum = 0.0
        total_weight = 0.0

        for factor_name, weight in self.weights.items():
            value = indicators.get(factor_name, 0.0)
            value = max(0.0, min(100.0, float(value)))
            contribution = value * weight
            weighted_sum += contribution
            total_weight += weight

            factors.append(
                {
                    "factor": factor_name,
                    "raw_value": round(value, 2),
                    "weight": weight,
                    "contribution": round(contribution, 2),
                }
            )

        score = (weighted_sum / total_weight) if total_weight > 0 else 0.0
        score = round(max(0.0, min(100.0, score)), 2)
        severity = self._get_risk_level(score)
        explanation = self._build_explanation(score, severity, factors)

        return {
            "score": score,
            "severity": severity,
            "factors": factors,
            "explanation": explanation,
            "weights_used": self.weights.copy(),
            "disclaimer": (
                "This score is an automated triage indicator based on "
                "configurable heuristics. It is not a calibrated probability "
                "of fraud or impersonation."
            ),
        }

    def calculate_breach_risk(
        self,
        incidents: list[dict],
        all_exposed_fields: list[str],
    ) -> RiskAssessment:
        """Calculate risk from breach intelligence data."""
        factors = []
        score = 0.0

        # 1. Incident count (0-25)
        incident_count = len(incidents)
        incident_score = min(25.0, incident_count * 8.0)
        factors.append(
            {
                "factor": "incident_count",
                "value": incident_count,
                "points": round(incident_score, 2),
                "description": f"{incident_count} breach incident(s) documented",
            }
        )
        score += incident_score

        # 2. Field sensitivity (0-40)
        max_sensitivity = 0
        sensitive_fields = []
        for field in all_exposed_fields:
            field_clean = str(field).lower().strip().replace(" ", "_")
            sens = FIELD_SENSITIVITY.get(field_clean, 20)
            if sens > max_sensitivity:
                max_sensitivity = sens
            if sens >= 60:
                sensitive_fields.append(field)

        sens_score = min(40.0, max_sensitivity * 0.4)
        factors.append(
            {
                "factor": "field_sensitivity",
                "value": max_sensitivity,
                "points": round(sens_score, 2),
                "description": (
                    f"Peak field sensitivity: {max_sensitivity}/100. "
                    f"Critical fields: {', '.join(sensitive_fields) or 'None'}"
                ),
            }
        )
        score += sens_score

        # 3. Credential exposure (0-20)
        cred_fields = {"password", "hashed_password", "token", "secret", "api_key"}
        has_creds = bool(cred_fields & {str(f).lower().strip().replace(" ", "_") for f in all_exposed_fields})
        cred_score = 20.0 if has_creds else 0.0
        factors.append(
            {
                "factor": "credential_exposure",
                "value": has_creds,
                "points": round(cred_score, 2),
                "description": "Credentials exposed" if has_creds else "No credentials detected in exposed fields",
            }
        )
        score += cred_score

        # 4. Source variety (0-15)
        sources = {inc.get("source_name", "") for inc in incidents if inc.get("source_name")}
        source_score = min(15.0, len(sources) * 5.0)
        factors.append(
            {
                "factor": "independent_sources",
                "value": len(sources),
                "points": round(source_score, 2),
                "description": f"{len(sources)} independent breach source(s)",
            }
        )
        score += source_score

        score = round(min(100.0, score), 2)
        level = self._get_risk_level(score)

        return RiskAssessment(
            score=score,
            level=level,
            factors=factors,
            explanation=self._build_explanation(score, level, factors),
        )

    def _get_risk_level(self, score: float) -> str:
        for low, high, level, _ in RISK_LEVELS:
            if low <= score <= high:
                return level
        return "low"

    def _build_explanation(self, score: float, severity: str, factors: list[dict]) -> str:
        lines = [
            f"Risk Score: {score}/100 (Severity: {severity.upper()})",
            "",
            "Contributing Factors:",
        ]
        for f in factors:
            desc = f.get("description", f.get("factor", ""))
            pts = f.get("points", f.get("contribution", 0))
            lines.append(f"  • {desc} ({pts} pts)")

        for _low, _high, level, note in RISK_LEVELS:
            if level == severity:
                lines.append(f"\nOperational Guidance: {note}")
                break
        return "\n".join(lines)
