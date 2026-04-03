"""
Servicio de Automatización de Tareas — Crea tareas operativas automáticamente.
Asigna personal disponible al detectar check-out y copia el tarifario de la propiedad.
"""

import logging
import json
import re
from datetime import date, datetime, timedelta, time
from typing import Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.reserva import Reserva
from app.models.propiedad import Propiedad
from app.models.usuario_staff import UsuarioStaff, RolStaff
from app.models.tarea_operativa import TareaOperativa, EstadoTarea, PrioridadTarea

logger = logging.getLogger(__name__)


async def obtener_staff_disponible(db, fecha: date) -> UsuarioStaff | None:
    """
    Obtener el miembro del staff con menos tareas asignadas para la fecha dada.
    """
    subquery = (
        select(
            TareaOperativa.asignado_a,
            func.count(TareaOperativa.id).label("num_tareas")
        )
        .where(TareaOperativa.fecha_programada == fecha)
        .group_by(TareaOperativa.asignado_a)
        .subquery()
    )

    result = await db.execute(
        select(UsuarioStaff)
        .outerjoin(subquery, UsuarioStaff.id == subquery.c.asignado_a)
        .where(UsuarioStaff.rol == RolStaff.STAFF_LIMPIEZA)
        .where(UsuarioStaff.activo == True)
        .order_by(func.coalesce(subquery.c.num_tareas, 0).asc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def crear_tarea_para_reserva(reserva_id: str, db: Optional[AsyncSession] = None):
    """
    Crea automáticamente una tarea operativa para una reserva.
    La fecha programada es el día del check-out.
    Hereda el tarifario de pago staff de la propiedad.
    Si se proporciona una sesión 'db', se usa esa. Si no, se crea una nueva local.
    """
    if db is None:
        async with AsyncSessionLocal() as local_db:
            return await _crear_tarea_inner(reserva_id, local_db)
    else:
        return await _crear_tarea_inner(reserva_id, db)


async def _crear_tarea_inner(reserva_id: str, db: AsyncSession):
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
        existing_result = await db.execute(
            select(TareaOperativa).where(TareaOperativa.reserva_id == reserva_id)
        )
        existing_tarea = existing_result.scalar_one_or_none()
        
        if existing_tarea:
            # Si ya existe, verificar si la fecha de checkout cambió (Sincronización Sacred)
            if existing_tarea.fecha_programada != reserva.check_out:
                logger.info(f"Actualizando fecha de tarea para reserva {reserva_id}: {existing_tarea.fecha_programada} -> {reserva.check_out}")
                existing_tarea.fecha_programada = reserva.check_out
                # También actualizar prioridad si es necesario
                hoy = date.today()
                mañana = hoy + timedelta(days=1)
                if reserva.check_out == hoy:
                    existing_tarea.prioridad = PrioridadTarea.EMERGENCIA
                elif reserva.check_out == mañana:
                    existing_tarea.prioridad = PrioridadTarea.ALTA
                else:
                    existing_tarea.prioridad = PrioridadTarea.BAJA
                
                await db.flush()
            else:
                logger.info(f"Tarea ya existe y está sincronizada para reserva {reserva_id}")
            return

        # Obtener la propiedad para copiar tarifario y checklist
        prop_result = await db.execute(
            select(Propiedad).where(Propiedad.id == reserva.propiedad_id)
        )
        propiedad = prop_result.scalar_one_or_none()

        # Generar checklist desde la plantilla de la propiedad
        checklist = None
        if propiedad and propiedad.checklist_template:
            template = propiedad.checklist_template
            if isinstance(template, str):
                try:
                    template = json.loads(template)
                except:
                    template = []
            if isinstance(template, list):
                checklist = [
                    {
                        "item": item.get("item", "") if isinstance(item, dict) else str(item),
                        "completado": False,
                        "requerido": item.get("requerido", True) if isinstance(item, dict) else True,
                    }
                    for item in template
                ]

        # Generar auditoría de activos
        auditoria = None
        if propiedad and propiedad.activos_inventario:
            inv = propiedad.activos_inventario
            if isinstance(inv, str):
                try:
                    inv = json.loads(inv)
                except:
                    inv = []
            if isinstance(inv, list):
                auditoria = [
                    {
                        "activo": item.get("activo", "") if isinstance(item, dict) else str(item),
                        "estado": "OK",
                        "cantidad_esperada": int(item.get("cantidad", 1)) if isinstance(item, dict) else 1,
                        "cantidad_encontrada": int(item.get("cantidad", 1)) if isinstance(item, dict) else 1,
                        "notas": "",
                    }
                    for item in inv
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
        # [CORRECCIÓN SQLite]: Cálculo manual de ID secuencial con fallback robusto
        res_max = await db.execute(select(func.max(TareaOperativa.id_secuencial)))
        max_id = res_max.scalar()
        if max_id is None:
            max_id = 1000
        
        tarea = TareaOperativa(
            reserva_id=reserva.id,
            propiedad_id=reserva.propiedad_id,
            id_secuencial=max_id + 1,
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
        await db.commit()

        logger.info(
            f"Tarea Operativa ({tarea.tipo_tarea}) creada el {reserva.check_out} "
            f"con pago de ${tarea.pago_al_staff} {tarea.moneda_tarea}."
        )

    except Exception as e:
        await db.rollback()
        error_msg = f"Error creando tarea para reserva {reserva_id}: {str(e)}"
        logger.error(error_msg)
        # LOG TACTICO
        try:
            with open("debug_tasks.txt", "a") as f:
                f.write(f"{datetime.now()} - {error_msg}\n")
        except: pass
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
                
                admins_res = await db.execute(select(UsuarioStaff).where(UsuarioStaff.rol == RolStaff.SUPER_ADMIN))
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
