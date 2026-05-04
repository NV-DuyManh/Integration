# backend/api/hr_routes.py
# ─────────────────────────────────────────────────────────────────
#  REST endpoints for HUMAN_2025 (SQL Server)
#  Covers: Employees, Departments, Positions, Dividends
# ─────────────────────────────────────────────────────────────────
from fastapi import APIRouter, HTTPException, Query, Body
from services.hr_service import HRService
from services.integration_service import IntegrationService
from core.database.sqlserver import sqlserver_cursor

router = APIRouter()
hr_service = HRService()
integration_service = IntegrationService()


# ── Schema ────────────────────────────────────────────────────────

@router.get("/schema")
async def get_hr_schema():
    """Discover HUMAN_2025 schema — all tables and columns."""
    try:
        return hr_service.discover_schema()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read HUMAN_2025 schema: {e}")


@router.get("/tables/{table_name}")
async def get_hr_table_data(
    table_name: str,
    schema: str = Query("dbo", description="SQL Server schema"),
    limit: int = Query(50, ge=1, le=500),
):
    """Preview rows from a specific HUMAN_2025 table."""
    try:
        return hr_service.get_table_data(table_name, schema, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Employees ─────────────────────────────────────────────────────

@router.get("/employees")
async def get_employees_with_names():
    """Get all employees with DepartmentName and PositionName."""
    try:
        return hr_service.get_employees_with_names()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/employees")
async def add_employee(employee_data: dict = Body(...)):
    """Add a new employee and sync to payroll."""
    try:
        return integration_service.add_employee(employee_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/employees/{emp_id}")
async def update_employee(emp_id: int, employee_data: dict = Body(...)):
    """Update an existing employee and sync to payroll."""
    try:
        return integration_service.update_employee(emp_id, employee_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/employees/{emp_id}")
async def delete_employee(emp_id: int):
    """Delete an employee and all related records (cascade both DBs)."""
    try:
        return integration_service.delete_employee(emp_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/employees/orphan")
async def add_orphan_employee(employee_data: dict = Body(...)):
    """[TEST ONLY] Create an orphan employee in HR DB only (no payroll sync)."""
    try:
        return integration_service.add_orphan_employee(employee_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Departments ───────────────────────────────────────────────────

@router.get("/departments")
async def get_departments():
    """Get all departments."""
    try:
        return hr_service.get_all_departments()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/departments")
async def add_department(data: dict = Body(...)):
    """Add a new department and sync to PAYROLL_2026.departments_payroll."""
    try:
        return integration_service.add_department(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/departments/{dept_id}")
async def update_department(dept_id: int, data: dict = Body(...)):
    """Update a department and sync to PAYROLL_2026."""
    try:
        return integration_service.update_department(dept_id, data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/departments/{dept_id}")
async def delete_department(dept_id: int):
    """Delete a department (blocked if employees are assigned)."""
    try:
        return integration_service.delete_department(dept_id)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Positions ─────────────────────────────────────────────────────

@router.get("/positions")
async def get_positions():
    """Get all positions."""
    try:
        return hr_service.get_all_positions()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/positions")
async def add_position(data: dict = Body(...)):
    """Add a new position and sync to PAYROLL_2026.positions_payroll."""
    try:
        return integration_service.add_position(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/positions/{pos_id}")
async def update_position(pos_id: int, data: dict = Body(...)):
    """Update a position and sync to PAYROLL_2026."""
    try:
        return integration_service.update_position(pos_id, data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/positions/{pos_id}")
async def delete_position(pos_id: int):
    """Delete a position (blocked if employees are assigned)."""
    try:
        return integration_service.delete_position(pos_id)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Dividends ─────────────────────────────────────────────────────

@router.get("/dividends")
async def get_dividends(limit: int = Query(200, ge=1, le=1000)):
    """Get all dividend records with employee names."""
    try:
        with sqlserver_cursor() as cur:
            cur.execute("""
                SELECT d.DividendID, d.EmployeeID, e.FullName, 
                       d.DividendAmount, d.DividendDate, d.CreatedAt
                FROM dbo.Dividends d
                LEFT JOIN dbo.Employees e ON d.EmployeeID = e.EmployeeID
                ORDER BY d.DividendDate DESC
                OFFSET 0 ROWS FETCH NEXT ? ROWS ONLY
            """, (limit,))
            cols = [c[0] for c in cur.description]
            rows = [dict(zip(cols, row)) for row in cur.fetchall()]
            for r in rows:
                if r.get('DividendDate'):
                    r['DividendDate'] = str(r['DividendDate'])
                if r.get('CreatedAt'):
                    r['CreatedAt'] = str(r['CreatedAt'])
        return {"data": rows, "total_rows": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/dividends")
async def add_dividend(data: dict = Body(...)):
    """Add a dividend record to HUMAN_2025.Dividends."""
    try:
        return integration_service.add_dividend(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/dividends/{div_id}")
async def update_dividend(div_id: int, data: dict = Body(...)):
    """Update a dividend record."""
    try:
        return integration_service.update_dividend(div_id, data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/dividends/{div_id}")
async def delete_dividend(div_id: int):
    """Delete a dividend record."""
    try:
        return integration_service.delete_dividend(div_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))