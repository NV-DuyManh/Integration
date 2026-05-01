import sys, os
sys.path.append(os.path.abspath('backend'))
from dotenv import load_dotenv
load_dotenv('backend/.env')
from core.database.sqlserver import sqlserver_cursor

try:
    with sqlserver_cursor() as cur:
        cur.execute("SELECT is_identity FROM sys.columns WHERE object_id = object_id('dbo.Employees') AND name = 'EmployeeID'")
        print("EmployeeID is_identity:", cur.fetchone()[0])
        
        cur.execute("SELECT is_identity FROM sys.columns WHERE object_id = object_id('dbo.Dividends') AND name = 'DividendID'")
        row = cur.fetchone()
        print("DividendID is_identity:", row[0] if row else None)
except Exception as e:
    print("Error:", e)
    
from core.database.mysql import mysql_cursor
try:
    with mysql_cursor() as cur:
        cur.execute("SELECT EXTRA FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'salaries' AND COLUMN_NAME = 'SalaryID'")
        print("SalaryID EXTRA:", cur.fetchone()['EXTRA'])
except Exception as e:
    print("Error:", e)
