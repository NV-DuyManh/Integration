# backend/api/payroll_routes.py
# ─────────────────────────────────────────────────────────────────
#  REST endpoints for PAYROLL_2026 (MySQL)
# ─────────────────────────────────────────────────────────────────
from fastapi import APIRouter, HTTPException, Query
from services.payroll_service import PayrollService

router = APIRouter()
payroll_service = PayrollService()


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
