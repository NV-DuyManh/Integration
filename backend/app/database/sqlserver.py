# backend/app/database/sqlserver.py
# ─────────────────────────────────────────────────────────────────
#  SQL Server connection pool — HUMAN_2025
# ─────────────────────────────────────────────────────────────────
import pyodbc
import logging
from contextlib import contextmanager
from app.config import settings

logger = logging.getLogger(__name__)

_pool: pyodbc.Connection | None = None


def get_sqlserver_connection() -> pyodbc.Connection:
    """Get a connection to HUMAN_2025 (SQL Server)."""
    global _pool
    try:
        if _pool is None or _pool.closed:
            _pool = pyodbc.connect(
                settings.sqlserver_connection_string,
                autocommit=False,
                timeout=10,
            )
            logger.info("✅ SQL Server connected: %s", settings.SQLSERVER_DATABASE)
        return _pool
    except pyodbc.Error as e:
        logger.error("❌ SQL Server connection failed: %s", e)
        raise


@contextmanager
def sqlserver_cursor():
    """Context manager that yields a cursor and handles commit/rollback."""
    conn = get_sqlserver_connection()
    cursor = conn.cursor()
    try:
        yield cursor
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()


def test_sqlserver_connection() -> bool:
    """Test connectivity to HUMAN_2025."""
    try:
        with sqlserver_cursor() as cur:
            cur.execute("SELECT 1")
            return True
    except Exception as e:
        logger.error("SQL Server test failed: %s", e)
        return False
