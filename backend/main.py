# backend/main.py
# ─────────────────────────────────────────────────────────────────
#  Integrated HR & Payroll Middleware Dashboard — FastAPI Entry
#  Connects to: SQL Server (HUMAN_2025) + MySQL (PAYROLL_2026)
# ─────────────────────────────────────────────────────────────────
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from api.hr_routes import router as hr_router
from api.payroll_routes import router as payroll_router
from api.dashboard_routes import router as dashboard_router

app = FastAPI(
    title="HR & Payroll Middleware",
    description="Middleware dashboard bridging HUMAN_2025 (SQL Server) and PAYROLL_2026 (MySQL)",
    version="1.0.0",
)

# ── CORS — allow React frontend ─────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ───────────────────────────────────────────────────────
app.include_router(hr_router, prefix="/api/hr", tags=["HR — HUMAN_2025"])
app.include_router(payroll_router, prefix="/api/payroll", tags=["Payroll — PAYROLL_2026"])
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "databases": {
            "sqlserver": "HUMAN_2025",
            "mysql": "PAYROLL_2026",
        },
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
    )
