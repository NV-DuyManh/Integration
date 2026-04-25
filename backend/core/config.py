# backend/core/config.py
# ─────────────────────────────────────────────────────────────────
#  Centralized settings from .env
# ─────────────────────────────────────────────────────────────────
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # Ignore VITE_* and other frontend env vars
    )

    # ── Server ────────────────────────────────────────────────────
    PORT: int = 8000
    DEBUG: bool = True

    # ── SQL Server — HUMAN_2025 (Windows Authentication) ────────────
    SQLSERVER_HOST: str = r"DUY-MANH\SQLEXPRESS"
    SQLSERVER_DATABASE: str = "HUMAN_2025"
    SQLSERVER_DRIVER: str = "{ODBC Driver 17 for SQL Server}"
    SQLSERVER_TRUSTED_CONNECTION: str = "yes"

    # ── MySQL — PAYROLL_2026 ──────────────────────────────────────
    MYSQL_HOST: str = "127.0.0.1"
    MYSQL_PORT: int = 3306
    MYSQL_DATABASE: str = "PAYROLL_2026"
    MYSQL_USER: str = "root"
    MYSQL_PASSWORD: str = ""

    @property
    def sqlserver_connection_string(self) -> str:
        return (
            f"DRIVER={self.SQLSERVER_DRIVER};"
            f"SERVER={self.SQLSERVER_HOST};"
            f"DATABASE={self.SQLSERVER_DATABASE};"
            f"Trusted_Connection={self.SQLSERVER_TRUSTED_CONNECTION};"
            f"TrustServerCertificate=yes;"
        )

    @property
    def mysql_connection_params(self) -> dict:
        return {
            "host": self.MYSQL_HOST,
            "port": self.MYSQL_PORT,
            "database": self.MYSQL_DATABASE,
            "user": self.MYSQL_USER,
            "password": self.MYSQL_PASSWORD,
            "charset": "utf8mb4",
        }


settings = Settings()
