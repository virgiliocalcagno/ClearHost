import asyncio
from sqlalchemy import text
from app.database import engine

async def check_tables():
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
        tables = [row[0] for row in result.fetchall()]
        print("Tablas encontradas:", tables)
        
        if "gastos_operativos" in tables:
            print("✅ La tabla 'gastos_operativos' existe.")
        else:
            print("❌ La tabla 'gastos_operativos' NO existe.")

if __name__ == "__main__":
    asyncio.run(check_tables())
