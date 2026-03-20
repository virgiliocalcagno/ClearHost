import asyncio
from uuid import UUID
from datetime import date
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.tarea_limpieza import TareaLimpieza

async def debug():
    async with AsyncSessionLocal() as session:
        # 1. Get all tasks
        result = await session.execute(select(TareaLimpieza))
        tareas = result.scalars().all()
        print(f"Total tareas: {len(tareas)}")
        for t in tareas:
            print(f"  id={t.id}, asignado_a={repr(t.asignado_a)}, fecha={t.fecha_programada}")
            print(f"  type(asignado_a)={type(t.asignado_a)}, type(fecha)={type(t.fecha_programada)}")

        # 2. Try the same query the endpoint uses
        staff_id = UUID("01ec71ad-502e-4f0a-9508-57b60689c4b7")
        hoy = date.today()
        print(f"\nQuery: staff_id={staff_id} (type={type(staff_id)}), hoy={hoy}")
        
        result2 = await session.execute(
            select(TareaLimpieza).where(
                TareaLimpieza.asignado_a == staff_id,
                TareaLimpieza.fecha_programada == hoy,
            )
        )
        found = result2.scalars().all()
        print(f"Found with UUID: {len(found)}")

        # 3. Try with string
        result3 = await session.execute(
            select(TareaLimpieza).where(
                TareaLimpieza.asignado_a == str(staff_id),
                TareaLimpieza.fecha_programada == hoy,
            )
        )
        found3 = result3.scalars().all()
        print(f"Found with string: {len(found3)}")

        # 4. Try just fecha
        result4 = await session.execute(
            select(TareaLimpieza).where(
                TareaLimpieza.fecha_programada == hoy,
            )
        )
        found4 = result4.scalars().all()
        print(f"Found with just date: {len(found4)}")

        # 5. Try just asignado_a
        result5 = await session.execute(
            select(TareaLimpieza).where(
                TareaLimpieza.asignado_a == str(staff_id),
            )
        )
        found5 = result5.scalars().all()
        print(f"Found with just asignado_a (str): {len(found5)}")

asyncio.run(debug())
