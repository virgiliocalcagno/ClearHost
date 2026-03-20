"""
ClearHost PMS — Configuración de la aplicación.
Carga variables de entorno desde .env
"""

from typing import Optional
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://neondb_owner:npg_Q8DNcmCL6ZgJ@ep-odd-salad-amnmroia-pooler.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"

    # JWT Auth
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 horas

    # Firebase
    SERVICE_ACCOUNT_PATH: Optional[str] = None

    # App
    APP_NAME: str = "ClearHost PMS"
    DEBUG: bool = True

    # iCal Sync
    ICAL_SYNC_INTERVAL_MINUTES: int = 30
    ICAL_REQUEST_TIMEOUT: int = 30  # Timeout HTTP en segundos

    # Cron Jobs
    DAILY_REMINDER_HOUR: int = 8   # Hora de recordatorios al staff
    DAILY_ALERT_HOUR: int = 7      # Hora de alertas a admins

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    settings = Settings()
    
    # En Firebase Functions (Cloud Run), el disco es de solo lectura.
    # Si usamos SQLite, debemos escribir en /tmp/
    import os
    if "K_SERVICE" in os.environ and settings.DATABASE_URL.startswith("sqlite"):
        # Asegurarnos de que el path apunte a /tmp/
        settings.DATABASE_URL = "sqlite+aiosqlite:////tmp/clearhost.db"
        
    return settings
