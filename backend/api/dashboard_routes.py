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
