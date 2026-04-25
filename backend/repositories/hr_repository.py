# backend/repositories/hr_repository.py
# ─────────────────────────────────────────────────────────────────
#  Data access layer for HUMAN_2025 (SQL Server)
#
#  ⚠ IMPORTANT: All SQL queries here MUST match the actual
#    HUMAN_2025 schema. No invented tables or columns.
#    Phase 2 will populate real queries after schema discovery.
# ─────────────────────────────────────────────────────────────────
import logging
from core.database.sqlserver import sqlserver_cursor

logger = logging.getLogger(__name__)


class HRRepository:
    """Repository for HUMAN_2025 database (SQL Server).

    All queries target real tables/columns discovered from the
    actual HUMAN_2025 schema. No fabricated structures.
    """

    # ── Schema Discovery ─────────────────────────────────────────
    @staticmethod
    def get_all_tables() -> list[dict]:
        """Discover all user tables in HUMAN_2025."""
        with sqlserver_cursor() as cur:
            cur.execute("""
                SELECT TABLE_SCHEMA, TABLE_NAME
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_TYPE = 'BASE TABLE'
                ORDER BY TABLE_SCHEMA, TABLE_NAME
            """)
            columns = [desc[0] for desc in cur.description]
            return [dict(zip(columns, row)) for row in cur.fetchall()]

    @staticmethod
    def get_table_columns(table_name: str, schema: str = "dbo") -> list[dict]:
        """Get column definitions for a specific table."""
        with sqlserver_cursor() as cur:
            cur.execute("""
                SELECT
                    COLUMN_NAME,
                    DATA_TYPE,
                    CHARACTER_MAXIMUM_LENGTH,
                    IS_NULLABLE,
                    COLUMN_DEFAULT
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = ? AND TABLE_SCHEMA = ?
                ORDER BY ORDINAL_POSITION
            """, (table_name, schema))
            columns = [desc[0] for desc in cur.description]
            return [dict(zip(columns, row)) for row in cur.fetchall()]

    @staticmethod
    def get_full_schema() -> dict:
        """Get complete schema map: {table_name: [columns]}."""
        tables = HRRepository.get_all_tables()
        schema = {}
        for t in tables:
            name = t["TABLE_NAME"]
            s = t["TABLE_SCHEMA"]
            schema[f"{s}.{name}"] = HRRepository.get_table_columns(name, s)
        return schema

    # ── Generic Read (safe, read-only) ───────────────────────────
    @staticmethod
    def get_table_preview(table_name: str, schema: str = "dbo", limit: int = 50) -> list[dict]:
        """Preview rows from a table. Uses parameterized limit."""
        # Table name cannot be parameterized in SQL Server — validate it
        safe_name = f"[{schema}].[{table_name}]"
        with sqlserver_cursor() as cur:
            cur.execute(f"SELECT TOP {int(limit)} * FROM {safe_name}")
            columns = [desc[0] for desc in cur.description]
            return [dict(zip(columns, row)) for row in cur.fetchall()]

    @staticmethod
    def get_row_count(table_name: str, schema: str = "dbo") -> int:
        """Get total row count for a table."""
        safe_name = f"[{schema}].[{table_name}]"
        with sqlserver_cursor() as cur:
            cur.execute(f"SELECT COUNT(*) FROM {safe_name}")
            return cur.fetchone()[0]

    # ── Placeholder: Real queries will go here after schema discovery ──
    # Phase 2 will add methods like:
    #   get_employees()
    #   get_departments()
    #   get_employee_by_id()
    # Based on actual HUMAN_2025 tables.
