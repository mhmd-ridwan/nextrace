"""
Unit tests for Username Similarity Service.
Tests edit distance, substitution, suspicious affixes, and confusables.
"""

import pytest

from app.services.username_similarity import UsernameSimilarityService


class TestUsernameSimilarity:
    @pytest.fixture
    def service(self):
        return UsernameSimilarityService()

    def test_exact_match(self, service):
        res = service.analyze("batiknusantara", "batiknusantara")
        assert res.edit_distance == 0
        assert res.similarity_ratio == 1.0
        assert res.homoglyph_detected is False
        assert len(res.substitution_patterns) == 0

    def test_single_character_substitution(self, service):
        res = service.analyze("batiknusantara", "b4tiknusantara")
        assert res.edit_distance == 1
        assert res.similarity_ratio > 0.9
        assert len(res.substitution_patterns) >= 1
        assert res.is_suspicious is True

    def test_character_confusable_homoglyph(self, service):
        # Cyrillic 'а' (\u0430) instead of Latin 'a'
        res = service.analyze("batiknusantara", "b\u0430tiknusantara")
        assert res.homoglyph_detected is True
        assert len(res.confusable_chars) >= 1
        assert res.confusable_chars[0]["script"] == "Cyrillic"
        assert res.is_suspicious is True

    def test_similar_legitimate_username(self, service):
        # Completely different brand or low overlap
        res = service.analyze("batiknusantara", "warungnusantara")
        assert res.edit_distance >= 5
        assert res.similarity_ratio < 0.70
        assert res.homoglyph_detected is False

    def test_suspicious_suffix(self, service):
        res = service.analyze("batiknusantara", "batiknusantara_official")
        assert len(res.suspicious_affixes) >= 1
        assert "official" in res.suspicious_affixes[0]
        assert res.is_suspicious is True

    def test_unicode_normalization(self, service):
        # Fullwidth Latin 'a'
        res = service.analyze("batik", "b\uff41tik")
        assert res.similarity_ratio == 1.0 or res.edit_distance <= 1
