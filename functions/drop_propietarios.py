import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.config import get_settings

async def run():
    settings = get_settings()
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")
    
    engine = create_async_engine(db_url)
    async with engine.begin() as conn:
        print("Eliminando tabla propietarios si existe...")
        await conn.execute(text("DROP TABLE IF EXISTS propietarios CASCADE;"))
        print("Tabla eliminada.")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run())
