# backend/api/hr_routes.py
# ─────────────────────────────────────────────────────────────────
#  REST endpoints for HUMAN_2025 (SQL Server)
# ─────────────────────────────────────────────────────────────────
from fastapi import APIRouter, HTTPException, Query, Body
from services.hr_service import HRService
from services.integration_service import IntegrationService

router = APIRouter()
hr_service = HRService()
integration_service = IntegrationService()


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
    """Delete an employee if they have no salary or dividend records."""
    try:
        return integration_service.delete_employee(emp_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/employees/orphan")
async def add_orphan_employee(employee_data: dict = Body(...)):
    """[TEST ONLY] Create an orphan employee in HR DB only (no payroll sync).
    
    This intentionally bypasses the sync flow to create a reconciliation
    anomaly that can be detected by the dashboard's reconciliation checks.
    """
    try:
        return integration_service.add_orphan_employee(employee_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
