"""
ClearHost PMS — Configuración de la aplicación.
Carga variables de entorno desde .env
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://clearhost:clearhost_pass@localhost:5432/clearhost_db"

    # JWT Auth
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 horas

    # Firebase
    FIREBASE_CREDENTIALS_PATH: str = "./firebase-credentials.json"

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
    return Settings()
