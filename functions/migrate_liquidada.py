import asyncio
from sqlalchemy import text
from app.database import AsyncSessionLocal

async def migrate():
    async with AsyncSessionLocal() as db:
        print("Adding 'liquidada' column to 'tareas_operativas'...")
        try:
            await db.execute(text("ALTER TABLE tareas_operativas ADD COLUMN IF NOT EXISTS liquidada BOOLEAN DEFAULT FALSE"))
            await db.commit()
            print("Migration successful.")
        except Exception as e:
            await db.rollback()
            print(f"Error during migration: {e}")
        
        # Data fix for T-1024 (Sofia's task)
        print("Updating T-1024 with a representative payment (2500 DOP)...")
        try:
            await db.execute(text("UPDATE tareas_operativas SET pago_al_staff = 2500 WHERE id_secuencial = 1024"))
            await db.commit()
            print("Update successful.")
        except Exception as e:
            await db.rollback()
            print(f"Error during update: {e}")

if __name__ == "__main__":
    import os
    import sys
    sys.path.append(os.getcwd())
    asyncio.run(migrate())
