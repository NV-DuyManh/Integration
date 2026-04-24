# backend/api/hr_routes.py
# ─────────────────────────────────────────────────────────────────
#  REST endpoints for HUMAN_2025 (SQL Server)
# ─────────────────────────────────────────────────────────────────
from fastapi import APIRouter, HTTPException, Query
from services.hr_service import HRService

router = APIRouter()
hr_service = HRService()


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
