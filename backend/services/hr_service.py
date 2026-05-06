# backend/services/hr_service.py
# ─────────────────────────────────────────────────────────────────
#  Business logic for HR data (HUMAN_2025)
# ─────────────────────────────────────────────────────────────────
import logging
from repositories.hr_repository import HRRepository
from core.database.sqlserver import sqlserver_cursor

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

    def get_dividends_with_names(self, limit: int = 500) -> dict:
        """Get Dividends joined with FullName from dbo.Employees."""
        query = """
            SELECT
                d.DividendID,
                d.EmployeeID,
                e.FullName,
                d.DividendAmount,
                d.DividendDate,
                d.CreatedAt
            FROM dbo.Dividends d
            LEFT JOIN dbo.Employees e ON d.EmployeeID = e.EmployeeID
            ORDER BY d.DividendID ASC
        """
        rows = []
        with sqlserver_cursor() as cur:
            cur.execute(query)
            columns = [col[0] for col in cur.description]
            for row in cur.fetchmany(limit):
                r = dict(zip(columns, row))
                for k, v in r.items():
                    if hasattr(v, "isoformat"):
                        r[k] = v.isoformat()
                rows.append(r)
        return {
            "table": "dbo.Dividends",
            "total_rows": len(rows),
            "preview_rows": len(rows),
            "data": rows,
        }

    # ── Department CRUD ──────────────────────────────────────────
    def add_department(self, data: dict) -> dict:
        with sqlserver_cursor() as cur:
            cur.execute(
                "INSERT INTO dbo.Departments (DepartmentName) OUTPUT INSERTED.DepartmentID VALUES (?)",
                (data['DepartmentName'],)
            )
            new_id = cur.fetchone()[0]
        return {"DepartmentID": new_id, "DepartmentName": data['DepartmentName']}

    def update_department(self, dept_id: int, data: dict) -> dict:
        with sqlserver_cursor() as cur:
            cur.execute(
                "UPDATE dbo.Departments SET DepartmentName = ? WHERE DepartmentID = ?",
                (data['DepartmentName'], dept_id)
            )
            if cur.rowcount == 0:
                raise ValueError(f"Department {dept_id} not found")
        return {"DepartmentID": dept_id, "DepartmentName": data['DepartmentName']}

    def delete_department(self, dept_id: int) -> dict:
        with sqlserver_cursor() as cur:
            cur.execute("DELETE FROM dbo.Departments WHERE DepartmentID = ?", (dept_id,))
            if cur.rowcount == 0:
                raise ValueError(f"Department {dept_id} not found")
        return {"message": f"Department {dept_id} deleted"}

    # ── Position CRUD ─────────────────────────────────────────────
    def add_position(self, data: dict) -> dict:
        with sqlserver_cursor() as cur:
            cur.execute(
                "INSERT INTO dbo.Positions (PositionName) OUTPUT INSERTED.PositionID VALUES (?)",
                (data['PositionName'],)
            )
            new_id = cur.fetchone()[0]
        return {"PositionID": new_id, "PositionName": data['PositionName']}

    def update_position(self, pos_id: int, data: dict) -> dict:
        with sqlserver_cursor() as cur:
            cur.execute(
                "UPDATE dbo.Positions SET PositionName = ? WHERE PositionID = ?",
                (data['PositionName'], pos_id)
            )
            if cur.rowcount == 0:
                raise ValueError(f"Position {pos_id} not found")
        return {"PositionID": pos_id, "PositionName": data['PositionName']}

    def delete_position(self, pos_id: int) -> dict:
        with sqlserver_cursor() as cur:
            cur.execute("DELETE FROM dbo.Positions WHERE PositionID = ?", (pos_id,))
            if cur.rowcount == 0:
                raise ValueError(f"Position {pos_id} not found")
        return {"message": f"Position {pos_id} deleted"}
