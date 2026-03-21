import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.propiedad import Propiedad

async def check_db():
    print("Iniciando consulta a la DB...")
    try:
        async with AsyncSessionLocal() as db:
            print("--- PROPIEDADES ---")
            result = await db.execute(select(Propiedad))
            props = result.scalars().all()
            print(f"Propiedades: {len(props)}")
            for p in props:
                print(f"- {p.nombre}")

            print("\n--- STAFF ---")
            from app.models.usuario_staff import UsuarioStaff
            result = await db.execute(select(UsuarioStaff))
            staff = result.scalars().all()
            print(f"Staff: {len(staff)}")
            for s in staff:
                print(f"- {s.nombre} ({s.rol})")

            print("\n--- RESERVAS ---")
            from app.models.reserva import Reserva
            result = await db.execute(select(Reserva))
            res = result.scalars().all()
            print(f"Reservas: {len(res)}")
            
            print("\n--- TAREAS ---")
            from app.models.tarea_limpieza import TareaLimpieza
            result = await db.execute(select(TareaLimpieza))
            tasks = result.scalars().all()
            print(f"Tareas: {len(tasks)}")
            print("\n--- FIN DE CONSULTA ---")

    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(check_db())
