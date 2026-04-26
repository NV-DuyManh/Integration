# backend/core/auth_store.py
# ─────────────────────────────────────────────────────────────────
#  Lightweight SQLite auth store — separate from HUMAN_2025 / PAYROLL_2026
#  Stores users + sessions only.  Zero impact on existing schemas.
# ─────────────────────────────────────────────────────────────────
import sqlite3
import hashlib
import secrets
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path
from contextlib import contextmanager

# ── DB location — lives next to app.py ───────────────────────────
_DB_PATH = Path(__file__).resolve().parent.parent / "auth.db"


@contextmanager
def _get_conn():
    """Thread-safe SQLite connection context manager."""
    conn = sqlite3.connect(str(_DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def _hash_password(password: str) -> str:
    """Hash password with SHA-256 + random salt (no bcrypt dependency needed)."""
    salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000)
    return f"{salt}${hashed.hex()}"


def _verify_password(password: str, stored_hash: str) -> bool:
    """Verify a password against its stored PBKDF2 hash."""
    try:
        salt, hash_hex = stored_hash.split("$", 1)
        expected = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000)
        return secrets.compare_digest(expected.hex(), hash_hex)
    except (ValueError, AttributeError):
        return False


def init_db() -> None:
    """Create auth tables if they don't exist."""
    with _get_conn() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                username    TEXT    NOT NULL UNIQUE COLLATE NOCASE,
                email       TEXT    NOT NULL UNIQUE COLLATE NOCASE,
                password    TEXT    NOT NULL,
                role        TEXT    NOT NULL DEFAULT 'viewer',
                created_at  TEXT    NOT NULL,
                updated_at  TEXT    NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sessions (
                token       TEXT    PRIMARY KEY,
                user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at  TEXT    NOT NULL,
                expires_at  TEXT    NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
            CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
        """)


# ── User CRUD ────────────────────────────────────────────────────

def create_user(username: str, email: str, password: str, role: str = "viewer") -> dict:
    """Register a new user. Returns user dict or raises ValueError."""
    now = datetime.now(timezone.utc).isoformat()
    hashed = _hash_password(password)

    with _get_conn() as conn:
        # Check for existing username
        row = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
        if row:
            raise ValueError("Username already exists")

        # Check for existing email
        row = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
        if row:
            raise ValueError("Email already registered")

        cursor = conn.execute(
            "INSERT INTO users (username, email, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            (username, email, hashed, role, now, now),
        )
        return {
            "id": cursor.lastrowid,
            "username": username,
            "email": email,
            "role": role,
            "created_at": now,
        }


def authenticate_user(username: str, password: str) -> dict | None:
    """Verify credentials. Returns user dict or None."""
    with _get_conn() as conn:
        row = conn.execute(
            "SELECT id, username, email, password, role, created_at FROM users WHERE username = ?",
            (username,),
        ).fetchone()

        if not row:
            return None
        if not _verify_password(password, row["password"]):
            return None

        return {
            "id": row["id"],
            "username": row["username"],
            "email": row["email"],
            "role": row["role"],
            "created_at": row["created_at"],
        }


def get_user_by_id(user_id: int) -> dict | None:
    """Fetch user by ID."""
    with _get_conn() as conn:
        row = conn.execute(
            "SELECT id, username, email, role, created_at FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
        return dict(row) if row else None


# ── Session management ───────────────────────────────────────────

SESSION_DURATION_HOURS = 24


def create_session(user_id: int) -> str:
    """Create a session token for a user. Returns the token string."""
    token = secrets.token_hex(32)
    now = datetime.now(timezone.utc)
    expires = now + timedelta(hours=SESSION_DURATION_HOURS)

    with _get_conn() as conn:
        conn.execute(
            "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
            (token, user_id, now.isoformat(), expires.isoformat()),
        )
    return token


def validate_session(token: str) -> dict | None:
    """Validate a session token. Returns user dict or None if invalid/expired."""
    with _get_conn() as conn:
        row = conn.execute(
            """SELECT s.user_id, s.expires_at, u.username, u.email, u.role, u.created_at
               FROM sessions s JOIN users u ON s.user_id = u.id
               WHERE s.token = ?""",
            (token,),
        ).fetchone()

        if not row:
            return None

        # Check expiry
        expires = datetime.fromisoformat(row["expires_at"])
        if datetime.now(timezone.utc) > expires:
            # Clean up expired session
            conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
            return None

        return {
            "id": row["user_id"],
            "username": row["username"],
            "email": row["email"],
            "role": row["role"],
            "created_at": row["created_at"],
        }


def destroy_session(token: str) -> bool:
    """Delete a session. Returns True if it existed."""
    with _get_conn() as conn:
        cursor = conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
        return cursor.rowcount > 0


def cleanup_expired_sessions() -> int:
    """Remove all expired sessions. Returns count deleted."""
    now = datetime.now(timezone.utc).isoformat()
    with _get_conn() as conn:
        cursor = conn.execute("DELETE FROM sessions WHERE expires_at < ?", (now,))
        return cursor.rowcount


def get_user_count() -> int:
    """Return total user count."""
    with _get_conn() as conn:
        row = conn.execute("SELECT COUNT(*) as cnt FROM users").fetchone()
        return row["cnt"] if row else 0
