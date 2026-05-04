import logging
import random
import uuid
from datetime import datetime, timezone
from core.database.transaction import cross_db_transaction
from core.database.sqlserver import get_sqlserver_connection
from core.database.mysql import get_mysql_connection
from services.transaction_service import TransactionService

logger = logging.getLogger(__name__)


class IntegrationService:
    """Service to handle atomic operations across HR and Payroll databases."""

    # ─────────────────────────────────────────────────────────────
    # EMPLOYEES
    # ─────────────────────────────────────────────────────────────

    def add_employee(self, employee_data: dict) -> dict:
        """Add an employee to HUMAN_2025 and sync to PAYROLL_2026."""
        with cross_db_transaction() as (sql_cur, mysql_cur):
            sql_cur.execute("""
                INSERT INTO dbo.Employees 
                (FullName, DateOfBirth, Gender, PhoneNumber, Email, HireDate, DepartmentID, PositionID, Status, CreatedAt, UpdatedAt)
                OUTPUT INSERTED.EmployeeID
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())
            """, (
                employee_data['FullName'],
                employee_data['DateOfBirth'],
                employee_data.get('Gender'),
                employee_data.get('PhoneNumber'),
                employee_data.get('Email'),
                employee_data['HireDate'],
                employee_data.get('DepartmentID'),
                employee_data.get('PositionID'),
                employee_data.get('Status', 'Active')
            ))
            emp_id = sql_cur.fetchone()[0]

            now = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
            mysql_cur.execute("""
                INSERT INTO employees_payroll
                (EmployeeID, FullName, DepartmentID, PositionID, Status, SyncedAt)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                emp_id,
                employee_data['FullName'],
                employee_data.get('DepartmentID'),
                employee_data.get('PositionID'),
                employee_data.get('Status', 'Active'),
                now
            ))

            TransactionService.log_transaction(
                action="CREATE", target_db="BOTH", table="Employees",
                details=f"Created EmployeeID {emp_id}"
            )
            return {**employee_data, "EmployeeID": emp_id}

    def update_employee(self, emp_id: int, employee_data: dict) -> dict:
        """Update an employee in HUMAN_2025 and sync to PAYROLL_2026."""
        with cross_db_transaction() as (sql_cur, mysql_cur):
            sql_cur.execute("""
                UPDATE dbo.Employees 
                SET FullName = ?, DateOfBirth = ?, Gender = ?, PhoneNumber = ?, 
                    Email = ?, HireDate = ?, DepartmentID = ?, PositionID = ?, 
                    Status = ?, UpdatedAt = GETDATE()
                WHERE EmployeeID = ?
            """, (
                employee_data['FullName'],
                employee_data['DateOfBirth'],
                employee_data.get('Gender'),
                employee_data.get('PhoneNumber'),
                employee_data.get('Email'),
                employee_data['HireDate'],
                employee_data.get('DepartmentID'),
                employee_data.get('PositionID'),
                employee_data.get('Status'),
                emp_id
            ))
            if sql_cur.rowcount == 0:
                raise ValueError(f"Employee {emp_id} not found in HUMAN_2025")

            now = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
            mysql_cur.execute("""
                UPDATE employees_payroll
                SET FullName = %s, DepartmentID = %s, PositionID = %s, Status = %s, SyncedAt = %s
                WHERE EmployeeID = %s
            """, (
                employee_data['FullName'],
                employee_data.get('DepartmentID'),
                employee_data.get('PositionID'),
                employee_data.get('Status'),
                now,
                emp_id
            ))

            TransactionService.log_transaction(
                action="UPDATE", target_db="BOTH", table="Employees",
                details=f"Updated EmployeeID {emp_id}"
            )
            return {**employee_data, "EmployeeID": emp_id}

    def delete_employee(self, emp_id: int):
        """Delete employee and all dependent records across both databases."""
        with cross_db_transaction() as (sql_cur, mysql_cur):
            mysql_cur.execute("DELETE FROM salaries WHERE EmployeeID = %s", (emp_id,))
            sal_deleted = mysql_cur.rowcount
            mysql_cur.execute("DELETE FROM attendance WHERE EmployeeID = %s", (emp_id,))
            att_deleted = mysql_cur.rowcount
            mysql_cur.execute("DELETE FROM employees_payroll WHERE EmployeeID = %s", (emp_id,))

            sql_cur.execute("DELETE FROM dbo.Dividends WHERE EmployeeID = ?", (emp_id,))
            div_deleted = sql_cur.rowcount
            sql_cur.execute("DELETE FROM dbo.Employees WHERE EmployeeID = ?", (emp_id,))
            if sql_cur.rowcount == 0:
                raise ValueError(f"Employee {emp_id} not found in HUMAN_2025")

            details = f"Deleted EmployeeID {emp_id}"
            if sal_deleted or att_deleted or div_deleted:
                details += f" (cascade: {sal_deleted} salaries, {att_deleted} attendance, {div_deleted} dividends)"

            TransactionService.log_transaction(
                action="DELETE", target_db="BOTH", table="Employees", details=details
            )
            return {"message": f"Employee {emp_id} and all related records deleted successfully"}

    # ─────────────────────────────────────────────────────────────
    # DEPARTMENTS
    # ─────────────────────────────────────────────────────────────

    def add_department(self, data: dict) -> dict:
        """Add department to HUMAN_2025 and sync to PAYROLL_2026.departments_payroll."""
        with cross_db_transaction() as (sql_cur, mysql_cur):
            sql_cur.execute("""
                INSERT INTO dbo.Departments (DepartmentName, CreatedAt, UpdatedAt)
                OUTPUT INSERTED.DepartmentID
                VALUES (?, GETDATE(), GETDATE())
            """, (data['DepartmentName'],))
            dept_id = sql_cur.fetchone()[0]

            now = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
            mysql_cur.execute("""
                INSERT INTO departments_payroll (DepartmentID, DepartmentName, SyncedAt)
                VALUES (%s, %s, %s)
            """, (dept_id, data['DepartmentName'], now))

            TransactionService.log_transaction(
                action="CREATE", target_db="BOTH", table="Departments",
                details=f"Created DepartmentID {dept_id}: {data['DepartmentName']}"
            )
            return {**data, "DepartmentID": dept_id}

    def update_department(self, dept_id: int, data: dict) -> dict:
        """Update department in HUMAN_2025 and sync to PAYROLL_2026."""
        with cross_db_transaction() as (sql_cur, mysql_cur):
            sql_cur.execute("""
                UPDATE dbo.Departments
                SET DepartmentName = ?, UpdatedAt = GETDATE()
                WHERE DepartmentID = ?
            """, (data['DepartmentName'], dept_id))
            if sql_cur.rowcount == 0:
                raise ValueError(f"Department {dept_id} not found in HUMAN_2025")

            now = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
            mysql_cur.execute("""
                UPDATE departments_payroll
                SET DepartmentName = %s, SyncedAt = %s
                WHERE DepartmentID = %s
            """, (data['DepartmentName'], now, dept_id))

            TransactionService.log_transaction(
                action="UPDATE", target_db="BOTH", table="Departments",
                details=f"Updated DepartmentID {dept_id}"
            )
            return {**data, "DepartmentID": dept_id}

    def delete_department(self, dept_id: int):
        """Delete department from both DBs. Blocks if employees are assigned."""
        with cross_db_transaction() as (sql_cur, mysql_cur):
            # Check if any employee uses this department
            sql_cur.execute(
                "SELECT COUNT(*) FROM dbo.Employees WHERE DepartmentID = ?", (dept_id,)
            )
            row = sql_cur.fetchone()
            emp_count = row[0] if row else 0
            if emp_count > 0:
                raise ValueError(
                    f"Cannot delete: {emp_count} employee(s) are assigned to this department. "
                    "Please reassign them first."
                )

            mysql_cur.execute(
                "DELETE FROM departments_payroll WHERE DepartmentID = %s", (dept_id,)
            )
            sql_cur.execute(
                "DELETE FROM dbo.Departments WHERE DepartmentID = ?", (dept_id,)
            )
            if sql_cur.rowcount == 0:
                raise ValueError(f"Department {dept_id} not found in HUMAN_2025")

            TransactionService.log_transaction(
                action="DELETE", target_db="BOTH", table="Departments",
                details=f"Deleted DepartmentID {dept_id}"
            )
            return {"message": f"Department {dept_id} deleted successfully from both databases"}

    # ─────────────────────────────────────────────────────────────
    # POSITIONS
    # ─────────────────────────────────────────────────────────────

    def add_position(self, data: dict) -> dict:
        """Add position to HUMAN_2025 and sync to PAYROLL_2026.positions_payroll."""
        with cross_db_transaction() as (sql_cur, mysql_cur):
            sql_cur.execute("""
                INSERT INTO dbo.Positions (PositionName, CreatedAt, UpdatedAt)
                OUTPUT INSERTED.PositionID
                VALUES (?, GETDATE(), GETDATE())
            """, (data['PositionName'],))
            pos_id = sql_cur.fetchone()[0]

            now = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
            mysql_cur.execute("""
                INSERT INTO positions_payroll (PositionID, PositionName, SyncedAt)
                VALUES (%s, %s, %s)
            """, (pos_id, data['PositionName'], now))

            TransactionService.log_transaction(
                action="CREATE", target_db="BOTH", table="Positions",
                details=f"Created PositionID {pos_id}: {data['PositionName']}"
            )
            return {**data, "PositionID": pos_id}

    def update_position(self, pos_id: int, data: dict) -> dict:
        """Update position in HUMAN_2025 and sync to PAYROLL_2026."""
        with cross_db_transaction() as (sql_cur, mysql_cur):
            sql_cur.execute("""
                UPDATE dbo.Positions
                SET PositionName = ?, UpdatedAt = GETDATE()
                WHERE PositionID = ?
            """, (data['PositionName'], pos_id))
            if sql_cur.rowcount == 0:
                raise ValueError(f"Position {pos_id} not found in HUMAN_2025")

            now = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
            mysql_cur.execute("""
                UPDATE positions_payroll
                SET PositionName = %s, SyncedAt = %s
                WHERE PositionID = %s
            """, (data['PositionName'], now, pos_id))

            TransactionService.log_transaction(
                action="UPDATE", target_db="BOTH", table="Positions",
                details=f"Updated PositionID {pos_id}"
            )
            return {**data, "PositionID": pos_id}

    def delete_position(self, pos_id: int):
        """Delete position from both DBs. Blocks if employees are assigned."""
        with cross_db_transaction() as (sql_cur, mysql_cur):
            sql_cur.execute(
                "SELECT COUNT(*) FROM dbo.Employees WHERE PositionID = ?", (pos_id,)
            )
            row = sql_cur.fetchone()
            emp_count = row[0] if row else 0
            if emp_count > 0:
                raise ValueError(
                    f"Cannot delete: {emp_count} employee(s) hold this position. "
                    "Please reassign them first."
                )

            mysql_cur.execute(
                "DELETE FROM positions_payroll WHERE PositionID = %s", (pos_id,)
            )
            sql_cur.execute(
                "DELETE FROM dbo.Positions WHERE PositionID = ?", (pos_id,)
            )
            if sql_cur.rowcount == 0:
                raise ValueError(f"Position {pos_id} not found in HUMAN_2025")

            TransactionService.log_transaction(
                action="DELETE", target_db="BOTH", table="Positions",
                details=f"Deleted PositionID {pos_id}"
            )
            return {"message": f"Position {pos_id} deleted successfully from both databases"}

    # ─────────────────────────────────────────────────────────────
    # DIVIDENDS  (SQL Server only)
    # ─────────────────────────────────────────────────────────────

    def add_dividend(self, data: dict) -> dict:
        """Add a dividend record in HUMAN_2025. Verifies EmployeeID exists."""
        conn = get_sqlserver_connection()
        cur = conn.cursor()
        try:
            cur.execute(
                "SELECT EmployeeID FROM dbo.Employees WHERE EmployeeID = ?",
                (data['EmployeeID'],)
            )
            if not cur.fetchone():
                raise ValueError(f"Employee {data['EmployeeID']} does not exist in HUMAN_2025")

            cur.execute("""
                INSERT INTO dbo.Dividends (EmployeeID, DividendAmount, DividendDate, CreatedAt)
                OUTPUT INSERTED.DividendID
                VALUES (?, ?, ?, GETDATE())
            """, (data['EmployeeID'], data['DividendAmount'], data['DividendDate']))
            div_id = cur.fetchone()[0]
            conn.commit()

            TransactionService.log_transaction(
                action="CREATE", target_db="HUMAN_2025", table="Dividends",
                details=f"Created DividendID {div_id} for EmployeeID {data['EmployeeID']}"
            )
            return {**data, "DividendID": div_id}
        except Exception:
            conn.rollback()
            raise
        finally:
            cur.close()

    def update_dividend(self, div_id: int, data: dict) -> dict:
        """Update a dividend record in HUMAN_2025."""
        conn = get_sqlserver_connection()
        cur = conn.cursor()
        try:
            cur.execute("""
                UPDATE dbo.Dividends
                SET EmployeeID = ?, DividendAmount = ?, DividendDate = ?
                WHERE DividendID = ?
            """, (data['EmployeeID'], data['DividendAmount'], data['DividendDate'], div_id))
            if cur.rowcount == 0:
                raise ValueError(f"Dividend {div_id} not found")
            conn.commit()

            TransactionService.log_transaction(
                action="UPDATE", target_db="HUMAN_2025", table="Dividends",
                details=f"Updated DividendID {div_id}"
            )
            return {**data, "DividendID": div_id}
        except Exception:
            conn.rollback()
            raise
        finally:
            cur.close()

    def delete_dividend(self, div_id: int):
        """Delete a dividend record from HUMAN_2025."""
        conn = get_sqlserver_connection()
        cur = conn.cursor()
        try:
            cur.execute("DELETE FROM dbo.Dividends WHERE DividendID = ?", (div_id,))
            if cur.rowcount == 0:
                raise ValueError(f"Dividend {div_id} not found")
            conn.commit()

            TransactionService.log_transaction(
                action="DELETE", target_db="HUMAN_2025", table="Dividends",
                details=f"Deleted DividendID {div_id}"
            )
            return {"message": f"Dividend {div_id} deleted successfully"}
        except Exception:
            conn.rollback()
            raise
        finally:
            cur.close()

    # ─────────────────────────────────────────────────────────────
    # ATTENDANCE  (MySQL only)
    # ─────────────────────────────────────────────────────────────

    def add_attendance(self, data: dict) -> dict:
        """Add attendance record in PAYROLL_2026. Verifies EmployeeID exists."""
        conn_sql = get_sqlserver_connection()
        cur_sql = conn_sql.cursor()
        try:
            cur_sql.execute(
                "SELECT EmployeeID FROM dbo.Employees WHERE EmployeeID = ?",
                (data['EmployeeID'],)
            )
            if not cur_sql.fetchone():
                raise ValueError(f"Employee {data['EmployeeID']} does not exist in HUMAN_2025")
        finally:
            cur_sql.close()

        conn_mysql = get_mysql_connection()
        cur_mysql = conn_mysql.cursor()
        try:
            cur_mysql.execute("""
                INSERT INTO attendance
                (EmployeeID, WorkDays, AbsentDays, LeaveDays, AttendanceMonth, CreatedAt)
                VALUES (%s, %s, %s, %s, %s, UTC_TIMESTAMP())
            """, (
                data['EmployeeID'],
                data['WorkDays'],
                data.get('AbsentDays', 0),
                data.get('LeaveDays', 0),
                data['AttendanceMonth']
            ))
            att_id = cur_mysql.lastrowid
            conn_mysql.commit()

            TransactionService.log_transaction(
                action="CREATE", target_db="PAYROLL_2026", table="attendance",
                details=f"Created AttendanceID {att_id} for EmployeeID {data['EmployeeID']}"
            )
            return {**data, "AttendanceID": att_id}
        except Exception:
            conn_mysql.rollback()
            raise
        finally:
            cur_mysql.close()

    def update_attendance(self, att_id: int, data: dict) -> dict:
        """Update attendance record in PAYROLL_2026."""
        conn_mysql = get_mysql_connection()
        cur_mysql = conn_mysql.cursor()
        try:
            cur_mysql.execute("""
                UPDATE attendance
                SET EmployeeID = %s, WorkDays = %s, AbsentDays = %s, LeaveDays = %s, AttendanceMonth = %s
                WHERE AttendanceID = %s
            """, (
                data['EmployeeID'],
                data['WorkDays'],
                data.get('AbsentDays', 0),
                data.get('LeaveDays', 0),
                data['AttendanceMonth'],
                att_id
            ))
            if cur_mysql.rowcount == 0:
                raise ValueError(f"Attendance {att_id} not found")
            conn_mysql.commit()

            TransactionService.log_transaction(
                action="UPDATE", target_db="PAYROLL_2026", table="attendance",
                details=f"Updated AttendanceID {att_id}"
            )
            return {**data, "AttendanceID": att_id}
        except Exception:
            conn_mysql.rollback()
            raise
        finally:
            cur_mysql.close()

    def delete_attendance(self, att_id: int):
        """Delete attendance record from PAYROLL_2026."""
        conn_mysql = get_mysql_connection()
        cur_mysql = conn_mysql.cursor()
        try:
            cur_mysql.execute("DELETE FROM attendance WHERE AttendanceID = %s", (att_id,))
            if cur_mysql.rowcount == 0:
                raise ValueError(f"Attendance {att_id} not found")
            conn_mysql.commit()

            TransactionService.log_transaction(
                action="DELETE", target_db="PAYROLL_2026", table="attendance",
                details=f"Deleted AttendanceID {att_id}"
            )
            return {"message": f"Attendance {att_id} deleted successfully"}
        except Exception:
            conn_mysql.rollback()
            raise
        finally:
            cur_mysql.close()

    # ─────────────────────────────────────────────────────────────
    # SALARIES  (MySQL only, verify employee in SQL Server)
    # ─────────────────────────────────────────────────────────────

    def add_salary(self, salary_data: dict) -> dict:
        emp_id = salary_data['EmployeeID']
        with cross_db_transaction() as (sql_cur, mysql_cur):
            sql_cur.execute(
                "SELECT Status FROM dbo.Employees WHERE EmployeeID = ?", (emp_id,)
            )
            if not sql_cur.fetchone():
                raise ValueError(f"Employee {emp_id} does not exist in HUMAN_2025")

            mysql_cur.execute("""
                INSERT INTO salaries
                (EmployeeID, SalaryMonth, BaseSalary, Bonus, Deductions, NetSalary, CreatedAt)
                VALUES (%s, %s, %s, %s, %s, %s, UTC_TIMESTAMP())
            """, (
                emp_id,
                salary_data['SalaryMonth'],
                salary_data['BaseSalary'],
                salary_data.get('Bonus', 0),
                salary_data.get('Deductions', 0),
                salary_data['NetSalary']
            ))
            salary_id = mysql_cur.lastrowid

            TransactionService.log_transaction(
                action="CREATE", target_db="PAYROLL_2026", table="salaries",
                details=f"Created SalaryID {salary_id} for EmployeeID {emp_id}"
            )
            return {**salary_data, "SalaryID": salary_id}

    def update_salary(self, salary_id: int, salary_data: dict) -> dict:
        with cross_db_transaction() as (sql_cur, mysql_cur):
            mysql_cur.execute("""
                UPDATE salaries
                SET EmployeeID = %s, SalaryMonth = %s, BaseSalary = %s, 
                    Bonus = %s, Deductions = %s, NetSalary = %s
                WHERE SalaryID = %s
            """, (
                salary_data['EmployeeID'],
                salary_data['SalaryMonth'],
                salary_data['BaseSalary'],
                salary_data.get('Bonus', 0),
                salary_data.get('Deductions', 0),
                salary_data['NetSalary'],
                salary_id
            ))
            if mysql_cur.rowcount == 0:
                raise ValueError(f"Salary {salary_id} not found")

            TransactionService.log_transaction(
                action="UPDATE", target_db="PAYROLL_2026", table="salaries",
                details=f"Updated SalaryID {salary_id}"
            )
            return {**salary_data, "SalaryID": salary_id}

    def delete_salary(self, salary_id: int):
        with cross_db_transaction() as (sql_cur, mysql_cur):
            mysql_cur.execute("DELETE FROM salaries WHERE SalaryID = %s", (salary_id,))
            if mysql_cur.rowcount == 0:
                raise ValueError(f"Salary {salary_id} not found")

            TransactionService.log_transaction(
                action="DELETE", target_db="PAYROLL_2026", table="salaries",
                details=f"Deleted SalaryID {salary_id}"
            )
            return {"message": "Salary deleted successfully"}

    # ─────────────────────────────────────────────────────────────
    # ORPHAN EMPLOYEE (demo/test only)
    # ─────────────────────────────────────────────────────────────

    def add_orphan_employee(self, employee_data: dict) -> dict:
        """Create an orphan record in HR only (no payroll sync) for reconciliation demo."""
        conn = get_sqlserver_connection()
        cur = conn.cursor()
        fake_id = uuid.uuid4().hex[:8]
        fake_email = f"orphan_{fake_id}@demo.local"
        fake_phone = f"000{fake_id}"
        valid_statuses = ["Đang làm việc", "Thử việc", "Thực tập", "Nghỉ phép"]
        random_status = random.choice(valid_statuses)

        try:
            cur.execute("""
                INSERT INTO dbo.Employees 
                (FullName, DateOfBirth, HireDate, Status, Email, PhoneNumber, CreatedAt, UpdatedAt)
                OUTPUT INSERTED.EmployeeID
                VALUES (?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())
            """, (
                employee_data['FullName'],
                employee_data['DateOfBirth'],
                employee_data['HireDate'],
                random_status,
                fake_email,
                fake_phone
            ))
            emp_id = cur.fetchone()[0]
            conn.commit()

            TransactionService.log_transaction(
                action="TEST_ANOMALY", target_db="HUMAN_2025", table="Employees",
                details=f"Created ORPHAN EmployeeID {emp_id} (intentionally not synced to PAYROLL_2026)"
            )
            return {**employee_data, "EmployeeID": emp_id}
        except Exception:
            conn.rollback()
            raise
        finally:
            cur.close()