import asyncio
from sqlalchemy import text
from app.database import engine

async def check_tables():
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
        tables = [row[0] for row in result]
        print(f"Tablas encontradas: {tables}")
        
        if "propietarios" in tables:
            res = await conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'propietarios'"))
            cols = [f"{row[0]} ({row[1]})" for row in res]
            print(f"Columnas en 'propietarios': {cols}")
        
        if "propiedades" in tables:
            res = await conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'propiedades'"))
            cols = [f"{row[0]} ({row[1]})" for row in res]
            print(f"Columnas en 'propiedades': {cols}")

if __name__ == "__main__":
    asyncio.run(check_tables())
