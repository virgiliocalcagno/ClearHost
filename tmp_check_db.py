import asyncio
from sqlalchemy import select, func
from app.database import AsyncSessionLocal
from app.models.tarea_operativa import TareaOperativa
from app.models.reserva import Reserva

async def check():
    async with AsyncSessionLocal() as db:
        tasks_count = await db.execute(select(func.count(TareaOperativa.id)))
        res_count = await db.execute(select(func.count(Reserva.id)))
        print(f"Total Tasks: {tasks_count.scalar()}")
        print(f"Total Reservas: {res_count.scalar()}")
        
        # Check last 5 tasks
        last_tasks = await db.execute(select(TareaOperativa).order_by(TareaOperativa.created_at.desc()).limit(5))
        for t in last_tasks.scalars().all():
            print(f"Task ID: {t.id}, Seq: {t.id_secuencial}, Date: {t.fecha_programada}, ResID: {t.reserva_id}")

if __name__ == "__main__":
    asyncio.run(check())
