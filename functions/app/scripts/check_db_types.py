import asyncio
from sqlalchemy import text
from app.database import engine

async def check_enum_types():
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT t.typname FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public'"))
        types = [row[0] for row in result.fetchall()]
        print("Tipos definidos en public:", types)

if __name__ == "__main__":
    asyncio.run(check_enum_types())
