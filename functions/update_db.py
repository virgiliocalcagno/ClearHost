import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.config import get_settings

async def update_schema():
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL)
    
    async with engine.begin() as conn:
        print("Modificando tabla tareas_limpieza...")
        try:
            await conn.execute(
                text("ALTER TABLE tareas_limpieza ADD COLUMN prioridad VARCHAR(20) DEFAULT 'BAJA' NOT NULL;")
            )
            print("Columna prioridad añadida.")
        except Exception as e:
            print(f"La columna prioridad ya existe o error: {e}")
            
        try:
            await conn.execute(
                text("ALTER TABLE tareas_limpieza ADD COLUMN fecha_asignacion TIMESTAMP;")
            )
            print("Columna fecha_asignacion añadida.")
        except Exception as e:
            print(f"La columna fecha_asignacion ya existe o error: {e}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(update_schema())
