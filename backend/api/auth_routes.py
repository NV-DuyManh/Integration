# backend/api/auth_routes.py
# ─────────────────────────────────────────────────────────────────
#  Authentication endpoints (middleware-level, no DB schema changes)
# ─────────────────────────────────────────────────────────────────
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
import hashlib
import secrets

router = APIRouter()

# ── In-memory session store (demo — replace with Redis/JWT in prod)
_sessions: dict[str, dict] = {}


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    username: str
    role: str
    expires_at: str


# ── Demo credentials (middleware-only, no DB writes) ─────────────
_DEMO_USERS = {
    "admin": {"password_hash": hashlib.sha256("admin123".encode()).hexdigest(), "role": "admin"},
    "viewer": {"password_hash": hashlib.sha256("viewer123".encode()).hexdigest(), "role": "viewer"},
}


@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    """Authenticate user against demo credentials."""
    user = _DEMO_USERS.get(req.username)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username")

    provided_hash = hashlib.sha256(req.password.encode()).hexdigest()
    if provided_hash != user["password_hash"]:
        raise HTTPException(status_code=401, detail="Invalid password")

    token = secrets.token_hex(32)
    _sessions[token] = {
        "username": req.username,
        "role": user["role"],
        "created": datetime.now(timezone.utc).isoformat(),
    }

    return LoginResponse(
        token=token,
        username=req.username,
        role=user["role"],
        expires_at="session",
    )


@router.get("/me")
async def get_current_user(token: str = ""):
    """Get current user info from session token."""
    session = _sessions.get(token)
    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return session


@router.post("/logout")
async def logout(token: str = ""):
    """Invalidate session."""
    _sessions.pop(token, None)
    return {"message": "Logged out"}
