"""
Router de Reservas — CRUD + sincronización iCal.
"""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.reserva import Reserva, EstadoReserva, FuenteReserva
from app.models.propiedad import Propiedad
from app.schemas.reserva import ReservaCreate, ReservaUpdate, ReservaResponse
from app.services.task_automation import crear_tarea_para_reserva
from app.services.ocr_service import extract_guest_data_from_image

router = APIRouter(prefix="/reservas", tags=["Reservas"])


@router.post("/scan-id")
async def scan_id(file: UploadFile = File(...)):
    """
    Escaneo Unificado con Gemini 1.5 Flash.
    """
    try:
        content = await file.read()
        extracted_data = await extract_guest_data_from_image(content)
        return extracted_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en escaneo: {str(e)}")


@router.get("/", response_model=list[ReservaResponse])
async def listar_reservas(
    propiedad_id: str | None = None,
    estado: str | None = None,
    desde: date | None = None,
    hasta: date | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Listar reservas con filtros opcionales."""
    query = select(Reserva)
    if propiedad_id:
        query = query.where(Reserva.propiedad_id == str(propiedad_id))
    if estado:
        query = query.where(Reserva.estado == estado)
    if desde:
        query = query.where(Reserva.check_out >= desde)
    if hasta:
        query = query.where(Reserva.check_in <= hasta)
    query = query.order_by(Reserva.check_in.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/ical/export/{propiedad_id}")
async def exportar_ical_manual(
    propiedad_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Exporta un calendario iCal (.ics) con reservas MANUALES confirmadas.
    Permite el 2-way sync con Airbnb sin crear bucles.
    """
    from icalendar import Calendar, Event
    from fastapi.responses import Response

    # 1. Obtener reservas
    result = await db.execute(
        select(Reserva).where(
            Reserva.propiedad_id == str(propiedad_id),
            Reserva.fuente == FuenteReserva.MANUAL,
            Reserva.estado == EstadoReserva.CONFIRMADA
        )
    )
    reservas = result.scalars().all()

    # 2. Crear calendario
    cal = Calendar()
    cal.add('prodid', '-//ClearHost PMS//Manual Sync//EN')
    cal.add('version', '2.0')

    for res in reservas:
        event = Event()
        event.add('summary', f"Reserva: {res.nombre_huesped}")
        event.add('dtstart', res.check_in)
        event.add('dtend', res.check_out)
        event.add('description', f"Reserva manual en ClearHost. UID: {res.id}")
        event.add('uid', f"manual-{res.id}@clearhost")
        cal.add_component(event)

    return Response(
        content=cal.to_ical(), 
        media_type="text/calendar",
        headers={"Content-Disposition": f"attachment; filename=reservas_manuales_{propiedad_id}.ics"}
    )


@router.get("/proximas", response_model=list[ReservaResponse])
async def listar_reservas_proximas(
    dias: int = 7,
    db: AsyncSession = Depends(get_db),
):
    """Listar reservas que inician en los próximos N días."""
    from datetime import timedelta
    hoy = date.today()
    limite = hoy + timedelta(days=dias)
    result = await db.execute(
        select(Reserva).where(
            Reserva.check_in >= hoy,
            Reserva.check_in <= limite,
            Reserva.estado == "CONFIRMADA",
        ).order_by(Reserva.check_in)
    )
    return result.scalars().all()


@router.get("/{reserva_id}", response_model=ReservaResponse)
async def obtener_reserva(
    reserva_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Obtener una reserva por su ID."""
    result = await db.execute(
        select(Reserva).where(Reserva.id == str(reserva_id))
    )
    reserva = result.scalar_one_or_none()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    return reserva


@router.post("/", response_model=ReservaResponse, status_code=status.HTTP_201_CREATED)
async def crear_reserva(
    data: ReservaCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Crear una nueva reserva manualmente. Auto-genera tarea de limpieza."""
    # Verificar que la propiedad existe
    prop_result = await db.execute(
        select(Propiedad).where(Propiedad.id == data.propiedad_id)
    )
    if not prop_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")

    # Validar fechas
    if data.check_out <= data.check_in:
        raise HTTPException(status_code=400, detail="check_out debe ser posterior a check_in")

    # Validar solapamiento (Overbooking)
    # Una reserva solapa si: (entrada_existente < salida_nueva) AND (salida_existente > entrada_nueva)
    conflict_query = select(Reserva).where(
        Reserva.propiedad_id == data.propiedad_id,
        Reserva.estado == EstadoReserva.CONFIRMADA,
        Reserva.check_in < data.check_out,
        Reserva.check_out > data.check_in
    )
    conflict_result = await db.execute(conflict_query)
    conflict = conflict_result.scalars().first()
    
    if conflict:
        raise HTTPException(
            status_code=400, 
            detail=f"Fechas ocupadas. Conflicto con: {conflict.nombre_huesped} ({conflict.check_in} al {conflict.check_out})."
        )

    reserva = Reserva(**data.model_dump())
    db.add(reserva)
    await db.flush()
    await db.refresh(reserva)

    # Auto-crear tarea de limpieza en background
    background_tasks.add_task(crear_tarea_para_reserva, reserva.id)

    return reserva


@router.put("/{reserva_id}", response_model=ReservaResponse)
async def actualizar_reserva(
    reserva_id: str,
    data: ReservaUpdate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Actualizar una reserva manual con bloqueo total de overbooking."""
    try:
        # 1. Localizar reserva
        res_id = str(reserva_id)
        result = await db.execute(select(Reserva).where(Reserva.id == res_id))
        reserva = result.scalar_one_or_none()
        if not reserva:
            raise HTTPException(status_code=404, detail="Reserva no encontrada")

        if reserva.fuente != FuenteReserva.MANUAL:
            raise HTTPException(status_code=403, detail="Las reservas de plataforma no se pueden editar manualmente.")

        # 2. Extraer y validar valores proyectados
        # Aseguramos que propiedad_id sea string
        target_prop_id = str(data.propiedad_id) if data.propiedad_id is not None else str(reserva.propiedad_id)
        
        # Las fechas ya vienen como date objects en Pydantic 2.0 si se definen correctamente
        target_in = data.check_in if data.check_in is not None else reserva.check_in
        target_out = data.check_out if data.check_out is not None else reserva.check_out
        target_estado = data.estado if data.estado is not None else reserva.estado

        if target_out <= target_in:
            raise HTTPException(status_code=400, detail="Check-out debe ser posterior al Check-in.")

        # 3. BLOQUEO DE OVERBOOKING (SEGURIDAD CRÍTICA)
        # Solo comprobamos si la reserva está (o va a estar) CONFIRMADA
        if target_estado == EstadoReserva.CONFIRMADA:
            # Query estricta: misma propiedad, estado confirmado, excluyendo esta misma reserva
            overlap_stmt = select(Reserva).where(
                Reserva.id != reserva.id,
                Reserva.propiedad_id == target_prop_id,
                Reserva.estado == EstadoReserva.CONFIRMADA,
                # Lógica de solapamiento: (CheckIn < NuevoOut) AND (CheckOut > NuevoIn)
                Reserva.check_in < target_out,
                Reserva.check_out > target_in
            )
            overlap_exec = await db.execute(overlap_stmt)
            conflicto = overlap_exec.scalars().first()
            
            if conflicto:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail=f"MOVIMIENTO DENEGADO: Overbooking con {conflicto.nombre_huesped} ({conflicto.check_in} a {conflicto.check_out})."
                )

        # 4. Actualizar campos
        prev_estado = reserva.estado
        up_data = data.model_dump(exclude_unset=True)
        for key, value in up_data.items():
            setattr(reserva, key, value)

        await db.flush()
        await db.refresh(reserva)

        # 5. Automatización
        if prev_estado == EstadoReserva.CANCELADA and reserva.estado == EstadoReserva.CONFIRMADA:
            background_tasks.add_task(crear_tarea_para_reserva, reserva.id)

        return reserva

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error en validación de seguridad: {str(e)}")


@router.delete("/{reserva_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancelar_reserva(
    reserva_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Cancelar una reserva (cambia estado, no elimina)."""
    result = await db.execute(
        select(Reserva).where(Reserva.id == str(reserva_id))
    )
    reserva = result.scalar_one_or_none()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    if reserva.fuente != "MANUAL":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Solo se pueden cancelar reservas manuales. Las de plataforma se gestionan vía iCal."
        )

    reserva.estado = "CANCELADA"
    await db.flush()


@router.post("/sync-ical/{propiedad_id}", response_model=dict)
async def sincronizar_ical(
    propiedad_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Disparar sincronización iCal manualmente para una propiedad."""
    result = await db.execute(
        select(Propiedad).where(Propiedad.id == str(propiedad_id))
    )
    propiedad = result.scalar_one_or_none()
    if not propiedad:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    if not propiedad.ical_url:
        raise HTTPException(status_code=400, detail="La propiedad no tiene URL iCal configurada")

    from app.services.ical_sync import sync_property_ical
    background_tasks.add_task(sync_property_ical, propiedad_id)

    return {"message": f"Sincronización iCal iniciada para '{propiedad.nombre}'"}
