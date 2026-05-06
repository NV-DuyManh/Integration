# backend/services/payroll_service.py
# ─────────────────────────────────────────────────────────────────
#  Business logic for Payroll data (PAYROLL_2026)
# ─────────────────────────────────────────────────────────────────
import logging
from repositories.payroll_repository import PayrollRepository
from core.database.mysql import mysql_cursor

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

    def get_salaries_with_names(self, limit: int = 500) -> dict:
        """Get salaries joined with FullName from employees_payroll."""
        query = """
            SELECT
                s.SalaryID,
                s.EmployeeID,
                e.FullName,
                s.SalaryMonth,
                s.BaseSalary,
                s.Bonus,
                s.Deductions,
                s.NetSalary,
                s.CreatedAt
            FROM salaries s
            LEFT JOIN employees_payroll e ON s.EmployeeID = e.EmployeeID
            ORDER BY s.SalaryMonth DESC, s.EmployeeID ASC
            LIMIT %s
        """
        rows = []
        with mysql_cursor() as cur:
            cur.execute(query, (limit,))
            raw = cur.fetchall()
            for r in raw:
                row = dict(r)
                for k, v in row.items():
                    if hasattr(v, "isoformat"):
                        row[k] = v.isoformat()
                rows.append(row)
        return {
            "table": "salaries",
            "total_rows": len(rows),
            "preview_rows": len(rows),
            "data": rows,
        }

    def get_attendance_with_names(self, limit: int = 500) -> dict:
        """Get attendance joined with FullName from employees_payroll."""
        query = """
            SELECT
                a.AttendanceID,
                a.EmployeeID,
                e.FullName,
                a.AttendanceMonth,
                a.WorkDays,
                a.AbsentDays,
                a.LeaveDays,
                a.CreatedAt
            FROM attendance a
            LEFT JOIN employees_payroll e ON a.EmployeeID = e.EmployeeID
            ORDER BY a.AttendanceMonth DESC, a.EmployeeID ASC
            LIMIT %s
        """
        rows = []
        with mysql_cursor() as cur:
            cur.execute(query, (limit,))
            raw = cur.fetchall()
            for r in raw:
                row = dict(r)
                for k, v in row.items():
                    if hasattr(v, "isoformat"):
                        row[k] = v.isoformat()
                rows.append(row)
        return {
            "table": "attendance",
            "total_rows": len(rows),
            "preview_rows": len(rows),
            "data": rows,
        }