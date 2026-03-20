"""
ClearHost PMS — Entry Point.
FastAPI application con todos los routers, CORS, y scheduler en startup.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import init_db
from app.routers import propiedades, staff, reservas, tareas
from app.services.scheduler import setup_scheduler, shutdown_scheduler

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup y shutdown de la aplicación."""
    # STARTUP
    logger.info(f"🚀 Iniciando {settings.APP_NAME}...")

    # Crear tablas siempre (crea solo si no existen)
    await init_db()
    logger.info("✅ Base de datos inicializada")

    # Arrancar cron jobs
    setup_scheduler()
    logger.info("✅ Scheduler configurado")

    # Sincronizar iCal al arrancar para captar nuevas reservas inmediatamente
    import asyncio
    asyncio.create_task(_startup_sync())

    yield

    # SHUTDOWN
    shutdown_scheduler()
    logger.info("👋 Aplicación detenida")


async def _startup_sync():
    """Sincronización iCal inicial al arrancar."""
    import asyncio
    await asyncio.sleep(5)  # Esperar a que DB esté lista
    try:
        from app.services.ical_sync import sync_all_properties
        logger.info("🔄 Sincronización iCal inicial...")
        await sync_all_properties()
        logger.info("✅ Sincronización iCal inicial completada")
    except Exception as e:
        logger.error(f"Error en sync iCal inicial: {e}")


# Crear app FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Sistema de gestión de propiedades vacacionales. "
        "Sincronización iCal, automatización de limpieza, "
        "y app móvil para staff."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — permitir conexiones desde frontend y app móvil
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "https://clearhost-c8919.web.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(propiedades.router, prefix="/api")
app.include_router(staff.router, prefix="/api")
app.include_router(reservas.router, prefix="/api")
app.include_router(tareas.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.post("/api/sync-ical-all")
async def sync_all_ical_now():
    """Disparar sincronización iCal de TODAS las propiedades ahora."""
    import asyncio
    asyncio.create_task(_run_sync_all())
    return {"message": "Sincronización iCal de todas las propiedades iniciada"}


async def _run_sync_all():
    try:
        from app.services.ical_sync import sync_all_properties
        await sync_all_properties()
    except Exception as e:
        logger.error(f"Error en sync-all: {e}")
