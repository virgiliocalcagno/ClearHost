"""
Servicio de Notificaciones Push — Firebase Cloud Messaging.
Envía notificaciones al admin y staff.
"""

import logging
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.tarea_limpieza import TareaLimpieza
from app.models.usuario_staff import UsuarioStaff, RolStaff
from app.models.propiedad import Propiedad
from app.database import AsyncSessionLocal

logger = logging.getLogger(__name__)

# Firebase Admin SDK — inicialización lazy
_firebase_initialized = False


def _init_firebase():
    """Inicializa Firebase Admin SDK si no está inicializado."""
    global _firebase_initialized
    if _firebase_initialized:
        return

    try:
        import firebase_admin
        from firebase_admin import credentials
        from app.config import get_settings

        settings = get_settings()
        import os
        if os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred)
            _firebase_initialized = True
            logger.info("Firebase Admin SDK inicializado correctamente")
        else:
            logger.warning(
                f"Archivo de credenciales Firebase no encontrado: "
                f"{settings.FIREBASE_CREDENTIALS_PATH}. "
                f"Push notifications deshabilitadas."
            )
    except Exception as e:
        logger.error(f"Error inicializando Firebase: {e}")


async def send_push_notification(fcm_token: str, title: str, body: str, data: dict = None):
    """Envía una notificación push via FCM a un dispositivo específico."""
    _init_firebase()

    if not _firebase_initialized:
        logger.warning("Firebase no inicializado. Notificación no enviada.")
        return False

    try:
        from firebase_admin import messaging

        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            token=fcm_token,
        )
        response = messaging.send(message)
        logger.info(f"Push enviado: {response}")
        return True
    except Exception as e:
        logger.error(f"Error enviando push notification: {e}")
        return False


async def notificar_tarea_completada(tarea: TareaLimpieza, db: AsyncSession):
    """
    Notifica a TODOS los admins cuando un empleado marca una propiedad como 'Clean & Ready'.
    Permite autorizar el siguiente check-in.
    """
    # Obtener todos los admins con FCM token
    result = await db.execute(
        select(UsuarioStaff).where(
            UsuarioStaff.rol == RolStaff.ADMIN,
            UsuarioStaff.fcm_token.isnot(None),
        )
    )
    admins = result.scalars().all()

    # Obtener nombre de la propiedad
    prop_nombre = "Propiedad"
    if tarea.propiedad:
        prop_nombre = tarea.propiedad.nombre

    # Obtener nombre del staff que completó
    staff_nombre = "Staff"
    if tarea.asignado:
        staff_nombre = tarea.asignado.nombre

    title = "🏠 ¡Propiedad Lista!"
    body = f"{prop_nombre} marcada como 'Clean & Ready' por {staff_nombre}. Puedes autorizar el check-in."

    data = {
        "type": "TAREA_COMPLETADA",
        "tarea_id": str(tarea.id),
        "propiedad_id": str(tarea.propiedad_id),
    }

    for admin in admins:
        await send_push_notification(admin.fcm_token, title, body, data)

    logger.info(f"Notificación 'Clean & Ready' enviada a {len(admins)} admin(s)")


async def notificar_nueva_tarea(tarea: TareaLimpieza, staff: UsuarioStaff, propiedad: Propiedad):
    """Notifica al staff cuando se le asigna una nueva tarea."""
    if not staff.fcm_token:
        return

    title = "📋 Nueva Tarea Asignada"
    body = (
        f"Limpieza en {propiedad.nombre} programada para el {tarea.fecha_programada}. "
        f"{'⚠️ Incluye lavado de ropa.' if tarea.requiere_lavado_ropa else ''}"
    )
    data = {
        "type": "NUEVA_TAREA",
        "tarea_id": str(tarea.id),
        "propiedad_id": str(propiedad.id),
    }

    await send_push_notification(staff.fcm_token, title, body, data)


async def enviar_recordatorios_manana():
    """
    Cron Job diario — Envía recordatorios al staff sobre las unidades
    que deben preparar al día siguiente, incluyendo lavado de ropa.
    """
    from datetime import date, timedelta

    manana = date.today() + timedelta(days=1)

    async with AsyncSessionLocal() as db:
        # Obtener tareas de mañana
        result = await db.execute(
            select(TareaLimpieza).where(
                TareaLimpieza.fecha_programada == manana,
                TareaLimpieza.estado.in_(["PENDIENTE", "EN_PROGRESO"]),
                TareaLimpieza.asignado_a.isnot(None),
            )
        )
        tareas = result.scalars().all()

        if not tareas:
            logger.info("No hay tareas para mañana")
            return

        # Agrupar por staff
        tareas_por_staff = {}
        for tarea in tareas:
            staff_id = tarea.asignado_a
            if staff_id not in tareas_por_staff:
                tareas_por_staff[staff_id] = []
            tareas_por_staff[staff_id].append(tarea)

        for staff_id, staff_tareas in tareas_por_staff.items():
            # Obtener staff
            staff_result = await db.execute(
                select(UsuarioStaff).where(UsuarioStaff.id == staff_id)
            )
            staff = staff_result.scalar_one_or_none()
            if not staff or not staff.fcm_token:
                continue

            num_tareas = len(staff_tareas)
            con_lavado = sum(1 for t in staff_tareas if t.requiere_lavado_ropa)

            title = f"📅 Mañana tienes {num_tareas} tarea(s)"
            body = f"Prepárate para mañana {manana.strftime('%d/%m')}."
            if con_lavado > 0:
                body += f" 🧺 {con_lavado} requieren lavado de ropa (sábanas/toallas)."

            data = {
                "type": "RECORDATORIO_MANANA",
                "fecha": str(manana),
                "num_tareas": str(num_tareas),
            }

            await send_push_notification(staff.fcm_token, title, body, data)

        logger.info(f"Recordatorios enviados a {len(tareas_por_staff)} staff(s)")


async def alertar_admins_tareas_pendientes():
    """
    Cron Job diario — Alerta a admins sobre tareas pendientes del día.
    Se ejecuta temprano para que puedan tomar acción.
    """
    from datetime import date

    hoy = date.today()

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(TareaLimpieza).where(
                TareaLimpieza.fecha_programada == hoy,
                TareaLimpieza.estado == "PENDIENTE",
            )
        )
        tareas_pendientes = result.scalars().all()

        if not tareas_pendientes:
            return

        sin_asignar = sum(1 for t in tareas_pendientes if t.asignado_a is None)

        # Notificar admins
        admin_result = await db.execute(
            select(UsuarioStaff).where(
                UsuarioStaff.rol == RolStaff.ADMIN,
                UsuarioStaff.fcm_token.isnot(None),
            )
        )
        admins = admin_result.scalars().all()

        title = f"⚠️ {len(tareas_pendientes)} tareas pendientes hoy"
        body = f"Hay {len(tareas_pendientes)} propiedades por limpiar hoy."
        if sin_asignar > 0:
            body += f" 🚨 {sin_asignar} SIN ASIGNAR."

        for admin in admins:
            await send_push_notification(admin.fcm_token, title, body, {
                "type": "ALERTA_PENDIENTES",
                "num_pendientes": str(len(tareas_pendientes)),
            })
