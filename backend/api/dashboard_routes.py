# backend/api/dashboard_routes.py
# ─────────────────────────────────────────────────────────────────
#  Aggregated dashboard endpoints
#  Bridges HUMAN_2025 ↔ PAYROLL_2026
# ─────────────────────────────────────────────────────────────────
from fastapi import APIRouter, HTTPException
from services.dashboard_service import DashboardService

router = APIRouter()
dashboard_service = DashboardService()


@router.get("/status")
async def get_system_status():
    """Check connectivity to both databases."""
    try:
        return dashboard_service.get_system_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/overview")
async def get_overview():
    """High-level overview: table counts and names from both DBs."""
    try:
        return dashboard_service.get_overview()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/employees/search")
async def search_employees(q: str):
    """Search employees across both databases."""
    try:
        return dashboard_service.search_employees(q)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/employee/{employee_id}")
async def get_employee_360(employee_id: int):
    """Get 360 view for an employee."""
    try:
        data = dashboard_service.get_employee_360(employee_id)
        if not data:
            raise HTTPException(status_code=404, detail="Employee not found")
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reconciliation")
async def get_reconciliation():
    """Get reconciliation data between HR and Payroll."""
    try:
        return dashboard_service.get_reconciliation()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/quality")
async def get_data_quality():
    """Get data quality and anomaly metrics."""
    try:
        return dashboard_service.get_data_quality()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reports/{report_type}")
async def generate_report(report_type: str):
    """Generate integrated report."""
    try:
        return dashboard_service.generate_report(report_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
