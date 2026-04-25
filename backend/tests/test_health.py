# backend/tests/test_health.py
# ─────────────────────────────────────────────────────────────────
#  Tests for /health endpoint and basic app startup
# ─────────────────────────────────────────────────────────────────
import pytest
from httpx import AsyncClient, ASGITransport

# Import the FastAPI app
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app import app


@pytest.mark.asyncio
async def test_health_endpoint():
    """Verify /health returns correct structure."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert "databases" in data
        assert data["databases"]["sqlserver"] == "HUMAN_2025"
        assert data["databases"]["mysql"] == "PAYROLL_2026"


@pytest.mark.asyncio
async def test_health_response_keys():
    """Verify /health response has exactly the expected keys."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/health")
        data = resp.json()
        assert set(data.keys()) == {"status", "databases"}
        assert set(data["databases"].keys()) == {"sqlserver", "mysql"}
