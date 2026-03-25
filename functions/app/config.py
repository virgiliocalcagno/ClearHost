"""
ClearHost PMS — Configuración de la aplicación.
Carga variables de entorno desde .env
"""

import os
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
    FB_STORAGE_BUCKET: str = os.getenv("FB_STORAGE_BUCKET", "clearhost-c8919-evidencias")
    FB_DATABASE_URL: str = os.getenv("FB_DATABASE_URL", "https://clearhost-c8919-default-rtdb.firebaseio.com/")

    # App
    APP_NAME: str = "ClearHost PMS"
    DEBUG: bool = True
    
    # SMTP
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 465
    FRONTEND_URL: str = "https://clearhost-c8919.web.app"

    # iCal Sync
    ICAL_SYNC_INTERVAL_MINUTES: int = 30
    ICAL_REQUEST_TIMEOUT: int = 30  # Timeout HTTP en segundos

    # Cron Jobs
    DAILY_REMINDER_HOUR: int = 8   # Hora de recordatorios al staff
    DAILY_ALERT_HOUR: int = 7      # Hora de alertas a admins

    # Google Cloud Vision
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None

    # Google Gemini
    GEMINI_API_KEY: Optional[str] = None

    model_config = {
        "env_file": ".env", 
        "env_file_encoding": "utf-8",
        "extra": "ignore"  # Permitir otras variables en .env sin fallar
    }


@lru_cache()
def get_settings() -> Settings:
    settings = Settings()
    
    # Configurar Google Cloud Vision Credentials
    if settings.GOOGLE_APPLICATION_CREDENTIALS:
        import os
        # Si el path es relativo, unirlo al directorio base de la app (functions/)
        if not os.path.isabs(settings.GOOGLE_APPLICATION_CREDENTIALS):
            # De functions/app/config.py subimos a functions/
            base_path = os.path.dirname(os.path.dirname(__file__))
            abs_path = os.path.join(base_path, settings.GOOGLE_APPLICATION_CREDENTIALS)
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = abs_path
        else:
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = settings.GOOGLE_APPLICATION_CREDENTIALS

    # En Firebase Functions (Cloud Run)...
    if "K_SERVICE" in os.environ and settings.DATABASE_URL.startswith("sqlite"):
        # Asegurarnos de que el path apunte a /tmp/
        settings.DATABASE_URL = "sqlite+aiosqlite:////tmp/clearhost.db"
        
    return settings
