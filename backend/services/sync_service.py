# backend/services/sync_service.py
# ─────────────────────────────────────────────────────────────────
#  Cross-database sync service
#  READ-ONLY sync: compares data between HUMAN_2025 and PAYROLL_2026
#  to detect discrepancies. Does NOT modify source databases.
# ─────────────────────────────────────────────────────────────────
import logging
from datetime import datetime, timezone
from repositories.hr_repository import HRRepository
from repositories.payroll_repository import PayrollRepository

logger = logging.getLogger(__name__)


class SyncService:
    """Read-only synchronization checker between HR and Payroll databases.

    This service compares schema and row counts across both databases
    to surface potential discrepancies — purely informational,
    no writes to either database.
    """

    def __init__(self):
        self.hr_repo = HRRepository()
        self.payroll_repo = PayrollRepository()

    def get_sync_status(self) -> dict:
        """Compare both databases and report any discrepancies."""
        try:
            hr_tables = self.hr_repo.get_all_tables()
            payroll_tables = self.payroll_repo.get_all_tables()

            hr_table_names = {t["TABLE_NAME"] for t in hr_tables}
            payroll_table_names = {t["TABLE_NAME"] for t in payroll_tables}

            # Find table names that appear in both (potential join points)
            common_tables = hr_table_names & payroll_table_names

            return {
                "checked_at": datetime.now(timezone.utc).isoformat(),
                "hr_table_count": len(hr_tables),
                "payroll_table_count": len(payroll_tables),
                "common_table_names": sorted(common_tables),
                "hr_only_tables": sorted(hr_table_names - payroll_table_names),
                "payroll_only_tables": sorted(payroll_table_names - hr_table_names),
                "status": "ok",
            }
        except Exception as e:
            logger.error("Sync status check failed: %s", e)
            return {
                "checked_at": datetime.now(timezone.utc).isoformat(),
                "status": "error",
                "error": str(e),
            }

    def get_row_count_comparison(self) -> dict:
        """Compare row counts for common tables across both databases."""
        try:
            hr_tables = self.hr_repo.get_all_tables()
            payroll_tables = self.payroll_repo.get_all_tables()

            hr_counts = {}
            for t in hr_tables:
                name = t["TABLE_NAME"]
                schema = t.get("TABLE_SCHEMA", "dbo")
                try:
                    hr_counts[name] = self.hr_repo.get_row_count(name, schema)
                except Exception:
                    hr_counts[name] = -1

            payroll_counts = {}
            for t in payroll_tables:
                name = t["TABLE_NAME"]
                try:
                    payroll_counts[name] = self.payroll_repo.get_row_count(name)
                except Exception:
                    payroll_counts[name] = -1

            return {
                "checked_at": datetime.now(timezone.utc).isoformat(),
                "hr_row_counts": hr_counts,
                "payroll_row_counts": payroll_counts,
            }
        except Exception as e:
            logger.error("Row count comparison failed: %s", e)
            return {"status": "error", "error": str(e)}
