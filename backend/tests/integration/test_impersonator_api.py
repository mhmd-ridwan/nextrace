"""
Integration tests for Module B: Brand Impersonator Hunter API.
"""

import io

import pytest
from httpx import AsyncClient
from PIL import Image


def make_png_bytes(color: tuple[int, int, int] = (16, 52, 166)) -> bytes:
    img = Image.new("RGB", (64, 64), color=color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.mark.asyncio
class TestImpersonatorAPI:
    async def test_baseline_creation_and_scan(self, client: AsyncClient, test_db):
        avatar_bytes = make_png_bytes()

        # 1. Create baseline
        form_data = {
            "brand_name": "Test Brand Official",
            "official_username": "testbrand",
            "display_name": "Test Brand",
            "website_url": "https://testbrand.co.id",
            "business_category": "Retail",
        }
        files = {
            "avatar": ("logo.png", avatar_bytes, "image/png"),
        }

        base_resp = await client.post(
            "/api/v1/impersonator/baseline",
            data=form_data,
            files=files,
        )
        assert base_resp.status_code == 200
        baseline = base_resp.json()
        baseline_id = baseline["id"]
        assert baseline["official_username"] == "testbrand"

        # 2. Scan candidates against baseline
        scan_payload = {
            "baseline_id": baseline_id,
            "candidates": [
                {
                    "platform": "Instagram",
                    "profile_url": "https://instagram.com/testbrand_support",
                    "username": "testbrand_support",
                    "display_name": "Test Brand Customer Care",
                    "bio": "Official Helpdesk. Order via WA: +62899999999. bit.ly/testpromo",
                    "contact_info": {"whatsapp": "+62899999999"},
                },
                {
                    "platform": "Instagram",
                    "profile_url": "https://instagram.com/t\u0435stbrand",  # Cyrillic 'е'
                    "username": "t\u0435stbrand",
                    "display_name": "Test Brand",
                    "bio": "Diskon kilat khusus hari ini!",
                },
            ],
        }

        scan_resp = await client.post("/api/v1/impersonator/scan", json=scan_payload)
        assert scan_resp.status_code == 200
        scan_data = scan_resp.json()

        assert scan_data["total_candidates"] == 2
        assert len(scan_data["findings"]) == 2

        # Check homoglyph finding
        homoglyph_finding = [f for f in scan_data["findings"] if f["candidate"]["username"] == "t\u0435stbrand"][0]
        assert homoglyph_finding["username_similarity"]["homoglyph_detected"] is True

        # Check suffix finding
        suffix_finding = [f for f in scan_data["findings"] if f["candidate"]["username"] == "testbrand_support"][0]
        assert suffix_finding["risk_score"] > 20.0
