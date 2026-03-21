"""
Servicio de Automatización de Tareas — Crea tareas de limpieza automáticamente.
Asigna personal disponible al detectar check-out.
"""

import logging
from datetime import date

from sqlalchemy import select, func

from app.database import AsyncSessionLocal
from app.models.reserva import Reserva
from app.models.propiedad import Propiedad
from app.models.usuario_staff import UsuarioStaff, RolStaff
from app.models.tarea_limpieza import TareaLimpieza, EstadoTarea, PrioridadTarea
from datetime import datetime, timedelta, time

logger = logging.getLogger(__name__)


async def obtener_staff_disponible(db, fecha: date) -> UsuarioStaff | None:
    """
    Obtener el miembro del staff de limpieza con menos tareas asignadas
    para la fecha dada (round-robin por carga de trabajo).
    """
    # Subconsulta: contar tareas por staff para la fecha
    subquery = (
        select(
            TareaLimpieza.asignado_a,
            func.count(TareaLimpieza.id).label("num_tareas"),
        )
        .where(TareaLimpieza.fecha_programada == fecha)
        .group_by(TareaLimpieza.asignado_a)
        .subquery()
    )

    # Staff disponible con rol LIMPIEZA, ordenado por menos tareas
    result = await db.execute(
        select(UsuarioStaff)
        .outerjoin(subquery, UsuarioStaff.id == subquery.c.asignado_a)
        .where(
            UsuarioStaff.rol == RolStaff.LIMPIEZA,
            UsuarioStaff.disponible == True,
        )
        .order_by(func.coalesce(subquery.c.num_tareas, 0).asc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def crear_tarea_para_reserva(reserva_id: str):
    """
    Crea automáticamente una tarea de limpieza para una reserva.
    La fecha programada es el día del check-out.
    Asigna al personal disponible con menos carga de trabajo.
    """
    async with AsyncSessionLocal() as db:
        try:
            # Obtener la reserva
            result = await db.execute(
                select(Reserva).where(Reserva.id == reserva_id)
            )
            reserva = result.scalar_one_or_none()
            if not reserva:
                logger.error(f"Reserva {reserva_id} no encontrada")
                return

            # Verificar que no exista ya una tarea para esta reserva
            existing = await db.execute(
                select(TareaLimpieza).where(TareaLimpieza.reserva_id == reserva_id)
            )
            if existing.scalar_one_or_none():
                logger.info(f"Ya existe tarea para reserva {reserva_id}")
                return

            # Obtener la propiedad para copiar su checklist template
            prop_result = await db.execute(
                select(Propiedad).where(Propiedad.id == reserva.propiedad_id)
            )
            propiedad = prop_result.scalar_one_or_none()

            # Generar checklist desde la plantilla de la propiedad
            checklist = None
            if propiedad and propiedad.checklist_template:
                checklist = [
                    {
                        "item": item.get("item", ""),
                        "completado": False,
                        "requerido": item.get("requerido", True),
                    }
                    for item in propiedad.checklist_template
                ]

            # Generar auditoría de activos desde el inventario de la propiedad
            auditoria = None
            if propiedad and propiedad.activos_inventario:
                auditoria = [
                    {
                        "activo": item.get("activo", ""),
                        "estado": "OK",
                        "cantidad_esperada": item.get("cantidad", 1),
                        "cantidad_encontrada": item.get("cantidad", 1),
                        "notas": "",
                    }
                    for item in propiedad.activos_inventario
                ]

            # Buscar staff disponible (round-robin)
            staff = await obtener_staff_disponible(db, reserva.check_out)

            estado = EstadoTarea.ASIGNADA_NO_CONFIRMADA if staff else EstadoTarea.PENDIENTE
            fecha_asignacion = datetime.utcnow() if staff else None
            
            # Calcular prioridad basada en HORAS faltantes para el check-in (llegada del huésped)
            ahora = datetime.utcnow()
            
            # Usar la hora de check-in de la propiedad o 15:00 por defecto
            h_in = propiedad.hora_checkin if propiedad and propiedad.hora_checkin else time(15, 0)
            check_in_datetime = datetime.combine(reserva.check_in, h_in)
            
            horas_faltantes = (check_in_datetime - ahora).total_seconds() / 3600.0

            if horas_faltantes <= 12:
                prioridad = PrioridadTarea.EMERGENCIA
            elif horas_faltantes <= 24:
                prioridad = PrioridadTarea.ALTA
            elif horas_faltantes <= 48:
                prioridad = PrioridadTarea.MEDIA
            else:
                prioridad = PrioridadTarea.BAJA

            # Crear la tarea de limpieza para preparar la llegada del huésped
            tarea = TareaLimpieza(
                reserva_id=reserva.id,
                propiedad_id=reserva.propiedad_id,
                asignado_a=staff.id if staff else None,
                fecha_programada=reserva.check_in,
                hora_inicio=propiedad.hora_checkout if propiedad.hora_checkout else time(11, 0),
                estado=estado,
                prioridad=prioridad,
                fecha_asignacion=fecha_asignacion,
                checklist=checklist,
                auditoria_activos=auditoria,
                fotos_antes=[],
                fotos_despues=[],
                requiere_lavado_ropa=True,
            )
            db.add(tarea)
            await db.commit()

            asignado_nombre = staff.nombre if staff else "SIN ASIGNAR"
            logger.info(
                f"Tarea de limpieza creada para {reserva.nombre_huesped} "
                f"el {reserva.check_out} → Asignada a: {asignado_nombre}"
            )

            # Notificar al staff asignado
            if staff and staff.fcm_token:
                try:
                    from app.services.notifications import notificar_nueva_tarea
                    await notificar_nueva_tarea(tarea, staff, propiedad)
                except Exception as e:
                    logger.error(f"Error enviando notificación al staff: {e}")

        except Exception as e:
            await db.rollback()
            logger.error(f"Error creando tarea para reserva {reserva_id}: {e}")
            raise


async def check_assignment_timeouts():
    """Worker timeout: Quita tareas olvidadas por staff > 2hr y notifica al admin."""
    logger.info("Verificando timeouts de tareas asignadas no confirmadas...")
    async with AsyncSessionLocal() as db:
        timeout_limit = datetime.utcnow() - timedelta(hours=2)
        
        result = await db.execute(
            select(TareaLimpieza).where(
                TareaLimpieza.estado == EstadoTarea.ASIGNADA_NO_CONFIRMADA,
                TareaLimpieza.fecha_asignacion <= timeout_limit
            )
        )
        tareas_olvidadas = result.scalars().all()

        for tarea in tareas_olvidadas:
            old_staff_id = tarea.asignado_a
            tarea.asignado_a = None
            tarea.estado = EstadoTarea.PENDIENTE
            tarea.fecha_asignacion = None
            tarea.prioridad = PrioridadTarea.EMERGENCIA # Se vuelve emergencia al volver a la bolsa
            logger.warning(f"TIMEOUT: Tarea {tarea.id} liberada por inactividad de {old_staff_id}.")
            
            # TODO: Notificación push de emergencia al administrador aquí
            
        if tareas_olvidadas:
            await db.commit()
