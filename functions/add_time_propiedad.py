import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.config import get_settings

async def add_columns():
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL, isolation_level="AUTOCOMMIT")
    
    async with engine.connect() as conn:
        print("Añadiendo hora_checkin y hora_checkout a propiedades...")
        try:
            await conn.execute(
                text("ALTER TABLE propiedades ADD COLUMN hora_checkout TIME;")
            )
            print("hora_checkout añadida.")
        except Exception as e:
            print(f"La columna hora_checkout ya existe o error: {e}")
            
        try:
            await conn.execute(
                text("ALTER TABLE propiedades ADD COLUMN hora_checkin TIME;")
            )
            print("hora_checkin añadida.")
        except Exception as e:
            print(f"La columna hora_checkin ya existe o error: {e}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(add_columns())
