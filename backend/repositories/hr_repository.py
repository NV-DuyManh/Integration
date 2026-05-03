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
                  AND TABLE_NAME != 'sysdiagrams'
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

    # ── Phase 2: Real business methods ───────────────────────────
    @staticmethod
    def get_employee(employee_id: int) -> dict:
        """Get complete HR record for an employee."""
        with sqlserver_cursor() as cur:
            cur.execute("""
                SELECT e.*, d.DepartmentName, p.PositionName
                FROM dbo.Employees e
                LEFT JOIN dbo.Departments d ON e.DepartmentID = d.DepartmentID
                LEFT JOIN dbo.Positions p ON e.PositionID = p.PositionID
                WHERE e.EmployeeID = ?
            """, (employee_id,))
            if not cur.description: return None
            columns = [desc[0] for desc in cur.description]
            row = cur.fetchone()
            return dict(zip(columns, row)) if row else None

    @staticmethod
    def search_employees(query: str) -> list[dict]:
        """Search employees by name, ID, or department."""
        with sqlserver_cursor() as cur:
            q = f"%{query}%"
            cur.execute("""
                SELECT e.EmployeeID, e.FullName, d.DepartmentName, p.PositionName, e.Status
                FROM dbo.Employees e
                LEFT JOIN dbo.Departments d ON e.DepartmentID = d.DepartmentID
                LEFT JOIN dbo.Positions p ON e.PositionID = p.PositionID
                WHERE e.FullName LIKE ? 
                   OR d.DepartmentName LIKE ? 
                   OR CAST(e.EmployeeID AS NVARCHAR) = ?
                ORDER BY e.EmployeeID
                OFFSET 0 ROWS FETCH NEXT 50 ROWS ONLY
            """, (q, q, query))
            columns = [desc[0] for desc in cur.description]
            return [dict(zip(columns, row)) for row in cur.fetchall()]

    @staticmethod
    def get_all_employees() -> list[dict]:
        """Get all employees for reconciliation."""
        with sqlserver_cursor() as cur:
            cur.execute("SELECT EmployeeID, FullName, Status FROM dbo.Employees")
            columns = [desc[0] for desc in cur.description]
            return [dict(zip(columns, row)) for row in cur.fetchall()]

    @staticmethod
    def get_employees_with_joins(limit: int = 200) -> list[dict]:
        """Get employees with DepartmentName and PositionName via JOINs."""
        with sqlserver_cursor() as cur:
            cur.execute(f"""
                SELECT TOP {int(limit)}
                    e.EmployeeID, e.FullName, e.DateOfBirth, e.Gender,
                    e.PhoneNumber, e.Email, e.HireDate,
                    e.DepartmentID, d.DepartmentName,
                    e.PositionID, p.PositionName,
                    e.Status, e.CreatedAt, e.UpdatedAt
                FROM dbo.Employees e
                LEFT JOIN dbo.Departments d ON e.DepartmentID = d.DepartmentID
                LEFT JOIN dbo.Positions p ON e.PositionID = p.PositionID
                ORDER BY e.EmployeeID
            """)
            columns = [desc[0] for desc in cur.description]
            return [dict(zip(columns, row)) for row in cur.fetchall()]

    @staticmethod
    def get_all_departments() -> list[dict]:
        """Get all departments for dropdown population."""
        with sqlserver_cursor() as cur:
            cur.execute("SELECT DepartmentID, DepartmentName FROM dbo.Departments ORDER BY DepartmentName")
            columns = [desc[0] for desc in cur.description]
            return [dict(zip(columns, row)) for row in cur.fetchall()]

    @staticmethod
    def get_all_positions() -> list[dict]:
        """Get all positions for dropdown population."""
        with sqlserver_cursor() as cur:
            cur.execute("SELECT PositionID, PositionName FROM dbo.Positions ORDER BY PositionName")
            columns = [desc[0] for desc in cur.description]
            return [dict(zip(columns, row)) for row in cur.fetchall()]
