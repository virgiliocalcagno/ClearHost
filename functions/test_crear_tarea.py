import asyncio
from app.services.task_automation import crear_tarea_para_reserva

async def run():
    print("Probando crear_tarea_para_reserva asíncronamente...")
    # I need a valid reserva_id to test with.
    # The user's screenshot showed reserving for "EMY virgilio" on 21/07/2026.
    # Let's get the latest reserva.
    from app.database import AsyncSessionLocal
    from sqlalchemy import select
    from app.models.reserva import Reserva
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Reserva).order_by(Reserva.created_at.desc()).limit(1))
        reserva = result.scalar_one_or_none()
        if reserva:
            print(f"Reserva encontrada: {reserva.id} - {reserva.nombre_huesped}")
            await crear_tarea_para_reserva(reserva.id)
            print("Tarea creada finalizada con éxito!")
        else:
            print("No hay reservas :(")

if __name__ == "__main__":
    asyncio.run(run())
