"""
Integration tests for Module C (Evidence & Investigations) and Module D (Reports).
"""

import pytest
from httpx import AsyncClient

from app.db.seed import seed_demo_data


@pytest.mark.asyncio
class TestEvidenceAndReportAPI:
    async def test_investigation_lifecycle_and_timeline(self, client: AsyncClient, test_db):
        # 1. Create investigation
        inv_payload = {
            "title": "Brand Impersonation Dossier",
            "organization": "Security Unit",
            "target_brand": "Sample Brand",
            "priority": "high",
            "tags": ["phishing", "investigation"],
        }
        resp = await client.post("/api/v1/investigations", json=inv_payload)
        assert resp.status_code == 200
        inv_data = resp.json()
        inv_id = inv_data["id"]

        # 2. Ingest Evidence
        ev_form = {
            "investigation_id": inv_id,
            "evidence_type": "screenshot",
            "source_url": "https://instagram.com/fake_account",
            "collection_method": "manual_capture",
        }
        files = {
            "file": ("screenshot.png", b"fake-screenshot-binary-data", "image/png"),
        }
        ev_resp = await client.post("/api/v1/evidence", data=ev_form, files=files)
        assert ev_resp.status_code == 200
        ev_data = ev_resp.json()
        ev_id = ev_data["evidence_id"]
        assert ev_data["file_hash_sha256"] is not None

        # 3. Verify Integrity
        verify_resp = await client.get(f"/api/v1/evidence/{ev_id}/verify")
        assert verify_resp.status_code == 200
        verify_data = verify_resp.json()
        assert verify_data["is_valid"] is True
        assert verify_data["expected_hash"] == verify_data["actual_hash"]

        # 4. Check unified investigation timeline
        tl_resp = await client.get(f"/api/v1/investigations/{inv_id}/timeline")
        assert tl_resp.status_code == 200
        tl_data = tl_resp.json()
        assert tl_data["total_events"] >= 2  # Created + Evidence secured

    async def test_generate_and_download_pdf_report(self, client: AsyncClient, test_db):
        await seed_demo_data(test_db)

        rep_payload = {
            "investigation_id": "inv-demo-001",
            "report_type": "investigation_full",
            "format": "pdf",
            "reporting_organization": "NEXTRACE Incident Response",
            "requested_action": "Takedown requested",
        }
        resp = await client.post("/api/v1/reports/generate", json=rep_payload)
        assert resp.status_code == 200
        rep_data = resp.json()
        report_id = rep_data["report_id"]
        assert rep_data["file_hash_sha256"] is not None

        # Download report
        dl_resp = await client.get(f"/api/v1/reports/{report_id}/download")
        assert dl_resp.status_code == 200
        assert dl_resp.headers["content-type"] == "application/pdf"
        assert len(dl_resp.content) > 1000

    async def test_generate_json_report(self, client: AsyncClient, test_db):
        await seed_demo_data(test_db)

        rep_payload = {
            "investigation_id": "inv-demo-001",
            "report_type": "takedown",
            "format": "json",
            "reporting_organization": "NEXTRACE Incident Response",
        }
        resp = await client.post("/api/v1/reports/generate", json=rep_payload)
        assert resp.status_code == 200
        rep_data = resp.json()
        report_id = rep_data["report_id"]

        dl_resp = await client.get(f"/api/v1/reports/{report_id}/download")
        assert dl_resp.status_code == 200
        assert "application/json" in dl_resp.headers["content-type"]
        json_content = dl_resp.json()
        assert json_content["report_id"] == report_id
        assert "DRAFT" in json_content["disclaimer"]
