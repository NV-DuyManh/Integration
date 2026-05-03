import logging
from contextlib import contextmanager
from core.database.sqlserver import get_sqlserver_connection
from core.database.mysql import get_mysql_connection

logger = logging.getLogger(__name__)

@contextmanager
def cross_db_transaction():
    """Context manager for cross-database transactions."""
    sql_conn = get_sqlserver_connection()
    mysql_conn = get_mysql_connection()
    
    sql_cursor = sql_conn.cursor()
    mysql_cursor = mysql_conn.cursor()
    
    try:
        yield sql_cursor, mysql_cursor
        
        # If we reach here, no exception was raised
        sql_conn.commit()
        mysql_conn.commit()
    except Exception as e:
        logger.error(f"Cross DB transaction failed, rolling back both: {e}")
        sql_conn.rollback()
        mysql_conn.rollback()
        raise
    finally:
        sql_cursor.close()
        mysql_cursor.close()
