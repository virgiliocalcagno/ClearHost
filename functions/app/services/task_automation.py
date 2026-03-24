"""
Servicio de Automatización de Tareas — Crea tareas operativas automáticamente.
Asigna personal disponible al detectar check-out y copia el tarifario de la propiedad.
"""

import logging
from datetime import date
from sqlalchemy import select, func
from app.database import AsyncSessionLocal
from app.models.reserva import Reserva
from app.models.propiedad import Propiedad
from app.models.usuario_staff import UsuarioStaff, RolStaff
from app.models.tarea_operativa import TareaOperativa, EstadoTarea, PrioridadTarea
from datetime import datetime, timedelta, time

logger = logging.getLogger(__name__)


async def obtener_staff_disponible(db, fecha: date) -> UsuarioStaff | None:
    """
    Obtener el miembro del staff con menos tareas asignadas para la fecha dada.
    """
    subquery = (
        select(
            TareaOperativa.asignado_a,
            func.count(TareaOperativa.id).label("num_tareas"),
        )
        .where(TareaOperativa.fecha_programada == fecha)
        .group_by(TareaOperativa.asignado_a)
        .subquery()
    )

    result = await db.execute(
        select(UsuarioStaff)
        .outerjoin(subquery, UsuarioStaff.id == subquery.c.asignado_a)
        .where(
            UsuarioStaff.rol == RolStaff.STAFF,
            UsuarioStaff.disponible == True,
        )
        .order_by(func.coalesce(subquery.c.num_tareas, 0).asc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def crear_tarea_para_reserva(reserva_id: str):
    """
    Crea automáticamente una tarea operativa para una reserva.
    La fecha programada es el día del check-out.
    Hereda el tarifario de pago staff de la propiedad.
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
                select(TareaOperativa).where(TareaOperativa.reserva_id == reserva_id)
            )
            if existing.scalar_one_or_none():
                logger.info(f"Ya existe tarea para reserva {reserva_id}")
                return

            # Obtener la propiedad para copiar tarifario y checklist
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

            # Generar auditoría de activos
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

            # ── Lógica de Prioridad ──
            hoy = date.today()
            mañana = hoy + timedelta(days=1)
            
            if reserva.check_out == hoy:
                prioridad = PrioridadTarea.EMERGENCIA
            elif reserva.check_out == mañana:
                prioridad = PrioridadTarea.ALTA
            else:
                prioridad = PrioridadTarea.BAJA

            # Crear la tarea operativa
            # Heredar pago_al_staff desde el tarifario de la propiedad
            tarea = TareaOperativa(
                reserva_id=reserva.id,
                propiedad_id=reserva.propiedad_id,
                tipo_tarea="LIMPIEZA",
                asignado_a=None,
                fecha_programada=reserva.check_out,
                hora_inicio=propiedad.hora_checkout if propiedad and propiedad.hora_checkout else time(11, 0),
                estado=EstadoTarea.PENDIENTE,
                prioridad=prioridad,
                pago_al_staff=propiedad.pago_staff if propiedad else 0.0,
                moneda_tarea=propiedad.moneda_pago if propiedad else "MXN",
                fecha_asignacion=None,
                checklist=checklist,
                auditoria_activos=auditoria,
                fotos_antes=[],
                fotos_despues=[],
                requiere_lavado_ropa=True,
            )
            db.add(tarea)
            await db.flush()
            await db.refresh(tarea)
            await db.commit()

            logger.info(
                f"Tarea Operativa ({tarea.tipo_tarea}) creada el {reserva.check_out} "
                f"con pago de ${tarea.pago_al_staff} {tarea.moneda_tarea}."
            )

            # Notificar Real-Time si hay clientes conectados (Web, App)
            from app.utils.websocket_manager import manager
            await manager.broadcast('{"evento": "nueva_tarea"}')

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
            select(TareaOperativa).where(
                TareaOperativa.estado == EstadoTarea.ASIGNADA_NO_CONFIRMADA,
                TareaOperativa.fecha_asignacion <= timeout_limit
            )
        )
        tareas_olvidadas = result.scalars().all()

        for tarea in tareas_olvidadas:
            tarea.asignado_a = None
            tarea.estado = EstadoTarea.PENDIENTE
            tarea.fecha_asignacion = None
            tarea.prioridad = PrioridadTarea.EMERGENCIA
            
            try:
                from app.services.notifications import send_push_notification
                prop_res = await db.execute(select(Propiedad).where(Propiedad.id == tarea.propiedad_id))
                propiedad = prop_res.scalar_one_or_none()
                
                if propiedad and propiedad.manager_id:
                    mgr_res = await db.execute(select(UsuarioStaff).where(UsuarioStaff.id == propiedad.manager_id))
                    manager = mgr_res.scalar_one_or_none()
                    if manager and manager.fcm_token:
                        await send_push_notification(
                            manager.fcm_token,
                            "⚠️ ALERTA: Tarea no aceptada",
                            f"La tarea en {propiedad.nombre} no fue aceptada a tiempo y ha sido liberada.",
                            {"tipo": "ALERTA_TIMEOUT", "tarea_id": tarea.id}
                        )
                
                # Notificar a SUPER_ADMIN y al MANAGER_LOCAL de la zona de la propiedad
                from sqlalchemy import or_
                admins_res = await db.execute(
                    select(UsuarioStaff).where(
                        (UsuarioStaff.fcm_token.isnot(None)) &
                        (
                            (UsuarioStaff.rol == RolStaff.SUPER_ADMIN) |
                            ((UsuarioStaff.rol == RolStaff.MANAGER_LOCAL) & (UsuarioStaff.zona_id == propiedad.zona_id if propiedad else None))
                        )
                    )
                )
                admins = admins_res.scalars().all()
                for admin in admins:
                    if admin.fcm_token:
                        await send_push_notification(
                            admin.fcm_token,
                            "🚨 EMERGENCIA: Tarea Huérfana",
                            f"Timeout en {propiedad.nombre if propiedad else 'Propiedad'}. Staff desasignado.",
                            {"tipo": "ALERTA_GLOBAL", "tarea_id": tarea.id}
                        )
            except Exception as e:
                logger.error(f"Error en notificaciones de timeout: {e}")

        if tareas_olvidadas:
            await db.commit()
