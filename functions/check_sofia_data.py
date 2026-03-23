import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.tarea_operativa import TareaOperativa
from app.models.usuario_staff import UsuarioStaff
from app.models.adelanto_staff import AdelantoStaff

async def check():
    async with AsyncSessionLocal() as db:
        # Find Sofia
        res = await db.execute(select(UsuarioStaff).where(UsuarioStaff.email == 'sofia@gmail.com'))
        sofia = res.scalar_one_or_none()
        if not sofia:
            print("Sofia not found")
            return
        
        print(f"Sofia ID: {sofia.id}")
        
        # Check Task 1024
        res = await db.execute(select(TareaOperativa).where(TareaOperativa.id_secuencial == 1024))
        t1024 = res.scalar_one_or_none()
        if t1024:
            print(f"Task 1024 - Estado: {t1024.estado}, Pago: {t1024.pago_al_staff}, Asignado: {t1024.asignado_a}")
        else:
            print("Task 1024 not found")

        # Check Task 1016
        res = await db.execute(select(TareaOperativa).where(TareaOperativa.id_secuencial == 1016))
        t1016 = res.scalar_one_or_none()
        if t1016:
            print(f"Task 1016 - Estado: {t1016.estado}, Pago: {t1016.pago_al_staff}, Asignado: {t1016.asignado_a}")

        # Check Billetera components
        # Verified tasks for Sofia
        res = await db.execute(select(TareaOperativa).where(
            TareaOperativa.asignado_a == str(sofia.id),
            TareaOperativa.estado == 'VERIFICADA'
        ))
        verified_tasks = res.scalars().all()
        print(f"Verified tasks count: {len(verified_tasks)}")
        for vt in verified_tasks:
            print(f"  - T-{vt.id_secuencial}: {vt.pago_al_staff}")
        
        total_ganado = sum(vt.pago_al_staff for vt in verified_tasks)
        print(f"Total Ganado: {total_ganado}")

if __name__ == "__main__":
    import os
    import sys
    sys.path.append(os.getcwd())
    asyncio.run(check())
