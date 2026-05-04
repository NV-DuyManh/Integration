# backend/core/scheduler.py
# ─────────────────────────────────────────────────────────────────
#  Background Scheduler — Automated Reconciliation Check
#  Uses APScheduler to silently scan for cross-database anomalies
#  every hour and log them into the Audit Log automatically.
# ─────────────────────────────────────────────────────────────────
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from services.dashboard_service import DashboardService
from services.transaction_service import TransactionService

logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler()

def run_reconciliation_check():
    logger.info("🤖 Auto-Bot: Running scheduled reconciliation check...")
    try:
        ds = DashboardService()
        recon = ds.get_reconciliation()
        missing_payroll = recon["summary"]["missing_in_payroll_count"]
        missing_hr = recon["summary"]["missing_in_hr_count"]
        
        if missing_payroll > 0 or missing_hr > 0:
            msg = f"Auto-Scan alert: {missing_payroll} missing in Payroll, {missing_hr} missing in HR."
            logger.warning(msg)
            TransactionService.log_transaction("AUTO_SCAN", "BOTH", "System", msg, "system_bot")
    except Exception as e:
        logger.error(f"Scheduled check failed: {e}")

def start_scheduler():
    # Runs every 60 minutes. Can be changed to cron syntax for midnight runs in production.
    scheduler.add_job(run_reconciliation_check, 'interval', minutes=60)
    scheduler.start()
    logger.info("✅ Background scheduler started.")
