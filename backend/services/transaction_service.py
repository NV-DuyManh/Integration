# backend/services/transaction_service.py
# ─────────────────────────────────────────────────────────────────
#  Transaction logging service — Persistent Audit Logs (SQLite)
#  Logs middleware API operations into auth.db for permanent audit trail.
#  Does NOT write to source databases (HUMAN_2025 / PAYROLL_2026).
# ─────────────────────────────────────────────────────────────────
import logging
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger(__name__)

# ── DB location — same auth.db used by auth_store.py ─────────────
_DB_PATH = Path(__file__).resolve().parent.parent / "auth.db"

def _get_conn():
    conn = sqlite3.connect(str(_DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def _init_db():
    with _get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                action TEXT NOT NULL,
                target_db TEXT NOT NULL,
                table_name TEXT NOT NULL,
                details TEXT,
                user TEXT
            )
        """)
        conn.commit()

_init_db()


class TransactionService:
    """Middleware-level transaction logger.

    Records all API operations for audit purposes.
    Persisted in auth.db — survives server restarts.
    """

    @staticmethod
    def log_transaction(action: str, target_db: str, table: str = "", details: str = "", user: str = "system") -> dict:
        """Record a transaction in the audit log."""
        now = datetime.now(timezone.utc).isoformat()
        with _get_conn() as conn:
            cursor = conn.execute(
                "INSERT INTO audit_logs (timestamp, action, target_db, table_name, details, user) VALUES (?, ?, ?, ?, ?, ?)",
                (now, action, target_db, table, details, user)
            )
            conn.commit()
            entry = {"id": cursor.lastrowid, "timestamp": now, "action": action, "target_db": target_db, "table": table, "details": details, "user": user}
        logger.info("TX: %s -> %s.%s (%s)", action, target_db, table, details)
        return entry

    @staticmethod
    def get_recent_transactions(limit: int = 50) -> list[dict]:
        """Get the most recent transactions."""
        with _get_conn() as conn:
            rows = conn.execute("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?", (limit,)).fetchall()
            return [dict(r) for r in rows]

    @staticmethod
    def get_transaction_stats() -> dict:
        """Get aggregate transaction statistics."""
        with _get_conn() as conn:
            total = conn.execute("SELECT COUNT(*) as cnt FROM audit_logs").fetchone()["cnt"]
            if total == 0:
                return {"total": 0, "by_action": {}, "by_database": {}}

            by_action: dict[str, int] = {}
            by_db: dict[str, int] = {}
            rows = conn.execute("SELECT action, target_db FROM audit_logs").fetchall()
            for r in rows:
                by_action[r["action"]] = by_action.get(r["action"], 0) + 1
                by_db[r["target_db"]] = by_db.get(r["target_db"], 0) + 1

            return {
                "total": total,
                "by_action": by_action,
                "by_database": by_db,
            }

    @staticmethod
    def clear_log():
        """Clear the transaction log."""
        with _get_conn() as conn:
            conn.execute("DELETE FROM audit_logs")
            conn.commit()
        return {"message": "Transaction log cleared"}
