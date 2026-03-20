"""
Script para crear tareas de limpieza faltantes para reservas existentes.
Busca todas las reservas CONFIRMADAS que NO tienen una tarea asociada
y les crea una.
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import engine
from app.models.reserva import Reserva, EstadoReserva
from app.models.tarea_limpieza import TareaLimpieza
from app.services.task_automation import crear_tarea_para_reserva


async def fix_missing_tasks():
    async with AsyncSession(engine) as session:
        # Obtener todas las reservas confirmadas
        result = await session.execute(
            select(Reserva).where(Reserva.estado == EstadoReserva.CONFIRMADA)
        )
        reservas = result.scalars().all()
        print(f"📋 Total reservas confirmadas: {len(reservas)}")

        sin_tarea = []
        for reserva in reservas:
            # Verificar si tiene tarea asociada
            tarea_result = await session.execute(
                select(TareaLimpieza).where(TareaLimpieza.reserva_id == reserva.id)
            )
            tarea = tarea_result.scalar_one_or_none()
            if not tarea:
                sin_tarea.append(reserva)

        print(f"⚠️  Reservas SIN tarea de limpieza: {len(sin_tarea)}")

        if not sin_tarea:
            print("✅ Todas las reservas ya tienen tareas asignadas.")
            return

        # Crear tareas faltantes
        for reserva in sin_tarea:
            print(f"  🔧 Creando tarea para: {reserva.nombre_huesped} "
                  f"({reserva.check_in} → {reserva.check_out})")
            try:
                await crear_tarea_para_reserva(reserva.id)
                print(f"     ✅ Tarea creada exitosamente")
            except Exception as e:
                print(f"     ❌ Error: {e}")

    print(f"\n✅ Proceso completado: {len(sin_tarea)} tareas creadas")


asyncio.run(fix_missing_tasks())
