# backend/services/hr_service.py
# ─────────────────────────────────────────────────────────────────
#  Business logic for HR data (HUMAN_2025)
# ─────────────────────────────────────────────────────────────────
import logging
from repositories.hr_repository import HRRepository

logger = logging.getLogger(__name__)


class HRService:
    """Business logic layer for HR operations.

    Delegates data access to HRRepository.
    Contains validation, transformation, and business rules.
    """

    def __init__(self):
        self.repo = HRRepository()

    # ── Schema Discovery ─────────────────────────────────────────
    def discover_schema(self) -> dict:
        """Return full HUMAN_2025 schema for frontend display."""
        tables = self.repo.get_all_tables()
        result = {
            "database": "HUMAN_2025",
            "engine": "SQL Server",
            "table_count": len(tables),
            "tables": {},
        }
        for t in tables:
            full_name = f"{t['TABLE_SCHEMA']}.{t['TABLE_NAME']}"
            columns = self.repo.get_table_columns(t["TABLE_NAME"], t["TABLE_SCHEMA"])
            row_count = self.repo.get_row_count(t["TABLE_NAME"], t["TABLE_SCHEMA"])
            result["tables"][full_name] = {
                "columns": columns,
                "row_count": row_count,
            }
        return result

    def get_table_data(self, table_name: str, schema: str = "dbo", limit: int = 50) -> dict:
        """Get preview data for a specific table."""
        rows = self.repo.get_table_preview(table_name, schema, limit)
        count = self.repo.get_row_count(table_name, schema)
        return {
            "table": f"{schema}.{table_name}",
            "total_rows": count,
            "preview_rows": len(rows),
            "data": rows,
        }

    # ── Phase 2: Real business methods go here ───────────────────
    # Examples (after schema discovery):
    #   def get_active_employees(self) -> list
    #   def get_department_headcount(self) -> dict
    #   def search_employees(self, query: str) -> list

    def get_employees_with_names(self, limit: int = 200) -> dict:
        """Get employees with department/position names for the Data Management table."""
        rows = self.repo.get_employees_with_joins(limit)
        return {
            "table": "dbo.Employees",
            "total_rows": len(rows),
            "preview_rows": len(rows),
            "data": rows,
        }

    def get_all_departments(self) -> list[dict]:
        """Get all departments for dropdown."""
        return self.repo.get_all_departments()

    def get_all_positions(self) -> list[dict]:
        """Get all positions for dropdown."""
        return self.repo.get_all_positions()
