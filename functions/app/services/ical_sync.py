"""
Servicio de Sincronización iCal — Lee calendarios .ics de plataformas de reservas.
Contempla latencia de 15-60 minutos en las actualizaciones de los calendarios fuente.
"""

import logging
from datetime import datetime

import httpx
from icalendar import Calendar

from app.database import AsyncSessionLocal
from app.models.propiedad import Propiedad
from app.models.reserva import Reserva, FuenteReserva, EstadoReserva
from app.config import get_settings

from sqlalchemy import select

logger = logging.getLogger(__name__)
settings = get_settings()


def detectar_fuente(url: str) -> FuenteReserva:
    """Detectar la fuente de la reserva según la URL del iCal."""
    url_lower = url.lower()
    if "airbnb" in url_lower:
        return FuenteReserva.AIRBNB
    elif "booking" in url_lower:
        return FuenteReserva.BOOKING
    elif "vrbo" in url_lower or "homeaway" in url_lower:
        return FuenteReserva.VRBO
    return FuenteReserva.OTRO


async def fetch_ical_content(url: str) -> str | None:
    """
    Descarga el contenido del archivo iCal desde la URL.
    Usa timeout configurable dado que las plataformas pueden tardar en responder.
    """
    try:
        async with httpx.AsyncClient(
            timeout=settings.ICAL_REQUEST_TIMEOUT,
            follow_redirects=True,
        ) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.text
    except httpx.TimeoutException:
        logger.warning(f"Timeout al descargar iCal: {url}")
        return None
    except httpx.HTTPError as e:
        logger.error(f"Error HTTP descargando iCal {url}: {e}")
        return None
    except Exception as e:
        logger.error(f"Error inesperado descargando iCal {url}: {e}")
        return None


def parse_ical_events(ical_content: str) -> list[dict]:
    """
    Parsea el contenido iCal y extrae los eventos como reservas.
    Retorna lista de diccionarios con datos de cada reserva.
    """
    events = []
    try:
        cal = Calendar.from_ical(ical_content)
        for component in cal.walk():
            if component.name == "VEVENT":
                uid = str(component.get("UID", ""))
                summary = str(component.get("SUMMARY", "Huésped"))
                dtstart = component.get("DTSTART")
                dtend = component.get("DTEND")

                if not dtstart or not dtend:
                    continue

                check_in = dtstart.dt
                check_out = dtend.dt

                # Asegurar que son objetos date (no datetime)
                if hasattr(check_in, "date"):
                    check_in = check_in.date()
                if hasattr(check_out, "date"):
                    check_out = check_out.date()

                events.append({
                    "uid_ical": uid,
                    "nombre_huesped": summary,
                    "check_in": check_in,
                    "check_out": check_out,
                })
    except Exception as e:
        logger.error(f"Error parseando iCal: {e}")

    return events


async def sync_property_ical(propiedad_id: str):
    """
    Sincroniza el calendario iCal de una propiedad específica.
    - Descarga el .ics
    - Parsea los eventos
    - Compara con reservas existentes (por uid_ical) para evitar duplicados
    - Inserta nuevas, actualiza modificadas
    - Al detectar check-out en nueva reserva → dispara creación de tarea
    """
    nuevas_reserva_ids = []

    async with AsyncSessionLocal() as db:
        try:
            # Obtener propiedad
            result = await db.execute(
                select(Propiedad).where(Propiedad.id == propiedad_id)
            )
            propiedad = result.scalar_one_or_none()
            if not propiedad or not propiedad.ical_url:
                logger.warning(f"Propiedad {propiedad_id} sin URL iCal")
                return

            logger.info(f"Sincronizando iCal para: {propiedad.nombre}")

            # Descargar contenido iCal
            ical_content = await fetch_ical_content(propiedad.ical_url)
            if not ical_content:
                logger.warning(f"No se pudo descargar iCal para {propiedad.nombre}")
                return

            # Parsear eventos
            fuente = detectar_fuente(propiedad.ical_url)
            events = parse_ical_events(ical_content)
            logger.info(f"Encontrados {len(events)} eventos en iCal de {propiedad.nombre}")

            nuevas_reservas = 0
            for event in events:
                # Verificar si la reserva ya existe por uid_ical
                existing = await db.execute(
                    select(Reserva).where(Reserva.uid_ical == event["uid_ical"])
                )
                reserva_existente = existing.scalar_one_or_none()

                if reserva_existente:
                    # Actualizar fechas si cambiaron
                    if (reserva_existente.check_in != event["check_in"] or
                            reserva_existente.check_out != event["check_out"]):
                        reserva_existente.check_in = event["check_in"]
                        reserva_existente.check_out = event["check_out"]
                        reserva_existente.nombre_huesped = event["nombre_huesped"]
                        logger.info(f"Reserva actualizada: {event['uid_ical']}")
                else:
                    # Crear nueva reserva
                    nueva_reserva = Reserva(
                        propiedad_id=propiedad.id,
                        fuente=fuente,
                        uid_ical=event["uid_ical"],
                        nombre_huesped=event["nombre_huesped"],
                        check_in=event["check_in"],
                        check_out=event["check_out"],
                        estado=EstadoReserva.CONFIRMADA,
                    )
                    db.add(nueva_reserva)
                    await db.flush()
                    nuevas_reservas += 1
                    nuevas_reserva_ids.append(nueva_reserva.id)
                    logger.info(f"Nueva reserva creada: {event['nombre_huesped']} "
                                f"({event['check_in']} - {event['check_out']})")

            # Actualizar timestamp de última sincronización
            propiedad.ical_last_sync = datetime.utcnow()
            await db.commit()
            logger.info(
                f"Sync completada para {propiedad.nombre}: "
                f"{nuevas_reservas} nuevas reservas"
            )

        except Exception as e:
            await db.rollback()
            logger.error(f"Error en sync iCal de propiedad {propiedad_id}: {e}")
            raise

    # Crear tareas DESPUÉS del commit, para que las reservas ya existan en BD
    # y crear_tarea_para_reserva pueda encontrarlas en su propia sesión
    if nuevas_reserva_ids:
        from app.services.task_automation import crear_tarea_para_reserva
        for reserva_id in nuevas_reserva_ids:
            try:
                await crear_tarea_para_reserva(reserva_id)
            except Exception as e:
                logger.error(f"Error creando tarea para reserva {reserva_id}: {e}")


async def sync_all_properties():
    """
    Sincroniza iCal de TODAS las propiedades activas que tengan URL configurada.
    Se ejecuta cada 30 minutos vía scheduler.
    La latencia de 15-60 min de las plataformas se absorbe con la frecuencia del cron.
    """
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Propiedad).where(
                Propiedad.activa == True,
                Propiedad.ical_url.isnot(None),
            )
        )
        propiedades = result.scalars().all()
        logger.info(f"Sincronizando iCal de {len(propiedades)} propiedades")

        for prop in propiedades:
            try:
                await sync_property_ical(prop.id)
            except Exception as e:
                logger.error(f"Error sincronizando {prop.nombre}: {e}")
                continue
