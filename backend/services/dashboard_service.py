# backend/services/dashboard_service.py
# ─────────────────────────────────────────────────────────────────
#  Cross-database aggregation for the dashboard
#  Bridges HUMAN_2025 (SQL Server) ↔ PAYROLL_2026 (MySQL)
# ─────────────────────────────────────────────────────────────────
import logging
from services.hr_service import HRService
from services.payroll_service import PayrollService
from app.database.sqlserver import test_sqlserver_connection
from app.database.mysql import test_mysql_connection

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
    # After schema discovery, this is where the real middleware
    # value lives. Examples:
    #
    #   def get_employee_full_profile(self, employee_id):
    #       """Merge HR record + Payroll record for one employee."""
    #       hr_data = self.hr.get_employee(employee_id)
    #       payroll_data = self.payroll.get_salary(employee_id)
    #       return {**hr_data, **payroll_data}
    #
    #   def get_department_cost_report(self):
    #       """HR departments + total payroll cost per dept."""
    #       ...
