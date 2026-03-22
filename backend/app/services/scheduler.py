"""
Scheduler — Cron Jobs.
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
    scheduler.add_job(_job_sync_ical, trigger=IntervalTrigger(minutes=10), id="sync_ical", replace_existing=True)
    scheduler.add_job(_job_check_timeouts, trigger=IntervalTrigger(minutes=30), id="check_timeouts", replace_existing=True)
    scheduler.add_job(_job_recordatorios_staff, trigger=CronTrigger(hour=settings.DAILY_REMINDER_HOUR, minute=0), id="recordatorios_staff", replace_existing=True)
    scheduler.add_job(_job_alertas_admins, trigger=CronTrigger(hour=settings.DAILY_ALERT_HOUR, minute=0), id="alertas_admins", replace_existing=True)
    scheduler.start()
    logger.info("Scheduler iniciado")

async def _job_sync_ical():
    try:
        from app.services.ical_sync import sync_all_properties
        await sync_all_properties()
    except: pass

async def _job_check_timeouts():
    try:
        from app.services.task_automation import check_assignment_timeouts
        await check_assignment_timeouts()
    except: pass

async def _job_recordatorios_staff():
    try:
        from app.services.notifications import enviar_recordatorios_manana
        await enviar_recordatorios_manana()
    except: pass

async def _job_alertas_admins():
    try:
        from app.services.notifications import alertar_admins_tareas_pendientes
        await alertar_admins_tareas_pendientes()
    except: pass

def shutdown_scheduler():
    if scheduler.running: scheduler.shutdown(wait=False)
