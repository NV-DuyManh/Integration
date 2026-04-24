# backend/repositories/payroll_repository.py
# ─────────────────────────────────────────────────────────────────
#  Data access layer for PAYROLL_2026 (MySQL)
#
#  ⚠ IMPORTANT: All SQL queries here MUST match the actual
#    PAYROLL_2026 schema. No invented tables or columns.
#    Phase 2 will populate real queries after schema discovery.
# ─────────────────────────────────────────────────────────────────
import logging
from app.database.mysql import mysql_cursor

logger = logging.getLogger(__name__)


class PayrollRepository:
    """Repository for PAYROLL_2026 database (MySQL).

    All queries target real tables/columns discovered from the
    actual PAYROLL_2026 schema. No fabricated structures.
    """

    # ── Schema Discovery ─────────────────────────────────────────
    @staticmethod
    def get_all_tables() -> list[dict]:
        """Discover all tables in PAYROLL_2026."""
        with mysql_cursor() as cur:
            cur.execute("""
                SELECT TABLE_NAME, TABLE_ROWS, TABLE_COMMENT
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_TYPE = 'BASE TABLE'
                ORDER BY TABLE_NAME
            """)
            return cur.fetchall()

    @staticmethod
    def get_table_columns(table_name: str) -> list[dict]:
        """Get column definitions for a specific table."""
        with mysql_cursor() as cur:
            cur.execute("""
                SELECT
                    COLUMN_NAME,
                    DATA_TYPE,
                    CHARACTER_MAXIMUM_LENGTH,
                    IS_NULLABLE,
                    COLUMN_DEFAULT,
                    COLUMN_COMMENT
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = %s
                ORDER BY ORDINAL_POSITION
            """, (table_name,))
            return cur.fetchall()

    @staticmethod
    def get_full_schema() -> dict:
        """Get complete schema map: {table_name: [columns]}."""
        tables = PayrollRepository.get_all_tables()
        schema = {}
        for t in tables:
            name = t["TABLE_NAME"]
            schema[name] = PayrollRepository.get_table_columns(name)
        return schema

    # ── Generic Read (safe, read-only) ───────────────────────────
    @staticmethod
    def get_table_preview(table_name: str, limit: int = 50) -> list[dict]:
        """Preview rows from a table."""
        # Validate table name against actual tables to prevent injection
        tables = PayrollRepository.get_all_tables()
        valid_names = {t["TABLE_NAME"] for t in tables}
        if table_name not in valid_names:
            raise ValueError(f"Table '{table_name}' not found in PAYROLL_2026")

        with mysql_cursor() as cur:
            cur.execute(f"SELECT * FROM `{table_name}` LIMIT %s", (int(limit),))
            return cur.fetchall()

    @staticmethod
    def get_row_count(table_name: str) -> int:
        """Get total row count for a table."""
        tables = PayrollRepository.get_all_tables()
        valid_names = {t["TABLE_NAME"] for t in tables}
        if table_name not in valid_names:
            raise ValueError(f"Table '{table_name}' not found in PAYROLL_2026")

        with mysql_cursor() as cur:
            cur.execute(f"SELECT COUNT(*) AS cnt FROM `{table_name}`")
            return cur.fetchone()["cnt"]

    # ── Placeholder: Real queries will go here after schema discovery ──
    # Phase 2 will add methods like:
    #   get_payroll_records()
    #   get_salary_by_employee()
    #   get_payroll_summary()
    # Based on actual PAYROLL_2026 tables.
