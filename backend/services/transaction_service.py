# backend/services/transaction_service.py
# ─────────────────────────────────────────────────────────────────
#  Transaction logging service
#  Logs middleware API operations in-memory for audit trail.
#  Does NOT write to source databases (HUMAN_2025 / PAYROLL_2026).
# ─────────────────────────────────────────────────────────────────
import logging
from datetime import datetime, timezone
from collections import deque

logger = logging.getLogger(__name__)

# ── In-memory transaction log (last 1000 entries) ────────────────
_transaction_log: deque[dict] = deque(maxlen=1000)


class TransactionService:
    """Middleware-level transaction logger.

    Records all API operations for audit purposes.
    Stored in-memory only — no writes to source databases.
    """

    @staticmethod
    def log_transaction(
        action: str,
        target_db: str,
        table: str = "",
        details: str = "",
        user: str = "system",
    ) -> dict:
        """Record a transaction in the audit log."""
        entry = {
            "id": len(_transaction_log) + 1,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "action": action,
            "target_db": target_db,
            "table": table,
            "details": details,
            "user": user,
        }
        _transaction_log.append(entry)
        logger.info("TX: %s → %s.%s (%s)", action, target_db, table, details)
        return entry

    @staticmethod
    def get_recent_transactions(limit: int = 50) -> list[dict]:
        """Get the most recent transactions."""
        items = list(_transaction_log)
        items.reverse()
        return items[:limit]

    @staticmethod
    def get_transaction_stats() -> dict:
        """Get aggregate transaction statistics."""
        total = len(_transaction_log)
        if total == 0:
            return {"total": 0, "by_action": {}, "by_database": {}}

        by_action: dict[str, int] = {}
        by_db: dict[str, int] = {}
        for t in _transaction_log:
            by_action[t["action"]] = by_action.get(t["action"], 0) + 1
            by_db[t["target_db"]] = by_db.get(t["target_db"], 0) + 1

        return {
            "total": total,
            "by_action": by_action,
            "by_database": by_db,
        }

    @staticmethod
    def clear_log():
        """Clear the transaction log."""
        _transaction_log.clear()
        return {"message": "Transaction log cleared"}
