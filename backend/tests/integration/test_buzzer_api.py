"""
Integration tests for Module E: Buzzer & Bot Hunter API.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestBuzzerAPI:
    async def test_buzzer_scan_lifecycle(self, client: AsyncClient, test_db):
        # 1. Trigger scan
        req_payload = {
            "target_url": "https://www.instagram.com/mhmmd.ridwan/",
            "platform": "Instagram",
            "max_comments": 15,
            "investigation_id": "inv-test-buzzer",
        }
        scan_resp = await client.post("/api/v1/buzzer/scan", json=req_payload)
        assert scan_resp.status_code == 200
        scan_data = scan_resp.json()
        scan_id = scan_data["scan_id"]
        assert scan_data["target_author"] == "mhmmd.ridwan"
        assert len(scan_data["comments"]) > 0
        assert "scan_metadata" in scan_data

        # 2. Get scan detail
        get_resp = await client.get(f"/api/v1/buzzer/scans/{scan_id}")
        assert get_resp.status_code == 200
        detail = get_resp.json()
        assert detail["scan_id"] == scan_id

        # 3. List scans
        list_resp = await client.get("/api/v1/buzzer/scans")
        assert list_resp.status_code == 200
        scans = list_resp.json()
        assert any(s["scan_id"] == scan_id for s in scans)

        # 4. Get stats
        stats_resp = await client.get("/api/v1/buzzer/stats")
        assert stats_resp.status_code == 200
        stats = stats_resp.json()
        assert stats["total_scans"] >= 1

        # 5. Delete scan
        del_resp = await client.delete(f"/api/v1/buzzer/scans/{scan_id}")
        assert del_resp.status_code == 200
        assert del_resp.json()["success"] is True
