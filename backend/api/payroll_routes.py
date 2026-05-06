# backend/api/payroll_routes.py
# ─────────────────────────────────────────────────────────────────
#  REST endpoints for PAYROLL_2026 (MySQL)
# ─────────────────────────────────────────────────────────────────
from fastapi import APIRouter, HTTPException, Query, Body
from services.payroll_service import PayrollService
from services.integration_service import IntegrationService

router = APIRouter()
payroll_service = PayrollService()
integration_service = IntegrationService()


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


@router.get("/salaries-with-names")
async def get_salaries_with_names(limit: int = Query(500, ge=1, le=2000)):
    """Get salaries joined with EmployeeFullName from employees_payroll."""
    try:
        return payroll_service.get_salaries_with_names(limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/attendance-with-names")
async def get_attendance_with_names(limit: int = Query(500, ge=1, le=2000)):
    """Get attendance joined with EmployeeFullName from employees_payroll."""
    try:
        return payroll_service.get_attendance_with_names(limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/salaries")
async def add_salary(salary_data: dict = Body(...), current_user: str = Query("system")):
    """Add a new salary record."""
    try:
        return integration_service.add_salary(salary_data, current_user)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/salaries/{salary_id}")
async def update_salary(salary_id: int, salary_data: dict = Body(...), current_user: str = Query("system")):
    """Update an existing salary record."""
    try:
        return integration_service.update_salary(salary_id, salary_data, current_user)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/salaries/{salary_id}")
async def delete_salary(salary_id: int, current_user: str = Query("system")):
    """Delete a salary record."""
    try:
        return integration_service.delete_salary(salary_id, current_user)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/attendance")
async def add_attendance(data: dict = Body(...)):
    """Add a new attendance record."""
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