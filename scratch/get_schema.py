import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from dotenv import load_dotenv
load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", ".env")))

from core.database.sqlserver import sqlserver_cursor
from core.database.mysql import mysql_cursor

def get_sqlserver_schema():
    print("--- SQL Server Schema ---")
    with sqlserver_cursor() as cur:
        cur.execute("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'")
        tables = [row[0] for row in cur.fetchall()]
        for table in tables:
            print(f"Table: {table}")
            cur.execute("SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ?", (table,))
            for row in cur.fetchall():
                print(f"  {row[0]} ({row[1]}, nullable: {row[2]})")

def get_mysql_schema():
    print("--- MySQL Schema ---")
    with mysql_cursor() as cur:
        cur.execute("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'")
        tables = [row["TABLE_NAME"] for row in cur.fetchall()]
        for table in tables:
            print(f"Table: {table}")
            cur.execute("SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s", (table,))
            for row in cur.fetchall():
                print(f"  {row['COLUMN_NAME']} ({row['DATA_TYPE']}, nullable: {row['IS_NULLABLE']})")

if __name__ == "__main__":
    try:
        get_sqlserver_schema()
        get_mysql_schema()
    except Exception as e:
        print(f"Error: {e}")
