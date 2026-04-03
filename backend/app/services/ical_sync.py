"""
Servicio de Sincronización iCal — Lee calendarios .ics.
"""

import logging
from datetime import datetime, date
import httpx
from icalendar import Calendar
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.propiedad import Propiedad
from app.models.reserva import Reserva, FuenteReserva, EstadoReserva
import re
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def detectar_fuente(url: str) -> FuenteReserva:
    url_lower = url.lower()
    if "airbnb" in url_lower: return FuenteReserva.AIRBNB
    if "booking" in url_lower: return FuenteReserva.BOOKING
    if "vrbo" in url_lower or "homeaway" in url_lower: return FuenteReserva.VRBO
    return FuenteReserva.OTRO


async def fetch_ical_content(url: str) -> str | None:
    try:
        async with httpx.AsyncClient(timeout=settings.ICAL_REQUEST_TIMEOUT, follow_redirects=True) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.text
    except Exception as e:
        logger.error(f"Error descargando iCal {url}: {e}")
        return None


def parse_ical_events(ical_content: str) -> list[dict]:
    events = []
    try:
        cal = Calendar.from_ical(ical_content)
        for component in cal.walk():
            if component.name == "VEVENT":
                dtstart = component.get("DTSTART")
                dtend = component.get("DTEND")
                if not dtstart or not dtend: continue
                
                check_in = dtstart.dt
                check_out = dtend.dt
                if hasattr(check_in, "date"): check_in = check_in.date()
                if hasattr(check_out, "date"): check_out = check_out.date()

                description = str(component.get("DESCRIPTION", ""))
                
                events.append({
                    "uid_ical": str(component.get("UID", "")),
                    "nombre_huesped": str(component.get("SUMMARY", "Huésped")),
                    "check_in": check_in,
                    "check_out": check_out,
                    "description": description
                })
    except Exception as e:
        logger.error(f"Error parseando iCal: {e}")
    return events


async def sync_property_ical(propiedad_id: str):
    nuevas_reserva_ids = []
    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(select(Propiedad).where(Propiedad.id == propiedad_id))
            propiedad = result.scalar_one_or_none()
            if not propiedad or not propiedad.ical_url: return

            ical_content = await fetch_ical_content(propiedad.ical_url)
            if not ical_content: return

            events = parse_ical_events(ical_content)
            existing_res_result = await db.execute(select(Reserva).where(Reserva.propiedad_id == propiedad_id, Reserva.uid_ical.isnot(None)))
            existing_res_map = {r.uid_ical: r for r in existing_res_result.scalars().all()}
            fuente = detectar_fuente(propiedad.ical_url)

            uids_procesados = set()
            for event in events:
                uid = event["uid_ical"]
                uids_procesados.add(uid)
                res = existing_res_map.get(uid)

                # [EXTRACCIÓN TÁCTICA] - Parsear descripción para Airbnb
                desc = event.get("description", "")
                codigo_canal = None
                ultimos_4 = None
                
                if fuente == FuenteReserva.AIRBNB:
                    # Extraer HM... de la URL de detalles
                    match_hm = re.search(r'details/([A-Z0-9]+)', desc)
                    if match_hm: codigo_canal = match_hm.group(1)
                    
                    # Extraer últimos 4 dígitos
                    match_tel = re.search(r'Last 4 Digits\): (\d{4})', desc)
                    if match_tel: ultimos_4 = match_tel.group(1)

                if res:
                    if res.estado == EstadoReserva.CANCELADA:
                        res.estado = EstadoReserva.CONFIRMADA
                        if res.id not in nuevas_reserva_ids:
                            nuevas_reserva_ids.append(res.id)
                            
                    res.check_in = event["check_in"]
                    res.check_out = event["check_out"]
                    res.nombre_huesped = event["nombre_huesped"]
                    if codigo_canal: res.codigo_reserva_canal = codigo_canal
                    if ultimos_4: res.telefono_ultimos_4 = ultimos_4
                    
                    # [RESILIENCIA ANTI-ERROR]
                    # Si la reserva está en iCal, DEBE tener una tarea válida.
                    tiene_tarea_valida = False
                    if res.tareas:
                        for t in res.tareas:
                            if t.estado != "CANCELADA":
                                tiene_tarea_valida = True
                                break
                                
                    if not tiene_tarea_valida:
                        # Si no tiene ninguna tarea activa, forzamos creación
                        if res.id not in nuevas_reserva_ids:
                            nuevas_reserva_ids.append(res.id)
                else:
                    nueva_res = Reserva(
                        propiedad_id=propiedad.id, 
                        fuente=fuente, 
                        uid_ical=uid, 
                        nombre_huesped=event["nombre_huesped"], 
                        check_in=event["check_in"], 
                        check_out=event["check_out"], 
                        estado=EstadoReserva.CONFIRMADA,
                        codigo_reserva_canal=codigo_canal,
                        telefono_ultimos_4=ultimos_4
                    )
                    db.add(nueva_res)
                    await db.flush()
                    nuevas_reserva_ids.append(nueva_res.id)

            # [AUDITORÍA]: No cancelar automáticamente reservas que desaparecen del feed iCal.
            # Solo un administrador puede marcarlas como CANCELADA tras verificación manual.
            # for uid, res in existing_res_map.items():
            #     if uid not in uids_procesados and res.check_in >= date.today() and res.estado == EstadoReserva.CONFIRMADA:
            #         res.estado = EstadoReserva.CANCELADA

            propiedad.ical_last_sync = datetime.utcnow()
            await db.commit()
        except Exception as e:
            await db.rollback()
            logger.error(f"Error sync iCal {propiedad_id}: {e}")

    if nuevas_reserva_ids:
        from app.services.task_automation import crear_tarea_para_reserva
        for r_id in nuevas_reserva_ids:
            try: await crear_tarea_para_reserva(r_id)
            except: pass


async def sync_all_properties():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Propiedad).where(Propiedad.activa == True, Propiedad.ical_url.isnot(None)))
        for prop in result.scalars().all():
            try: await sync_property_ical(prop.id)
            except: continue
