# backend/core/database/sqlserver.py
# ─────────────────────────────────────────────────────────────────
#  SQL Server connection pool — HUMAN_2025
#
#  Fix: pyodbc.Connection has no `.closed` attribute.
#  Use try/except on cursor execution to detect stale connections.
# ─────────────────────────────────────────────────────────────────
import pyodbc
import logging
from contextlib import contextmanager
from core.config import settings

logger = logging.getLogger(__name__)

_connection: pyodbc.Connection | None = None


def _is_connection_alive(conn: pyodbc.Connection) -> bool:
    """Check if an existing connection is still usable."""
    try:
        conn.execute("SELECT 1")
        return True
    except Exception:
        return False


def get_sqlserver_connection() -> pyodbc.Connection:
    """Get a connection to HUMAN_2025 (SQL Server)."""
    global _connection
    try:
        if _connection is None or not _is_connection_alive(_connection):
            _connection = pyodbc.connect(
                settings.sqlserver_connection_string,
                autocommit=False,
                timeout=10,
            )
            logger.info("✅ SQL Server connected: %s", settings.SQLSERVER_DATABASE)
        return _connection
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
