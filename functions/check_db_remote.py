
import asyncio
from sqlalchemy import text
from app.database import engine

async def check_db():
    async with engine.connect() as conn:
        try:
            res_props = await conn.execute(text("SELECT COUNT(*) FROM propiedades"))
            count_props = res_props.scalar()
            
            res_reservas = await conn.execute(text("SELECT COUNT(*) FROM reservas"))
            count_reservas = res_reservas.scalar()
            
            res_tareas = await conn.execute(text("SELECT COUNT(*) FROM tareas_operativas"))
            count_tareas = res_tareas.scalar()
            
            print(f"Propiedades: {count_props}")
            print(f"Reservas: {count_reservas}")
            print(f"Tareas: {count_tareas}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_db())
