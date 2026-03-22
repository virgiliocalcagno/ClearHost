"""
ClearHost PMS — Conexión a Base de Datos.
Soporta PostgreSQL (producción) y SQLite (desarrollo local).
"""

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import JSON

from app.config import get_settings

settings = get_settings()

# Configurar engine según el tipo de BD
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    connect_args=connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Clase base para todos los modelos SQLAlchemy."""
    # Para compatibilidad SQLite: usar JSON en vez de JSONB cuando no es PostgreSQL
    type_annotation_map = {}


async def get_db() -> AsyncSession:
    """Dependency de FastAPI para obtener sesión de BD."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Crea todas las tablas (solo para desarrollo y migraciones automáticas)."""
    # Importar TODOS los modelos aquí asegura que Base.metadata los conozca antes de create_all
    import app.models
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
