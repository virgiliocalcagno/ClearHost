import asyncio
from sqlalchemy import text
from app.database import AsyncSessionLocal

async def fix():
    async with AsyncSessionLocal() as db:
        print("Updating T-1024 to 800 DOP...")
        try:
            await db.execute(text("UPDATE tareas_operativas SET pago_al_staff = 800 WHERE id_secuencial = 1024"))
            await db.commit()
            print("Update successful.")
        except Exception as e:
            await db.rollback()
            print(f"Error during update: {e}")

if __name__ == "__main__":
    import os
    import sys
    sys.path.append(os.getcwd())
    asyncio.run(fix())
