import asyncio
import json
from datetime import date, datetime, timedelta, time
from app.database import AsyncSessionLocal
from app.models.reserva import Reserva, EstadoReserva
from app.models.propiedad import Propiedad
from app.models.tarea_operativa import TareaOperativa, EstadoTarea, PrioridadTarea
from app.services.task_automation import crear_tarea_para_reserva, obtener_staff_disponible
from sqlalchemy import select

async def resync():
    print("🚀 Iniciando Re-sincronización de Tareas...")
    async with AsyncSessionLocal() as db:
        res_result = await db.execute(select(Reserva).where(Reserva.estado == EstadoReserva.CONFIRMADA))
        reservas = res_result.scalars().all()
        print(f"Total Reservas: {len(reservas)}")
        
        for res in reservas:
            # Check if task already exists
            task_result = await db.execute(select(TareaOperativa).where(TareaOperativa.reserva_id == res.id))
            if task_result.scalar_one_or_none():
                # print(f"Reserva {res.id} ya tiene tarea.")
                continue
            
            print(f"🔄 Intentando crear tarea para Reserva {res.id} (Huésped: {res.nombre_huesped})...")
            try:
                # Instead of calling the function that might have hidden issues, let's inline a check
                # or just use the function and catch the error here
                await crear_tarea_para_reserva(res.id)
                print(f"✅ Tarea creada para {res.nombre_huesped}")
            except Exception as e:
                print(f"❌ Error para {res.nombre_huesped}: {str(e)}")

if __name__ == "__main__":
    asyncio.run(resync())
