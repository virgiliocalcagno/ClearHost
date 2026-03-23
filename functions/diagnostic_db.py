import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

url = "postgresql+asyncpg://neondb_owner:npg_Q8DNcmCL6ZgJ@ep-odd-salad-amnmroia-pooler.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"
engine = create_async_engine(url)

async def check():
    async with engine.begin() as conn:
        tables = ["usuarios_staff", "propiedades", "reservas", "tareas_operativas", "propietarios"]
        for table in tables:
            try:
                res = await conn.execute(text(f"SELECT count(*) FROM {table}"))
                count = res.scalar()
                print(f"Tabla {table}: {count} filas")
                
                if count > 0:
                    if table == "propiedades":
                        res = await conn.execute(text("SELECT nombre, ciudad FROM propiedades"))
                        for r in res:
                            print(f"  - Propiedad: {r[0]} ({r[1]})")
                    elif table == "reservas":
                        res = await conn.execute(text("SELECT nombre_huesped, check_in FROM reservas LIMIT 5"))
                        for r in res:
                            print(f"  - Reserva: {r[0]} ({r[1]})")
            except Exception as e:
                print(f"Error en tabla {table}: {e}")

if __name__ == "__main__":
    asyncio.run(check())
