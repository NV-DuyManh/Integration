# backend/api/payroll_routes.py
# ─────────────────────────────────────────────────────────────────
#  REST endpoints for PAYROLL_2026 (MySQL)
#  Covers: Salaries, Attendance
# ─────────────────────────────────────────────────────────────────
from fastapi import APIRouter, HTTPException, Query, Body
from services.payroll_service import PayrollService
from services.integration_service import IntegrationService
from core.database.mysql import mysql_cursor

router = APIRouter()
payroll_service = PayrollService()
integration_service = IntegrationService()


# ── Schema ────────────────────────────────────────────────────────

@router.get("/schema")
async def get_payroll_schema():
    """Discover PAYROLL_2026 schema — all tables and columns."""
    try:
        return payroll_service.discover_schema()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read PAYROLL_2026 schema: {e}")


@router.get("/tables/{table_name}")
async def get_payroll_table_data(
    table_name: str,
    limit: int = Query(50, ge=1, le=500),
):
    """Preview rows from a specific PAYROLL_2026 table."""
    try:
        return payroll_service.get_table_data(table_name, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Salaries ──────────────────────────────────────────────────────

@router.post("/salaries")
async def add_salary(salary_data: dict = Body(...)):
    """Add a new salary record."""
    try:
        return integration_service.add_salary(salary_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/salaries/{salary_id}")
async def update_salary(salary_id: int, salary_data: dict = Body(...)):
    """Update an existing salary record."""
    try:
        return integration_service.update_salary(salary_id, salary_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/salaries/{salary_id}")
async def delete_salary(salary_id: int):
    """Delete a salary record."""
    try:
        return integration_service.delete_salary(salary_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Attendance ────────────────────────────────────────────────────

@router.get("/attendance")
async def get_attendance(limit: int = Query(200, ge=1, le=1000)):
    """Get all attendance records with employee names (joined from HR)."""
    try:
        # Fetch attendance from MySQL
        with mysql_cursor() as cur:
            cur.execute("""
                SELECT a.AttendanceID, a.EmployeeID, ep.FullName,
                       a.WorkDays, a.AbsentDays, a.LeaveDays,
                       a.AttendanceMonth, a.CreatedAt
                FROM attendance a
                LEFT JOIN employees_payroll ep ON a.EmployeeID = ep.EmployeeID
                ORDER BY a.AttendanceMonth DESC
                LIMIT %s
            """, (limit,))
            rows = cur.fetchall()
            for r in rows:
                if r.get('AttendanceMonth'):
                    r['AttendanceMonth'] = str(r['AttendanceMonth'])
                if r.get('CreatedAt'):
                    r['CreatedAt'] = str(r['CreatedAt'])
        return {"data": rows, "total_rows": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/attendance")
async def add_attendance(data: dict = Body(...)):
    """Add a new attendance record. Verifies EmployeeID exists in HUMAN_2025."""
    try:
        return integration_service.add_attendance(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/attendance/{att_id}")
async def update_attendance(att_id: int, data: dict = Body(...)):
    """Update an attendance record."""
    try:
        return integration_service.update_attendance(att_id, data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/attendance/{att_id}")
async def delete_attendance(att_id: int):
    """Delete an attendance record."""
    try:
        return integration_service.delete_attendance(att_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))