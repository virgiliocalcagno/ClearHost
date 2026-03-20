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

    # Crear tablas (solo en desarrollo)
    if settings.DEBUG:
        await init_db()
        logger.info("✅ Base de datos inicializada")

    # Arrancar cron jobs
    setup_scheduler()
    logger.info("✅ Scheduler configurado")

    yield

    # SHUTDOWN
    shutdown_scheduler()
    logger.info("👋 Aplicación detenida")


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

# Servir archivos subidos (fotos de evidencia)
import os
upload_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

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

@app.get("/api/seed_db")
@app.get("/seed_db")
async def seed_db_fastapi(db: "AsyncSession" = __import__("fastapi").Depends(__import__("app.database", fromlist=["get_db"]).get_db)):
    from sqlalchemy import select
    from app.models.usuario_staff import UsuarioStaff, RolStaff
    import bcrypt
    from app.database import init_db
    
    # Crear tablas SQLite primero
    await init_db()

    emails = ["admin@clearhost.com", "virgiliocalcagno@gmail.com"]
    creados = []
    
    for idx, email in enumerate(emails):
        result = await db.execute(select(UsuarioStaff).where(UsuarioStaff.email == email))
        user = result.scalar_one_or_none()
        if not user:
            # Contraseña por defecto: admin123
            hashed = bcrypt.hashpw("admin123".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            nuevo = UsuarioStaff(
                nombre="Admin ClearHost" if "admin" in email else "Virgilio",
                documento=f"V-{idx}00000",
                email=email,
                password_hash=hashed,
                telefono="+52 55 0000 0000",
                rol=RolStaff.ADMIN,
            )
            db.add(nuevo)
            creados.append(email)
            
    await db.commit()
    return {"status": "ok", "message": f"Base de datos preparada. Nuevos creados: {creados}", "nota": "Usa la clave: admin123"}
