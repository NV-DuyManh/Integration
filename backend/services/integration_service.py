import logging
import random
import uuid
from datetime import datetime, timezone
from core.database.transaction import cross_db_transaction
from services.transaction_service import TransactionService

logger = logging.getLogger(__name__)

class IntegrationService:
    """Service to handle atomic operations across HR and Payroll databases."""

    def add_employee(self, employee_data: dict) -> dict:
        """
        Add an employee to HUMAN_2025 and sync to PAYROLL_2026.
        """
        with cross_db_transaction() as (sql_cur, mysql_cur):
            # 1. Insert into HUMAN_2025.Employees
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
            
            # 2. Insert into PAYROLL_2026.employees_payroll
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
                action="CREATE",
                target_db="BOTH",
                table="Employees",
                details=f"Created EmployeeID {emp_id}"
            )
            
            return {**employee_data, "EmployeeID": emp_id}

    def update_employee(self, emp_id: int, employee_data: dict) -> dict:
        """
        Update an employee in HUMAN_2025 and sync to PAYROLL_2026.
        """
        with cross_db_transaction() as (sql_cur, mysql_cur):
            # 1. Update HUMAN_2025.Employees
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

            # 2. Update PAYROLL_2026.employees_payroll
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
                action="UPDATE",
                target_db="BOTH",
                table="Employees",
                details=f"Updated EmployeeID {emp_id}"
            )
            
            return {**employee_data, "EmployeeID": emp_id}

    def delete_employee(self, emp_id: int):
        """
        Delete an employee and all dependent records across both databases.
        Cascading order:
          MySQL:  salaries → attendance → employees_payroll
          SQL Server:  Dividends → Employees
        """
        with cross_db_transaction() as (sql_cur, mysql_cur):
            # ── MySQL: cascade-delete child records ──────────────
            mysql_cur.execute("DELETE FROM salaries WHERE EmployeeID = %s", (emp_id,))
            sal_deleted = mysql_cur.rowcount

            mysql_cur.execute("DELETE FROM attendance WHERE EmployeeID = %s", (emp_id,))
            att_deleted = mysql_cur.rowcount

            mysql_cur.execute("DELETE FROM employees_payroll WHERE EmployeeID = %s", (emp_id,))

            # ── SQL Server: cascade-delete child records ─────────
            sql_cur.execute("DELETE FROM dbo.Dividends WHERE EmployeeID = ?", (emp_id,))
            div_deleted = sql_cur.rowcount

            sql_cur.execute("DELETE FROM dbo.Employees WHERE EmployeeID = ?", (emp_id,))
            if sql_cur.rowcount == 0:
                raise ValueError(f"Employee {emp_id} not found in HUMAN_2025")

            details = f"Deleted EmployeeID {emp_id}"
            if sal_deleted or att_deleted or div_deleted:
                details += f" (cascade: {sal_deleted} salaries, {att_deleted} attendance, {div_deleted} dividends)"

            TransactionService.log_transaction(
                action="DELETE",
                target_db="BOTH",
                table="Employees",
                details=details,
            )

            return {"message": f"Employee {emp_id} and all related records deleted successfully"}

    def add_salary(self, salary_data: dict) -> dict:
        """
        Add a salary record in PAYROLL_2026.
        Ensures the employee exists in HUMAN_2025.
        """
        emp_id = salary_data['EmployeeID']
        
        with cross_db_transaction() as (sql_cur, mysql_cur):
            # 1. Verify Employee exists in HR
            sql_cur.execute("SELECT Status FROM dbo.Employees WHERE EmployeeID = ?", (emp_id,))
            row = sql_cur.fetchone()
            if not row:
                raise ValueError(f"Employee {emp_id} does not exist in HUMAN_2025")
                
            # 2. Add salary in Payroll DB
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
                action="CREATE",
                target_db="PAYROLL_2026",
                table="salaries",
                details=f"Created SalaryID {salary_id} for EmployeeID {emp_id}"
            )
            
            return {**salary_data, "SalaryID": salary_id}

    def update_salary(self, salary_id: int, salary_data: dict) -> dict:
        """
        Update a salary record in PAYROLL_2026.
        """
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
                action="UPDATE",
                target_db="PAYROLL_2026",
                table="salaries",
                details=f"Updated SalaryID {salary_id}"
            )
            
            return {**salary_data, "SalaryID": salary_id}

    def delete_salary(self, salary_id: int):
        """
        Delete a salary record from PAYROLL_2026.
        """
        with cross_db_transaction() as (sql_cur, mysql_cur):
            mysql_cur.execute("DELETE FROM salaries WHERE SalaryID = %s", (salary_id,))
            
            if mysql_cur.rowcount == 0:
                raise ValueError(f"Salary {salary_id} not found")
                
            TransactionService.log_transaction(
                action="DELETE",
                target_db="PAYROLL_2026",
                table="salaries",
                details=f"Deleted SalaryID {salary_id}"
            )
            
            return {"message": "Salary deleted successfully"}

    def add_orphan_employee(self, employee_data: dict) -> dict:
        """Intentionally create an orphan record in HR only for testing.
        
        This bypasses the normal sync flow to create a record that exists
        in SQL Server (HUMAN_2025) but NOT in MySQL (PAYROLL_2026),
        triggering reconciliation alerts on the dashboard.
        """
        from core.database.sqlserver import get_sqlserver_connection
        conn = get_sqlserver_connection()
        cur = conn.cursor()
        # Generate fake unique data to bypass UNIQUE constraints
        fake_id = uuid.uuid4().hex[:8]
        fake_email = f"orphan_{fake_id}@demo.local"
        fake_phone = f"000{fake_id}"

        # Randomize Vietnamese status to match UI consistency
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
                action="TEST_ANOMALY",
                target_db="HUMAN_2025",
                table="Employees",
                details=f"Created ORPHAN EmployeeID {emp_id} (intentionally not synced to PAYROLL_2026)"
            )
            return {**employee_data, "EmployeeID": emp_id}
        except Exception as e:
            conn.rollback()
            raise
        finally:
            cur.close()
