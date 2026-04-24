# backend/services/payroll_service.py
# ─────────────────────────────────────────────────────────────────
#  Business logic for Payroll data (PAYROLL_2026)
# ─────────────────────────────────────────────────────────────────
import logging
from repositories.payroll_repository import PayrollRepository

logger = logging.getLogger(__name__)


class PayrollService:
    """Business logic layer for Payroll operations.

    Delegates data access to PayrollRepository.
    Contains validation, transformation, and business rules.
    """

    def __init__(self):
        self.repo = PayrollRepository()

    # ── Schema Discovery ─────────────────────────────────────────
    def discover_schema(self) -> dict:
        """Return full PAYROLL_2026 schema for frontend display."""
        tables = self.repo.get_all_tables()
        result = {
            "database": "PAYROLL_2026",
            "engine": "MySQL",
            "table_count": len(tables),
            "tables": {},
        }
        for t in tables:
            name = t["TABLE_NAME"]
            columns = self.repo.get_table_columns(name)
            row_count = self.repo.get_row_count(name)
            result["tables"][name] = {
                "columns": columns,
                "row_count": row_count,
                "comment": t.get("TABLE_COMMENT", ""),
            }
        return result

    def get_table_data(self, table_name: str, limit: int = 50) -> dict:
        """Get preview data for a specific table."""
        rows = self.repo.get_table_preview(table_name, limit)
        count = self.repo.get_row_count(table_name)
        return {
            "table": table_name,
            "total_rows": count,
            "preview_rows": len(rows),
            "data": rows,
        }

    # ── Phase 2: Real business methods go here ───────────────────
    # Examples (after schema discovery):
    #   def get_payroll_summary(self, period: str) -> dict
    #   def get_employee_salary(self, emp_id: int) -> dict
    #   def get_payroll_by_department(self) -> list
