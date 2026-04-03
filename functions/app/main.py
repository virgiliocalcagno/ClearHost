"""
ClearHost PMS — Entry Point.
FastAPI application con todos los routers, CORS, y scheduler en startup.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.routers import propiedades, staff, reservas, tareas, incidencias, propietarios, zonas, gastos, ocr
from app.services.scheduler import setup_scheduler, shutdown_scheduler
from app.utils.websocket_manager import manager
from fastapi import WebSocket

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

# Middleware para confiar en los headers de proxy (Firebase Hosting)
@app.middleware("http")
async def trust_proxy_headers(request, call_next):
    """
    Firebase Hosting envía X-Forwarded-Proto y X-Forwarded-Host.
    Este middleware asegura que FastAPI genere URLs de redirección (ej. trailing slashes)
    usando HTTPS y el dominio correcto del hosting.
    """
    # Confiar en el esquema (http/https)
    proto = request.headers.get("x-forwarded-proto")
    if proto:
        request.scope["scheme"] = proto
    
    # Confiar en el host
    host = request.headers.get("x-forwarded-host")
    if host:
        # Reemplazar el header de host en el scope para que Starlette lo use
        new_headers = []
        for name, value in request.scope["headers"]:
            if name.lower() == b"host":
                new_headers.append((b"host", host.encode()))
            else:
                new_headers.append((name, value))
        request.scope["headers"] = new_headers

    response = await call_next(request)
    return response

# Firebase Hosting ya maneja HTTPS termination

# CORS — Middleware Manual Ultra-Robusto (Infalible para Errores 500/422)
@app.middleware("http")
async def add_cors_header(request: Request, call_next):
    # Manejar Preflight (OPTIONS)
    if request.method == "OPTIONS":
        origin = request.headers.get("Origin", "*")
        return JSONResponse(
            content="OK",
            headers={
                "Access-Control-Allow-Origin": origin if origin != "null" else "*",
                "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
                "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
                "Access-Control-Allow-Credentials": "true",
            },
        )

    response = await call_next(request)
    origin = request.headers.get("Origin", "*")
    response.headers["Access-Control-Allow-Origin"] = origin if origin != "null" else "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS, PUT, DELETE"
    response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept"
    return response

# Registrar routers
app.include_router(propiedades.router, prefix="/api")
app.include_router(staff.router, prefix="/api")
app.include_router(reservas.router, prefix="/api")
app.include_router(tareas.router, prefix="/api")
app.include_router(incidencias.router, prefix="/api")
app.include_router(propietarios.router, prefix="/api")
app.include_router(gastos.router, prefix="/api")
app.include_router(ocr.router)
app.include_router(zonas.router)  # ya tiene prefix /api/zonas internamente


@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": "1.0.1-PRO",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.websocket("/ws/actualizaciones")
async def websocket_tareas_endpoint(websocket: WebSocket):
    """Endpoint para notificaciones de nuevas tareas en tiempo real."""
    await manager.connect(websocket)
    try:
        while True:
            # Mantener la conexión abierta
            await websocket.receive_text()
    except Exception:
        manager.disconnect(websocket)


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
