"""
NEXTRACE Username Similarity Service.
Analyzes usernames for impersonation indicators, edit distance,
substitutions, homoglyphs, and affixes.
"""

import unicodedata

from rapidfuzz import fuzz
from rapidfuzz.distance import Levenshtein

from app.schemas.impersonator import UsernameSimilarityResult
from app.services.homoglyph_detection import HomoglyphDetectionService

SUBSTITUTION_MAP = {
    "a": ["4", "@", "\u0430"],
    "e": ["3", "€", "\u0435"],
    "i": ["1", "!", "l", "|", "í", "ì", "ı"],
    "o": ["0", "\u043e"],
    "s": ["5", "$"],
    "t": ["7", "+"],
    "b": ["8"],
    "g": ["9", "\u0261"],
    "l": ["1", "|", "I"],
}

SUSPICIOUS_PREFIXES = [
    "real",
    "the",
    "official",
    "verified",
    "original",
    "true",
]

SUSPICIOUS_SUFFIXES = [
    "official",
    "real",
    "verified",
    "original",
    "support",
    "help",
    "helpdesk",
    "cs",
    "care",
    "service",
    "id",
    "store",
    "shop",
    "buy",
    "order",
    "promo",
]


class UsernameSimilarityService:
    """Analyzes username similarity and impersonation indicators."""

    def __init__(self):
        self.homoglyph_service = HomoglyphDetectionService()

    def analyze(
        self,
        official_username: str,
        candidate_username: str,
    ) -> UsernameSimilarityResult:
        """
        Compare two usernames for similarity and impersonation indicators.
        """
        norm_official = self._normalize(official_username)
        norm_candidate = self._normalize(candidate_username)

        # Edit distance
        edit_distance = int(Levenshtein.distance(norm_official, norm_candidate))

        # Normalized similarity ratio (0.0 to 1.0)
        similarity_ratio = float(fuzz.ratio(norm_official, norm_candidate)) / 100.0

        # Character substitution detection
        substitutions = self._detect_substitutions(norm_official, norm_candidate)

        # Homoglyph detection
        homoglyph_result = self.homoglyph_service.detect(candidate_username)
        homoglyph_detected = homoglyph_result["has_confusables"]
        confusable_chars = homoglyph_result["confusable_chars"]

        # Suspicious affixes
        suspicious_affixes = self._check_suspicious_affixes(norm_candidate, norm_official)

        # Determine suspicion
        is_suspicious = (
            (similarity_ratio >= 0.70 and edit_distance > 0 and edit_distance <= 5)
            or homoglyph_detected
            or len(substitutions) > 0
            or len(suspicious_affixes) > 0
        )

        return UsernameSimilarityResult(
            edit_distance=edit_distance,
            similarity_ratio=round(similarity_ratio, 4),
            homoglyph_detected=homoglyph_detected,
            confusable_chars=confusable_chars,
            substitution_patterns=substitutions,
            suspicious_affixes=suspicious_affixes,
            is_suspicious=is_suspicious,
        )

    def _normalize(self, username: str) -> str:
        """Normalize username with NFKC lowercase."""
        return unicodedata.normalize("NFKC", username.strip().lower())

    def _detect_substitutions(self, official: str, candidate: str) -> list[str]:
        """Detect character substitutions."""
        substitutions = []

        clean_off = official.replace("_", "").replace("-", "").replace(".", "")
        clean_cand = candidate.replace("_", "").replace("-", "").replace(".", "")

        if len(clean_off) == len(clean_cand):
            for i, (off_c, cand_c) in enumerate(zip(clean_off, clean_cand, strict=False)):
                if off_c != cand_c:
                    if off_c in SUBSTITUTION_MAP and cand_c in SUBSTITUTION_MAP[off_c]:
                        substitutions.append(f"Position {i}: '{off_c}' substituted with '{cand_c}'")
                    else:
                        substitutions.append(f"Position {i}: '{off_c}' changed to '{cand_c}'")
        return substitutions

    def _check_suspicious_affixes(self, candidate: str, official: str) -> list[str]:
        """Detect suspicious prefixes and suffixes."""
        results = []
        separators = ["_", "-", ".", ""]

        for sep in separators:
            for prefix in SUSPICIOUS_PREFIXES:
                if candidate == f"{prefix}{sep}{official}":
                    results.append(f"Suspicious prefix: '{prefix}{sep}'")

            for suffix in SUSPICIOUS_SUFFIXES:
                if candidate == f"{official}{sep}{suffix}":
                    results.append(f"Suspicious suffix: '{sep}{suffix}'")

        return results
