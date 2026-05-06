# backend/api/dashboard_routes.py
# ─────────────────────────────────────────────────────────────────
#  Aggregated dashboard endpoints
#  Bridges HUMAN_2025 ↔ PAYROLL_2026
# ─────────────────────────────────────────────────────────────────
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from services.dashboard_service import DashboardService
from services.transaction_service import TransactionService
from core.database.sqlserver import get_sqlserver_connection
from core.database.mysql import get_mysql_connection
from api.auth_routes import require_admin

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


@router.get("/audit-logs")
async def get_audit_logs(limit: int = Query(default=50, ge=1, le=500)):
    """Fetch recent persistent audit log entries."""
    try:
        return TransactionService.get_recent_transactions(limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class SqlQueryPayload(BaseModel):
    database: str
    query: str


@router.post("/execute-sql")
async def execute_raw_sql(payload: SqlQueryPayload, admin_user: dict = Depends(require_admin)):
    """[DANGER ZONE] Execute raw SQL queries from the UI. Secured for Admins only."""
    query = payload.query.strip()
    is_select = query.upper().startswith("SELECT") or query.upper().startswith("SHOW") or query.upper().startswith("DESCRIBE")

    try:
        if payload.database == "sqlserver":
            conn = get_sqlserver_connection()
            cur = conn.cursor()
            try:
                cur.execute(query)
                if is_select:
                    columns = [column[0] for column in cur.description]
                    rows = [dict(zip(columns, row)) for row in cur.fetchall()]
                    for r in rows:
                        for k, v in r.items():
                            if hasattr(v, 'isoformat'):
                                r[k] = v.isoformat()
                    return {"success": True, "type": "select", "data": rows, "count": len(rows)}
                else:
                    conn.commit()
                    TransactionService.log_transaction(
                        action="RAW_SQL", target_db="HUMAN_2025", table="System",
                        details=f"Executed: {query[:50]}...", user=admin_user["username"]
                    )
                    return {"success": True, "type": "mutate", "affected_rows": cur.rowcount}
            finally:
                cur.close()

        elif payload.database == "mysql":
            conn = get_mysql_connection()
            cur = conn.cursor()
            try:
                cur.execute(query)
                if is_select:
                    rows = cur.fetchall()
                    for r in rows:
                        for k, v in r.items():
                            if hasattr(v, 'isoformat'):
                                r[k] = v.isoformat()
                    return {"success": True, "type": "select", "data": rows, "count": len(rows)}
                else:
                    conn.commit()
                    TransactionService.log_transaction(
                        action="RAW_SQL", target_db="PAYROLL_2026", table="System",
                        details=f"Executed: {query[:50]}...", user=admin_user["username"]
                    )
                    return {"success": True, "type": "mutate", "affected_rows": cur.rowcount}
            finally:
                cur.close()
        else:
            raise HTTPException(status_code=400, detail="Invalid database selected")

    except Exception as e:
        return {"success": False, "error": str(e)}
