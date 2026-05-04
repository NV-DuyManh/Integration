# backend/app.py
# ─────────────────────────────────────────────────────────────────
#  Integrated HR & Payroll Middleware Dashboard — FastAPI Entry
#  Connects to: SQL Server (HUMAN_2025) + MySQL (PAYROLL_2026)
#
#  Start with:  python app.py
#  Tries port 8000 first, falls back to 8001 if occupied.
# ─────────────────────────────────────────────────────────────────
import uvicorn
import socket
import logging
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from api.hr_routes import router as hr_router
from api.payroll_routes import router as payroll_router
from api.dashboard_routes import router as dashboard_router
from api.auth_routes import router as auth_router

# ── Logging ──────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s │ %(levelname)-8s │ %(name)s │ %(message)s",
    datefmt="%H:%M:%S",
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="HR & Payroll Middleware",
    description="Middleware dashboard bridging HUMAN_2025 (SQL Server) and PAYROLL_2026 (MySQL)",
    version="1.0.0",
)

# ── CORS — allow React frontend ─────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ───────────────────────────────────────────────────────
app.include_router(hr_router, prefix="/api/hr", tags=["HR — HUMAN_2025"])
app.include_router(payroll_router, prefix="/api/payroll", tags=["Payroll — PAYROLL_2026"])
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])


@app.on_event("startup")
async def startup_event():
    from core.scheduler import start_scheduler
    start_scheduler()

    # Auto-create default admin account
    from core.auth_store import create_user, _get_conn
    with _get_conn() as conn:
        admin_exists = conn.execute("SELECT id FROM users WHERE username='admin'").fetchone()
    if not admin_exists:
        try:
            create_user("admin", "admin@nexusbridge.local", "admin123", "admin")
            logger.info("✅ Default Root Admin created (admin / admin123)")
        except Exception as e:
            logger.error(f"Could not create default admin: {e}")


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "databases": {
            "sqlserver": "HUMAN_2025",
            "mysql": "PAYROLL_2026",
        },
    }


# ── Startup helpers ──────────────────────────────────────────────

def _port_available(port: int) -> bool:
    """Return True if the port is free to bind on localhost."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(("0.0.0.0", port))
            return True
        except OSError:
            return False


def _resolve_port(preferred: int, fallback: int) -> int:
    """Try the preferred port; if occupied, use the fallback."""
    if _port_available(preferred):
        return preferred
    logger.warning(
        "⚠️  Port %d is occupied — falling back to %d", preferred, fallback
    )
    if _port_available(fallback):
        return fallback
    logger.error("❌ Both ports %d and %d are occupied. Exiting.", preferred, fallback)
    sys.exit(1)


if __name__ == "__main__":
    port = settings.PORT
    logger.info("🚀 Starting server on port %d", port)
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        reload=settings.DEBUG,
        # Prevent WatchFiles reloader from triggering on .pyc / __pycache__ / SQLite
        reload_excludes=[
            "**/__pycache__/**", "**/*.pyc", "**/venv/**", "**/.pytest_cache/**",
            "**/*.db", "**/*.db-wal", "**/*.db-shm", "**/*.db-journal",
        ],
    )
