"""
Router de Reservas — CRUD + sincronización iCal.
"""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.reserva import Reserva
from app.models.propiedad import Propiedad
from app.schemas.reserva import ReservaCreate, ReservaUpdate, ReservaResponse
from app.services.task_automation import crear_tarea_para_reserva
from app.models.tarea_operativa import TareaOperativa, EstadoTarea

router = APIRouter(prefix="/reservas", tags=["Reservas"])


@router.post("/scan-id")
async def scan_id(file: UploadFile = File(...)):
    """
    Simulación de OCR con Gemini 1.5 Flash.
    En producción, procesaría la imagen 'file' para extraer texto.
    """
    import asyncio
    await asyncio.sleep(1.5) # Simular latencia de red/IA
    
    # Datos simulados de alta calidad
    return {
        "nombre_huesped": "John Doe",
        "doc_identidad": "ID-9988776655",
        "nacionalidad": "DOM",
        "telefono_huesped": "+1 809 123 4567",
        "message": "Sincronización Inteligente completada"
    }


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
        query = query.where(Reserva.propiedad_id == propiedad_id)
    if estado:
        query = query.where(Reserva.estado == estado)
    if desde:
        query = query.where(Reserva.check_out >= desde)
    if hasta:
        query = query.where(Reserva.check_in <= hasta)
    query = query.order_by(Reserva.check_in.desc())
    result = await db.execute(query)
    return result.scalars().all()


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
        select(Reserva).where(Reserva.id == reserva_id)
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

    reserva = Reserva(**data.model_dump())
    db.add(reserva)
    await db.commit() # Asegurar que esté en la DB para la Background Task
    await db.refresh(reserva)

    # Auto-crear tarea de limpieza en background
    background_tasks.add_task(crear_tarea_para_reserva, str(reserva.id))

    return reserva


@router.put("/{reserva_id}", response_model=ReservaResponse)
async def actualizar_reserva(
    reserva_id: str,
    data: ReservaUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Actualizar una reserva existente."""
    result = await db.execute(
        select(Reserva).where(Reserva.id == reserva_id)
    )
    reserva = result.scalar_one_or_none()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(reserva, field, value)

    await db.flush()
    await db.refresh(reserva)
    return reserva


@router.delete("/{reserva_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancelar_reserva(
    reserva_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Cancelar una reserva (cambia estado, no elimina)."""
    result = await db.execute(
        select(Reserva).where(Reserva.id == reserva_id)
    )
    reserva = result.scalar_one_or_none()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    reserva.estado = "CANCELADA"
    
    # Propagar cancelación a las tareas asociadas
    tareas_result = await db.execute(
        select(TareaOperativa).where(TareaOperativa.reserva_id == reserva.id)
    )
    tareas = tareas_result.scalars().all()
    for tarea in tareas:
        tarea.estado = EstadoTarea.CANCELADA
        tarea.eliminada_por_nombre = "Sistema (Reserva Cancelada)"
        
    await db.commit()


@router.post("/sync-ical/{propiedad_id}", response_model=dict)
async def sincronizar_ical(
    propiedad_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Disparar sincronización iCal manualmente para una propiedad."""
    result = await db.execute(
        select(Propiedad).where(Propiedad.id == propiedad_id)
    )
    propiedad = result.scalar_one_or_none()
    if not propiedad:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    if not propiedad.ical_url:
        raise HTTPException(status_code=400, detail="La propiedad no tiene URL iCal configurada")

    from app.services.ical_sync import sync_property_ical
    background_tasks.add_task(sync_property_ical, propiedad_id)

    return {"message": f"Sincronización iCal iniciada para '{propiedad.nombre}'"}
