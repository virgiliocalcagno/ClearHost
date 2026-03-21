import asyncio
from datetime import date
from app.database import AsyncSessionLocal
from app.models.reserva import Reserva, EstadoReserva
from sqlalchemy import select

async def fix_reserva():
    async with AsyncSessionLocal() as db:
        # Buscar por nombre y fecha de check-in que vemos en la captura
        q = select(Reserva).where(
            Reserva.nombre_huesped.ilike("%G-44 virilio%"),
            Reserva.check_in == date(2026, 3, 26),
            Reserva.check_out == date(2026, 4, 14)
        )
        result = await db.execute(q)
        reserva = result.scalar_one_or_none()
        
        if reserva:
            print(f"Encontrada: {reserva.id} - Estado actual: {reserva.estado}")
            reserva.estado = EstadoReserva.CONFIRMADA
            await db.commit()
            print("✅ Estado corregido a CONFIRMADA")
        else:
            print("❌ No se encontró la reserva con ese nombre y fecha.")

if __name__ == "__main__":
    asyncio.run(fix_reserva())
