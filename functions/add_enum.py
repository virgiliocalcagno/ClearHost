import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.config import get_settings

async def add_enum():
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL, isolation_level="AUTOCOMMIT")
    
    async with engine.connect() as conn:
        print("Añadiendo nuevo valor a estadotarea...")
        try:
            from sqlalchemy import text
            await conn.execute(
                text("ALTER TYPE estadotarea ADD VALUE IF NOT EXISTS 'ASIGNADA_NO_CONFIRMADA';")
            )
            await conn.execute(
                text("ALTER TYPE estadotarea ADD VALUE IF NOT EXISTS 'ACEPTADA';")
            )
            print("Valores añadidos correctamente.")
        except Exception as e:
            print(f"Error al añadir: {e}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(add_enum())
