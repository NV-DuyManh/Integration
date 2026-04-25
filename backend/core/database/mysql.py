# backend/core/database/mysql.py
# ─────────────────────────────────────────────────────────────────
#  MySQL connection pool — PAYROLL_2026
# ─────────────────────────────────────────────────────────────────
import pymysql
import logging
from contextlib import contextmanager
from core.config import settings

logger = logging.getLogger(__name__)

_pool: pymysql.Connection | None = None


def get_mysql_connection() -> pymysql.Connection:
    """Get a connection to PAYROLL_2026 (MySQL)."""
    global _pool
    try:
        if _pool is None or not _pool.open:
            _pool = pymysql.connect(
                **settings.mysql_connection_params,
                cursorclass=pymysql.cursors.DictCursor,
                autocommit=False,
                connect_timeout=10,
            )
            logger.info("✅ MySQL connected: %s", settings.MYSQL_DATABASE)
        # Ping to check liveness, reconnect if dead
        _pool.ping(reconnect=True)
        return _pool
    except pymysql.Error as e:
        logger.error("❌ MySQL connection failed: %s", e)
        raise


@contextmanager
def mysql_cursor():
    """Context manager that yields a DictCursor and handles commit/rollback."""
    conn = get_mysql_connection()
    cursor = conn.cursor()
    try:
        yield cursor
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()


def test_mysql_connection() -> bool:
    """Test connectivity to PAYROLL_2026."""
    try:
        with mysql_cursor() as cur:
            cur.execute("SELECT 1")
            return True
    except Exception as e:
        logger.error("MySQL test failed: %s", e)
        return False
