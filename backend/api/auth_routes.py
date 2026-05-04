# backend/api/auth_routes.py
# ─────────────────────────────────────────────────────────────────
#  Authentication endpoints — backed by local SQLite auth store
#  No changes to HUMAN_2025 or PAYROLL_2026 schemas
# ─────────────────────────────────────────────────────────────────
from fastapi import APIRouter, HTTPException, Header, Body, Depends, Query
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
import re
import logging

from services.transaction_service import TransactionService

from core.auth_store import (
    init_db,
    create_user,
    authenticate_user,
    create_session,
    validate_session,
    destroy_session,
    cleanup_expired_sessions,
    get_all_users,
    update_user_role,
    delete_user_by_id,
    force_reset_password,
)

router = APIRouter()
logger = logging.getLogger(__name__)

# ── Initialize SQLite auth DB on module load ─────────────────────
init_db()
logger.info("✅ Auth store initialized (SQLite)")


def require_admin(token: str = Query("")):
    if not token:
        raise HTTPException(status_code=401, detail="No token provided")
    user = validate_session(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    if user["role"].lower() != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized")
    return user


# ── Request / Response Models ────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    confirm_password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters")
        if len(v) > 32:
            raise ValueError("Username must be at most 32 characters")
        if not re.match(r"^[a-zA-Z0-9_.-]+$", v):
            raise ValueError("Username can only contain letters, numbers, underscores, dots, and hyphens")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", v):
            raise ValueError("Invalid email address")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        if len(v) > 128:
            raise ValueError("Password must be at most 128 characters")
        return v


class LoginRequest(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    token: str
    username: str
    email: str
    role: str
    message: str


class UserInfo(BaseModel):
    id: int
    username: str
    email: str
    role: str
    created_at: str


# ── Endpoints ────────────────────────────────────────────────────

@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    """Register a new user account."""
    # Confirm password match
    if req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    try:
        user = create_user(
            username=req.username,
            email=req.email,
            password=req.password,
        )
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

    # Auto-login after registration
    token = create_session(user["id"])
    logger.info("📝 New user registered: %s (%s)", user["username"], user["email"])

    TransactionService.log_transaction(
        action="REGISTER",
        target_db="auth.db",
        table="users",
        details=f"New user registered: {user['username']} ({user['email']})",
        user=user["username"],
    )

    return AuthResponse(
        token=token,
        username=user["username"],
        email=user["email"],
        role=user["role"],
        message="Account created successfully",
    )


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    """Authenticate user and create session."""
    # Cleanup expired sessions periodically
    cleanup_expired_sessions()

    try:
        user = authenticate_user(req.username, req.password)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    token = create_session(user["id"])
    logger.info("🔑 User logged in: %s", user["username"])

    TransactionService.log_transaction(
        action="LOGIN",
        target_db="auth.db",
        table="sessions",
        details=f"User logged in: {user['username']}",
        user=user["username"],
    )

    return AuthResponse(
        token=token,
        username=user["username"],
        email=user.get("email", ""),
        role=user["role"],
        message="Login successful",
    )


@router.get("/me", response_model=UserInfo)
async def get_current_user(token: str = ""):
    """Get current user info from session token."""
    if not token:
        raise HTTPException(status_code=401, detail="No token provided")

    user = validate_session(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    return UserInfo(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        role=user["role"],
        created_at=user["created_at"],
    )


@router.post("/logout")
async def logout(token: str = ""):
    """Invalidate session."""
    if token:
        # Resolve username before destroying session
        session_user = validate_session(token)
        destroyed = destroy_session(token)
        if destroyed:
            logger.info("🚪 Session destroyed")
            TransactionService.log_transaction(
                action="LOGOUT",
                target_db="auth.db",
                table="sessions",
                details=f"User logged out: {session_user['username'] if session_user else 'unknown'}",
                user=session_user["username"] if session_user else "unknown",
            )
    return {"message": "Logged out successfully"}


# ── User Management (Admin) ─────────────────────────────────────

from core.auth_store import get_all_users, update_user_role
from fastapi import Body


@router.get("/users")
async def list_users():
    """List all registered users (admin use)."""
    return get_all_users()


@router.put("/users/{user_id}/role")
async def change_user_role(user_id: int, payload: dict = Body(...)):
    """Change a user's role (admin use)."""
    new_role = payload.get("role")
    if not new_role:
        raise HTTPException(status_code=400, detail="Role is required")
    success = update_user_role(user_id, new_role)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Role updated successfully", "new_role": new_role}


@router.delete("/users/{user_id}")
async def delete_user(user_id: int, current_user: dict = Depends(require_admin)):
    if delete_user_by_id(user_id):
        return {"message": "User deleted"}
    raise HTTPException(status_code=404, detail="User not found")


@router.post("/users/{user_id}/reset-password")
async def admin_reset_password(user_id: int, payload: dict = Body(...), current_user: dict = Depends(require_admin)):
    new_pass = payload.get("new_password")
    if not new_pass:
        raise HTTPException(status_code=400, detail="New password is required")
    if force_reset_password(user_id, new_pass):
        return {"message": "Password updated"}
    raise HTTPException(status_code=400, detail="Failed to reset password")
