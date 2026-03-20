import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

url = "postgresql+asyncpg://neondb_owner:npg_Q8DNcmCL6ZgJ@ep-odd-salad-amnmroia-pooler.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"

engine = create_async_engine(url)

async def test():
    async with engine.begin() as conn:
        res = await conn.execute(text("SELECT 1"))
        print(res.scalar())

asyncio.run(test())
