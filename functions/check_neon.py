import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

url = "postgresql+asyncpg://neondb_owner:npg_Q8DNcmCL6ZgJ@ep-odd-salad-amnmroia-pooler.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"
engine = create_async_engine(url)

async def check():
    async with engine.begin() as conn:
        try:
            res = await conn.execute(text("SELECT email, documento FROM usuarios_staff"))
            rows = res.fetchall()
            print("Usuarios en BD:")
            for r in rows:
                print(f"- {r[0]} ({r[1]})")
        except Exception as e:
            print("Error (tabla no existe tal vez):", e)

asyncio.run(check())
