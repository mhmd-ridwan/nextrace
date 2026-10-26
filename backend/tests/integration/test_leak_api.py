"""
Integration tests for Module A: Leak Tracer & Email Aliases.
"""

import pytest
from httpx import AsyncClient

from app.db.seed import seed_demo_data


@pytest.mark.asyncio
class TestLeakAPI:
    async def test_matching_synthetic_identifier(self, client: AsyncClient, test_db):
        await seed_demo_data(test_db)

        payload = {
            "identifier": "demo@example.com",
            "identifier_type": "email",
        }
        resp = await client.post("/api/v1/leak/check", json=payload)
        assert resp.status_code == 200
        data = resp.json()

        assert data["total_incidents"] > 0
        assert data["identifier_type"] == "email"
        # Masked email
        assert "***" in data["identifier_masked"]
        assert "@example.com" in data["identifier_masked"]
        assert data["risk_score"] > 0
        assert len(data["incidents"]) > 0
        assert data["incidents"][0].get("source_name") is not None

    async def test_no_match_result(self, client: AsyncClient, test_db):
        await seed_demo_data(test_db)

        payload = {
            "identifier": "unknown.unleaked.clean@safedomain.test",
            "identifier_type": "email",
        }
        resp = await client.post("/api/v1/leak/check", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_incidents"] == 0
        assert data["risk_score"] == 0.0
        assert data["risk_level"] == "low"
        assert len(data["disclaimer"]) > 0

    async def test_invalid_identifier_validation(self, client: AsyncClient):
        payload = {
            "identifier": "not-an-email",
            "identifier_type": "email",
        }
        resp = await client.post("/api/v1/leak/check", json=payload)
        assert resp.status_code == 422

    async def test_alias_creation_uniqueness(self, client: AsyncClient, test_db):
        payload1 = {
            "service_label": "marketplace_vendor_a",
            "primary_email": "security@company.co.id",
        }
        resp1 = await client.post("/api/v1/aliases/generate", json=payload1)
        assert resp1.status_code == 200
        data1 = resp1.json()

        resp2 = await client.post("/api/v1/aliases/generate", json=payload1)
        assert resp2.status_code == 200
        data2 = resp2.json()

        # Each generated alias must be uniquely tagged
        assert data1["alias_id"] != data2["alias_id"]
        assert data1["alias_address"] != data2["alias_address"]

    async def test_inbound_event_mapped_to_alias(self, client: AsyncClient, test_db):
        # 1. Generate alias
        gen_resp = await client.post(
            "/api/v1/aliases/generate",
            json={
                "service_label": "partner_b",
                "primary_email": "investigator@company.co.id",
            },
        )
        alias_id = gen_resp.json()["alias_id"]

        # 2. Record inbound event
        event_payload = {
            "sender_domain": "spam-campaign.test",
            "subject_snippet": "Unsolicited promotional offer",
            "headers_meta": {"x-ip": "192.0.2.1"},
            "message_fingerprint": "hash_sample_123",
        }
        evt_resp = await client.post(f"/api/v1/aliases/{alias_id}/events", json=event_payload)
        assert evt_resp.status_code == 200
        evt_data = evt_resp.json()
        assert evt_data["alias_id"] == alias_id
        assert evt_data["sender_domain"] == "spam-campaign.test"

        # 3. Retrieve alias with events
        get_resp = await client.get(f"/api/v1/aliases/{alias_id}")
        assert get_resp.status_code == 200
        detail = get_resp.json()
        assert len(detail["events"]) >= 1
