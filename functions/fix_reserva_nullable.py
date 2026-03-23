
import asyncio
from sqlalchemy import text
from app.database import engine

async def fix_reserva_nullable():
    print("🔄 Modificando tabla 'tareas_operativas' para permitir reserva_id NULL...")
    async with engine.begin() as conn:
        try:
            # PostgreSQL syntax to drop NOT NULL constraint
            await conn.execute(text("ALTER TABLE tareas_operativas ALTER COLUMN reserva_id DROP NOT NULL"))
            print("✅ Restricción NOT NULL eliminada de 'reserva_id'.")
        except Exception as e:
            print(f"❌ Error al modificar la columna: {e}")

if __name__ == "__main__":
    asyncio.run(fix_reserva_nullable())
