# backend/tests/test_transaction_service.py
# ─────────────────────────────────────────────────────────────────
#  Tests for TransactionService (in-memory, no DB required)
# ─────────────────────────────────────────────────────────────────
import pytest
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from services.transaction_service import TransactionService


class TestTransactionService:
    def setup_method(self):
        """Clear log before each test."""
        TransactionService.clear_log()

    def test_log_transaction(self):
        """Logging a transaction should return the entry."""
        entry = TransactionService.log_transaction(
            action="SCHEMA_READ",
            target_db="HUMAN_2025",
            table="employees",
            details="Read schema",
        )
        assert entry["action"] == "SCHEMA_READ"
        assert entry["target_db"] == "HUMAN_2025"
        assert entry["table"] == "employees"
        assert "timestamp" in entry

    def test_get_recent_transactions(self):
        """Recent transactions should be in reverse-chronological order."""
        TransactionService.log_transaction("READ", "HUMAN_2025", "t1")
        TransactionService.log_transaction("READ", "PAYROLL_2026", "t2")
        TransactionService.log_transaction("READ", "HUMAN_2025", "t3")

        recent = TransactionService.get_recent_transactions(2)
        assert len(recent) == 2
        assert recent[0]["table"] == "t3"
        assert recent[1]["table"] == "t2"

    def test_get_transaction_stats(self):
        """Stats should aggregate by action and database."""
        TransactionService.log_transaction("READ", "HUMAN_2025")
        TransactionService.log_transaction("READ", "PAYROLL_2026")
        TransactionService.log_transaction("WRITE", "HUMAN_2025")

        stats = TransactionService.get_transaction_stats()
        assert stats["total"] == 3
        assert stats["by_action"]["READ"] == 2
        assert stats["by_action"]["WRITE"] == 1
        assert stats["by_database"]["HUMAN_2025"] == 2

    def test_clear_log(self):
        """Clear should empty the log."""
        TransactionService.log_transaction("READ", "HUMAN_2025")
        TransactionService.clear_log()
        assert TransactionService.get_transaction_stats()["total"] == 0

    def test_empty_stats(self):
        """Empty log should return zero stats."""
        stats = TransactionService.get_transaction_stats()
        assert stats["total"] == 0
        assert stats["by_action"] == {}
        assert stats["by_database"] == {}
