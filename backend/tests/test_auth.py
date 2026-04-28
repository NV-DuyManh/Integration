# backend/tests/test_auth.py
# ─────────────────────────────────────────────────────────────────
#  Tests for /api/auth/* endpoints
# ─────────────────────────────────────────────────────────────────
import pytest
from httpx import AsyncClient, ASGITransport
import uuid

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app import app


@pytest.mark.asyncio
async def test_auth_flow():
    """Register, login, and logout flow."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Register a unique user
        test_username = f"user_{uuid.uuid4().hex[:8]}"
        reg_resp = await client.post("/api/auth/register", json={
            "username": test_username,
            "email": f"{test_username}@example.com",
            "password": "password123",
            "confirm_password": "password123"
        })
        assert reg_resp.status_code == 200
        
        # 2. Login
        login_resp = await client.post("/api/auth/login", json={
            "username": test_username,
            "password": "password123",
        })
        assert login_resp.status_code == 200
        data = login_resp.json()
        assert "token" in data
        assert data["username"] == test_username
        
        token = data["token"]
        
        # 3. Get Me
        me_resp = await client.get(f"/api/auth/me?token={token}")
        assert me_resp.status_code == 200
        
        # 4. Logout
        logout_resp = await client.post(f"/api/auth/logout?token={token}")
        assert logout_resp.status_code == 200
        
        # 5. Get Me should fail
        me_fail_resp = await client.get(f"/api/auth/me?token={token}")
        assert me_fail_resp.status_code == 401

@pytest.mark.asyncio
async def test_login_wrong_password():
    """Invalid password should return 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/auth/login", json={
            "username": "some_user",
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
