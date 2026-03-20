"""
Scheduler — Cron Jobs con APScheduler.
Ejecuta tareas periódicas:
  1. Cada 30 min: Sincronizar iCal de todas las propiedades
  2. Diario 8:00 AM: Recordatorios al staff (incluye lavado de ropa)
  3. Diario 7:00 AM: Alertas de tareas pendientes a admins
"""

import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

scheduler = AsyncIOScheduler()


def setup_scheduler():
    """Configura y arranca todos los cron jobs."""

    # 1. Sincronización iCal cada 30 minutos
    scheduler.add_job(
        _job_sync_ical,
        trigger=IntervalTrigger(minutes=settings.ICAL_SYNC_INTERVAL_MINUTES),
        id="sync_ical",
        name="Sincronización iCal",
        replace_existing=True,
    )

    # 2. Recordatorios al staff - diario a las 8 AM
    scheduler.add_job(
        _job_recordatorios_staff,
        trigger=CronTrigger(hour=settings.DAILY_REMINDER_HOUR, minute=0),
        id="recordatorios_staff",
        name="Recordatorios al staff",
        replace_existing=True,
    )

    # 3. Alertas de tareas pendientes a admins - diario a las 7 AM
    scheduler.add_job(
        _job_alertas_admins,
        trigger=CronTrigger(hour=settings.DAILY_ALERT_HOUR, minute=0),
        id="alertas_admins",
        name="Alertas a admins",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("Scheduler iniciado con 3 cron jobs configurados")


async def _job_sync_ical():
    """Job: Sincronizar iCal de todas las propiedades."""
    logger.info("=== Ejecutando sincronización iCal ===")
    try:
        from app.services.ical_sync import sync_all_properties
        await sync_all_properties()
    except Exception as e:
        logger.error(f"Error en job sync_ical: {e}")


async def _job_recordatorios_staff():
    """Job: Enviar recordatorios al staff sobre tareas de mañana."""
    logger.info("=== Enviando recordatorios al staff ===")
    try:
        from app.services.notifications import enviar_recordatorios_manana
        await enviar_recordatorios_manana()
    except Exception as e:
        logger.error(f"Error en job recordatorios: {e}")


async def _job_alertas_admins():
    """Job: Alertar a admins sobre tareas pendientes del día."""
    logger.info("=== Enviando alertas a admins ===")
    try:
        from app.services.notifications import alertar_admins_tareas_pendientes
        await alertar_admins_tareas_pendientes()
    except Exception as e:
        logger.error(f"Error en job alertas_admins: {e}")


def shutdown_scheduler():
    """Detiene el scheduler limpiamente."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler detenido")
