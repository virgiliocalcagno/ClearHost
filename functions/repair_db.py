
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.database import Base
from app.models.incidencia import Incidencia
from app.models.propiedad import Propiedad
from app.models.usuario_staff import UsuarioStaff
from app.models.reserva import Reserva
from app.models.tarea_limpieza import TareaLimpieza
from app.config import get_settings

async def repair():
    settings = get_settings()
    print(f"Connecting to {settings.DATABASE_URL}")
    engine = create_async_engine(settings.DATABASE_URL)
    
    async with engine.begin() as conn:
        print("Checking/Creating tables...")
        # Esto creará SOLO las tablas que falten
        await conn.run_sync(Base.metadata.create_all)
        print("Tables check/creation finish.")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(repair())
