# backend/tests/test_auth.py
# ─────────────────────────────────────────────────────────────────
#  Tests for /api/auth/* endpoints
# ─────────────────────────────────────────────────────────────────
import pytest
from httpx import AsyncClient, ASGITransport

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app import app


@pytest.mark.asyncio
async def test_login_success():
    """Valid credentials should return a token."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/auth/login", json={
            "username": "admin",
            "password": "admin123",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data
        assert data["username"] == "admin"
        assert data["role"] == "admin"


@pytest.mark.asyncio
async def test_login_wrong_password():
    """Invalid password should return 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/auth/login", json={
            "username": "admin",
            "password": "wrong",
        })
        assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_unknown_user():
    """Unknown username should return 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/auth/login", json={
            "username": "nobody",
            "password": "anything",
        })
        assert resp.status_code == 401


@pytest.mark.asyncio
async def test_logout():
    """Logout should succeed."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Login first
        login_resp = await client.post("/api/auth/login", json={
            "username": "admin",
            "password": "admin123",
        })
        token = login_resp.json()["token"]

        # Logout
        resp = await client.post(f"/api/auth/logout?token={token}")
        assert resp.status_code == 200

        # Session should be invalid now
        me_resp = await client.get(f"/api/auth/me?token={token}")
        assert me_resp.status_code == 401
