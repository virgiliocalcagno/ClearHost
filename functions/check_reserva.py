import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.reserva import Reserva

async def check():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Reserva).where(Reserva.nombre_huesped.ilike("%G-44 virilio%"))
        )
        reservas = result.scalars().all()
        
        if not reservas:
            print("No se encontraron reservas con ese nombre.")
        for r in reservas:
            print(f"Huésped: {r.nombre_huesped} | Fechas: {r.check_in} -> {r.check_out} | Estado: {r.estado}")

if __name__ == "__main__":
    asyncio.run(check())