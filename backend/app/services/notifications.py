"""
Servicio de Notificaciones Push — Firebase Cloud Messaging.
Envía notificaciones al admin y staff.
"""

import logging
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.tarea_operativa import TareaOperativa
from app.models.usuario_staff import UsuarioStaff, RolStaff
from app.models.propiedad import Propiedad
from app.database import AsyncSessionLocal

logger = logging.getLogger(__name__)

# Firebase Admin SDK — inicialización lazy
_firebase_initialized = False


def _init_firebase():
    """Inicializa Firebase Admin SDK si no está inicializado."""
    global _firebase_initialized
    
    import firebase_admin
    from firebase_admin import credentials
    from app.config import get_settings
    import os

    # Verificar si ya existe una app inicializada por otro módulo (ej. main.py)
    if firebase_admin._apps:
        _firebase_initialized = True
        return

    if _firebase_initialized:
        return

    try:
        settings = get_settings()
        
        # En Cloud Functions de Firebase, inicializar sin argumentos 
        if "FIREBASE_CONFIG" in os.environ or "K_SERVICE" in os.environ:
            firebase_admin.initialize_app(options={
                "storageBucket": settings.FB_STORAGE_BUCKET
            })
            _firebase_initialized = True
            logger.info("Firebase Admin SDK inicializado")
            return

        if settings.SERVICE_ACCOUNT_PATH and os.path.exists(settings.SERVICE_ACCOUNT_PATH):
            cred = credentials.Certificate(settings.SERVICE_ACCOUNT_PATH)
            firebase_admin.initialize_app(cred, options={
                "storageBucket": settings.FB_STORAGE_BUCKET
            })
            _firebase_initialized = True
            logger.info(f"Firebase Admin SDK inicializado desde archivo: {settings.SERVICE_ACCOUNT_PATH}")
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


async def notificar_tarea_completada(tarea: TareaOperativa, db: AsyncSession):
    """Notifica a admins cuando una propiedad está lista."""
    zona_id = tarea.propiedad.zona_id if tarea.propiedad else None

    result = await db.execute(
        select(UsuarioStaff).where(
            (UsuarioStaff.fcm_token.isnot(None)) &
            (
                (UsuarioStaff.rol == RolStaff.SUPER_ADMIN) |
                ((UsuarioStaff.rol == RolStaff.MANAGER_LOCAL) & (UsuarioStaff.zona_id == zona_id))
            )
        )
    )
    admins = result.scalars().all()

    prop_nombre = tarea.propiedad.nombre if tarea.propiedad else "Propiedad"
    staff_nombre = tarea.asignado.nombre if tarea.asignado else "Staff"

    title = "🏠 ¡Propiedad Lista!"
    body = f"{prop_nombre} marcada como 'Clean & Ready' por {staff_nombre}."

    data = {
        "type": "TAREA_COMPLETADA",
        "tarea_id": str(tarea.id),
        "propiedad_id": str(tarea.propiedad_id),
    }

    for admin in admins:
        await send_push_notification(admin.fcm_token, title, body, data)


async def notificar_nueva_tarea(tarea: TareaOperativa, staff: UsuarioStaff, propiedad: Propiedad):
    """Notifica al staff cuando se le asigna una nueva tarea."""
    if not staff.fcm_token:
        return

    title = "📋 Nueva Tarea Asignada"
    body = f"Limpieza en {propiedad.nombre} para el {tarea.fecha_programada}."
    data = {
        "type": "NUEVA_TAREA",
        "tarea_id": str(tarea.id),
        "propiedad_id": str(propiedad.id),
    }

    await send_push_notification(staff.fcm_token, title, body, data)


async def enviar_recordatorios_manana():
    """Cron Job diario — Recordatorios al staff."""
    from datetime import date, timedelta
    manana = date.today() + timedelta(days=1)

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(TareaOperativa).where(
                TareaOperativa.fecha_programada == manana,
                TareaOperativa.estado.in_(["PENDIENTE", "EN_PROGRESO"]),
                TareaOperativa.asignado_a.isnot(None),
            )
        )
        tareas = result.scalars().all()

        if not tareas: return

        tareas_por_staff = {}
        for tarea in tareas:
            staff_id = tarea.asignado_a
            if staff_id not in tareas_por_staff:
                tareas_por_staff[staff_id] = []
            tareas_por_staff[staff_id].append(tarea)

        for staff_id, staff_tareas in tareas_por_staff.items():
            staff_result = await db.execute(select(UsuarioStaff).where(UsuarioStaff.id == staff_id))
            staff = staff_result.scalar_one_or_none()
            if not staff or not staff.fcm_token: continue

            await send_push_notification(staff.fcm_token, f"📅 Mañana tienes {len(staff_tareas)} tarea(s)", f"Prepárate para mañana {manana.strftime('%d/%m')}.", {"type": "RECORDATORIO_MANANA"})


async def alertar_admins_tareas_pendientes():
    """Cron Job diario — Alerta a admins sobre tareas pendientes."""
    from datetime import date
    hoy = date.today()

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(TareaOperativa).where(TareaOperativa.fecha_programada == hoy, TareaOperativa.estado == "PENDIENTE"))
        tareas_pendientes = result.scalars().all()
        if not tareas_pendientes: return

        sin_asignar = sum(1 for t in tareas_pendientes if t.asignado_a is None)
        admin_result = await db.execute(select(UsuarioStaff).where(UsuarioStaff.rol == RolStaff.SUPER_ADMIN, UsuarioStaff.fcm_token.isnot(None)))
        admins = admin_result.scalars().all()

        title = f"⚠️ {len(tareas_pendientes)} tareas pendientes hoy"
        body = f"Hay {len(tareas_pendientes)} propiedades por limpiar hoy."
        if sin_asignar > 0: body += f" 🚨 {sin_asignar} SIN ASIGNAR."

        for admin in admins:
            await send_push_notification(admin.fcm_token, title, body, {"type": "ALERTA_PENDIENTES"})


async def notificar_alerta_inventario(item, db: AsyncSession):
    """Notifica a admins sobre stock bajo."""
    zona_id = getattr(item, 'zona_id', None)
    result = await db.execute(select(UsuarioStaff).where((UsuarioStaff.fcm_token.isnot(None)) & ((UsuarioStaff.rol == RolStaff.SUPER_ADMIN) | ((UsuarioStaff.rol == RolStaff.MANAGER_LOCAL) & (UsuarioStaff.zona_id == zona_id) if zona_id else False))))
    admins = result.scalars().all()

    for admin in admins:
        await send_push_notification(admin.fcm_token, "📉 Stock Bajo", f"El artículo '{item.articulo}' está bajo ({item.stock_actual}/{item.stock_minimo}).", {"type": "ALERTA_INVENTARIO"})
