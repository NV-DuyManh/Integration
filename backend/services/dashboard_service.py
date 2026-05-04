# backend/services/dashboard_service.py
# ─────────────────────────────────────────────────────────────────
#  Cross-database aggregation for the dashboard
#  Bridges HUMAN_2025 (SQL Server) ↔ PAYROLL_2026 (MySQL)
# ─────────────────────────────────────────────────────────────────
import logging
from services.hr_service import HRService
from services.payroll_service import PayrollService
from services.transaction_service import TransactionService
from core.database.sqlserver import test_sqlserver_connection
from core.database.mysql import test_mysql_connection, mysql_cursor

logger = logging.getLogger(__name__)


class DashboardService:
    """Aggregation layer that merges data from both databases.

    This is the middleware's core value: combining HR and Payroll
    data that live in separate database engines.
    """

    def __init__(self):
        self.hr = HRService()
        self.payroll = PayrollService()

    def get_system_status(self) -> dict:
        """Check connectivity to both databases."""
        return {
            "sqlserver": {
                "database": "HUMAN_2025",
                "connected": test_sqlserver_connection(),
            },
            "mysql": {
                "database": "PAYROLL_2026",
                "connected": test_mysql_connection(),
            },
        }

    def get_overview(self) -> dict:
        """Get high-level overview of both databases."""
        hr_schema = self.hr.discover_schema()
        payroll_schema = self.payroll.discover_schema()

        return {
            "hr": {
                "database": hr_schema["database"],
                "engine": hr_schema["engine"],
                "table_count": hr_schema["table_count"],
                "tables": list(hr_schema["tables"].keys()),
            },
            "payroll": {
                "database": payroll_schema["database"],
                "engine": payroll_schema["engine"],
                "table_count": payroll_schema["table_count"],
                "tables": list(payroll_schema["tables"].keys()),
            },
        }

    # ── Phase 2: Cross-DB queries ────────────────────────────────
    
    def search_employees(self, query: str) -> list[dict]:
        """Search employees in HR and fetch quick payroll status."""
        hr_emps = self.hr.repo.search_employees(query)
        results = []
        for emp in hr_emps:
            payroll_info = self.payroll.repo.get_employee_payroll(emp["EmployeeID"])
            merged = dict(emp)
            merged["HasPayroll"] = bool(payroll_info)
            if payroll_info:
                merged["NetSalary"] = payroll_info.get("NetSalary")
            results.append(merged)

        TransactionService.log_transaction(
            action="QUERY",
            target_db="BOTH",
            table="Employees",
            details=f"Search '{query}' — {len(results)} results",
        )
        return results

    def get_employee_360(self, employee_id: int) -> dict:
        """Merge HR record + Payroll record for one employee."""
        hr_data = self.hr.repo.get_employee(employee_id)
        if not hr_data:
            return None
            
        payroll_data = self.payroll.repo.get_employee_payroll(employee_id)

        TransactionService.log_transaction(
            action="READ",
            target_db="BOTH",
            table="Employees",
            details=f"Employee 360 view for ID {employee_id}: {hr_data.get('FullName', 'N/A')}",
        )

        return {
            "hr": hr_data,
            "payroll": payroll_data or {}
        }
        
    def get_reconciliation(self) -> dict:
        """Find discrepancies between HR and Payroll."""
        hr_emps = self.hr.repo.get_all_employees()
        payroll_emps = self.payroll.repo.get_all_employees_payroll()
        
        hr_dict = {e["EmployeeID"]: e for e in hr_emps}
        payroll_dict = {e["EmployeeID"]: e for e in payroll_emps}
        
        missing_in_payroll = []
        for eid, e in hr_dict.items():
            if eid not in payroll_dict:
                missing_in_payroll.append(e)
                
        missing_in_hr = []
        for eid, e in payroll_dict.items():
            if eid not in hr_dict:
                missing_in_hr.append(e)
                
        return {
            "summary": {
                "total_hr": len(hr_emps),
                "total_payroll": len(payroll_emps),
                "missing_in_payroll_count": len(missing_in_payroll),
                "missing_in_hr_count": len(missing_in_hr),
            },
            "missing_in_payroll": missing_in_payroll[:100],  # Limit for UI
            "missing_in_hr": missing_in_hr[:100]
        }
        
    def get_data_quality(self) -> dict:
        """Get anomaly and data quality metrics."""
        recon = self.get_reconciliation()
        anomalies = self.payroll.repo.get_salary_anomalies()
        
        total_employees = recon["summary"]["total_hr"]
        missing_payroll = recon["summary"]["missing_in_payroll_count"]
        health_score = 100
        if total_employees > 0:
            health_score -= (missing_payroll / total_employees) * 100
            
        return {
            "health_score": round(max(0, health_score), 1),
            "missing_mappings": missing_payroll,
            "salary_anomalies": len(anomalies),
            "anomalies_list": anomalies
        }
        
    def generate_report(self, report_type: str) -> dict:
        """Generate integrated read-only reports."""
        if report_type == "compensation":
            # Just merge top 50 employees
            hr_emps = self.hr.repo.get_all_employees()[:50]
            report_data = []
            for e in hr_emps:
                p = self.payroll.repo.get_employee_payroll(e["EmployeeID"])
                report_data.append({
                    "EmployeeID": e["EmployeeID"],
                    "Name": e["FullName"],
                    "Status": e["Status"],
                    "BaseSalary": p.get("BaseSalary") if p else None,
                    "NetSalary": p.get("NetSalary") if p else None
                })
            TransactionService.log_transaction(
                action="READ",
                target_db="BOTH",
                table="Reports",
                details=f"Generated Compensation Report ({len(report_data)} employees)",
            )
            return {"title": "Employee Compensation Report", "data": report_data}
            
        elif report_type == "exceptions":
            recon = self.get_reconciliation()
            return {
                "title": "Sync Exceptions Report",
                "data": recon["missing_in_payroll"] + recon["missing_in_hr"]
            }
            
        elif report_type == "department":
            with mysql_cursor() as cur:
                cur.execute("""
                    SELECT 
                        d.DepartmentName AS Department,
                        COUNT(DISTINCT e.EmployeeID) AS `Employee Count`,
                        COALESCE(SUM(s.BaseSalary), 0) AS `Total Base Salary`,
                        COALESCE(SUM(s.Bonus), 0) AS `Total Bonus`,
                        COALESCE(SUM(s.Deductions), 0) AS `Total Deductions`,
                        COALESCE(SUM(s.NetSalary), 0) AS `Total Net Salary`
                    FROM departments_payroll d
                    LEFT JOIN employees_payroll e ON d.DepartmentID = e.DepartmentID
                    LEFT JOIN salaries s ON e.EmployeeID = s.EmployeeID
                    GROUP BY d.DepartmentID, d.DepartmentName
                    HAVING COUNT(DISTINCT e.EmployeeID) > 0
                    ORDER BY `Total Net Salary` DESC
                """)
                rows = cur.fetchall()
            
            report_data = []
            for r in rows:
                report_data.append({
                    "Department": r["Department"],
                    "Employee Count": r["Employee Count"],
                    "Total Base Salary": float(r["Total Base Salary"]),
                    "Total Bonus": float(r["Total Bonus"]),
                    "Total Deductions": float(r["Total Deductions"]),
                    "Total Net Salary": float(r["Total Net Salary"]),
                })
            return {"title": "Department Payroll Report", "data": report_data}
            
        return {"title": "Unknown Report", "data": []}
