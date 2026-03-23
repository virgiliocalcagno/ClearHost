import asyncio
import os
import sys
from sqlalchemy import select, update

sys.path.append(os.getcwd())

from app.database import AsyncSessionLocal
from app.models.tarea_operativa import TareaOperativa
from app.models.propiedad import Propiedad

async def fix_payments():
    async with AsyncSessionLocal() as db:
        # 1. Obtener la propiedad G-44 para estar seguros de su monto actual
        prop_res = await db.execute(select(Propiedad).where(Propiedad.nombre.like("%G-44%")))
        prop = prop_res.scalar_one_or_none()
        if not prop:
            print("No se encontró la propiedad G-44")
            return
        
        monto = prop.pago_staff or 800
        moneda = prop.moneda_pago or "DOP"
        print(f"Propiedad {prop.nombre} tiene pago staff: {monto} {moneda}")
        
        # 2. Actualizar todas las tareas de esta propiedad que tengan pago 0
        await db.execute(
            update(TareaOperativa)
            .where(TareaOperativa.propiedad_id == prop.id)
            .where(TareaOperativa.pago_al_staff == 0)
            .values(pago_al_staff=monto, moneda_tarea=moneda)
        )
        await db.commit()
        print(f"Pagos actualizados a {monto} {moneda} para tareas de {prop.nombre} con pago 0.")

if __name__ == "__main__":
    asyncio.run(fix_payments())
