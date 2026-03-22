"""
Router de Tareas de Limpieza — CRUD + Checklist + Auditoría + Fotos + Completar.
"""

import os
import uuid as uuid_mod
from uuid import UUID
from typing import Optional
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.tarea_operativa import TareaOperativa, EstadoTarea
from app.models.usuario_staff import UsuarioStaff, RolStaff
from app.schemas.tarea_limpieza import (
    TareaCreate, TareaUpdate, TareaResponse, TareaConDetalles,
    ChecklistUpdate, AuditoriaUpdate,
)

router = APIRouter(prefix="/tareas", tags=["Tareas de Limpieza"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/", response_model=list[TareaConDetalles])
async def listar_tareas(
    fecha: date | None = None,
    estado: str | None = None,
    asignado_a: UUID | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Listar tareas con filtros opcionales, enriquecidas con detalles."""
    query = select(TareaLimpieza)
    if fecha:
        query = query.where(TareaLimpieza.fecha_programada == fecha)
    if estado:
        query = query.where(TareaLimpieza.estado == estado)
    if asignado_a:
        query = query.where(TareaLimpieza.asignado_a == asignado_a)
    query = query.order_by(TareaLimpieza.fecha_programada, TareaLimpieza.hora_inicio)
    result = await db.execute(query)
    tareas = result.scalars().all()

    tareas_detalladas = []
    for tarea in tareas:
        tarea_dict = TareaResponse.model_validate(tarea).model_dump()
        if tarea.propiedad:
            tarea_dict["nombre_propiedad"] = tarea.propiedad.nombre
            tarea_dict["direccion_propiedad"] = tarea.propiedad.direccion
        if tarea.reserva:
            tarea_dict["nombre_huesped"] = tarea.reserva.nombre_huesped
            tarea_dict["check_in"] = tarea.reserva.check_in
            tarea_dict["check_out"] = tarea.reserva.check_out
        if tarea.asignado:
            tarea_dict["nombre_asignado"] = tarea.asignado.nombre
        tareas_detalladas.append(TareaConDetalles(**tarea_dict))

    return tareas_detalladas


@router.get("/hoy/{staff_id}", response_model=list[TareaConDetalles])
async def tareas_de_hoy(
    staff_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Obtener tareas del día actual para un miembro del staff (pantalla principal app)."""
    hoy = date.today()
    result = await db.execute(
        select(TareaLimpieza).where(
            TareaLimpieza.asignado_a == staff_id,
            TareaLimpieza.fecha_programada == hoy,
        ).order_by(TareaLimpieza.hora_inicio)
    )
    tareas = result.scalars().all()

    # Enriquecer con detalles de propiedad y reserva
    tareas_detalladas = []
    for tarea in tareas:
        tarea_dict = TareaResponse.model_validate(tarea).model_dump()
        if tarea.propiedad:
            tarea_dict["nombre_propiedad"] = tarea.propiedad.nombre
            tarea_dict["direccion_propiedad"] = tarea.propiedad.direccion
        if tarea.reserva:
            tarea_dict["nombre_huesped"] = tarea.reserva.nombre_huesped
            tarea_dict["check_in"] = tarea.reserva.check_in
            tarea_dict["check_out"] = tarea.reserva.check_out
        tareas_detalladas.append(TareaConDetalles(**tarea_dict))

    return tareas_detalladas


@router.get("/{tarea_id}", response_model=TareaConDetalles)
async def obtener_tarea(
    tarea_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Obtener detalle completo de una tarea."""
    result = await db.execute(
        select(TareaLimpieza).where(TareaLimpieza.id == tarea_id)
    )
    tarea = result.scalar_one_or_none()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    tarea_dict = TareaResponse.model_validate(tarea).model_dump()
    if tarea.propiedad:
        tarea_dict["nombre_propiedad"] = tarea.propiedad.nombre
        tarea_dict["direccion_propiedad"] = tarea.propiedad.direccion
    if tarea.reserva:
        tarea_dict["nombre_huesped"] = tarea.reserva.nombre_huesped
        tarea_dict["check_in"] = tarea.reserva.check_in
        tarea_dict["check_out"] = tarea.reserva.check_out
    return TareaConDetalles(**tarea_dict)


@router.post("/", response_model=TareaResponse, status_code=status.HTTP_201_CREATED)
async def crear_tarea(
    data: TareaCreate,
    db: AsyncSession = Depends(get_db),
):
    """Crear una tarea de limpieza manualmente."""
    tarea = TareaLimpieza(**data.model_dump())
    db.add(tarea)
    await db.flush()
    await db.refresh(tarea)
    return tarea


@router.put("/{tarea_id}", response_model=TareaResponse)
async def actualizar_tarea(
    tarea_id: UUID,
    data: TareaUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Actualizar información general de una tarea."""
    result = await db.execute(
        select(TareaLimpieza).where(TareaLimpieza.id == tarea_id)
    )
    tarea = result.scalar_one_or_none()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tarea, field, value)

    await db.flush()
    await db.refresh(tarea)
    return tarea


@router.put("/{tarea_id}/checklist", response_model=TareaResponse)
async def actualizar_checklist(
    tarea_id: UUID,
    data: ChecklistUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Actualizar el checklist digital de la tarea."""
    result = await db.execute(
        select(TareaLimpieza).where(TareaLimpieza.id == tarea_id)
    )
    tarea = result.scalar_one_or_none()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    tarea.checklist = [item.model_dump() for item in data.checklist]

    # Si la tarea estaba pendiente, pasar a en progreso
    if tarea.estado == EstadoTarea.PENDIENTE:
        tarea.estado = EstadoTarea.EN_PROGRESO

    await db.flush()
    await db.refresh(tarea)
    return tarea


@router.put("/{tarea_id}/auditoria", response_model=TareaResponse)
async def actualizar_auditoria(
    tarea_id: UUID,
    data: AuditoriaUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Actualizar la auditoría de activos de la tarea."""
    result = await db.execute(
        select(TareaLimpieza).where(TareaLimpieza.id == tarea_id)
    )
    tarea = result.scalar_one_or_none()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    tarea.auditoria_activos = [item.model_dump() for item in data.auditoria_activos]
    await db.flush()
    await db.refresh(tarea)
    return tarea


@router.post("/{tarea_id}/fotos", response_model=TareaResponse)
async def subir_foto(
    tarea_id: UUID,
    tipo: str = Form(..., description="'antes' o 'despues'"),
    foto: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Subir foto de evidencia (antes o después de limpiar)."""
    if tipo not in ("antes", "despues"):
        raise HTTPException(status_code=400, detail="tipo debe ser 'antes' o 'despues'")

    result = await db.execute(
        select(TareaLimpieza).where(TareaLimpieza.id == tarea_id)
    )
    tarea = result.scalar_one_or_none()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    # Guardar archivo
    ext = os.path.splitext(foto.filename)[1] if foto.filename else ".jpg"
    filename = f"{tarea_id}_{tipo}_{uuid_mod.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    content = await foto.read()
    with open(filepath, "wb") as f:
        f.write(content)

    # Registrar en la tarea
    foto_info = {
        "url": f"/uploads/{filename}",
        "filename": filename,
        "uploaded_at": datetime.utcnow().isoformat(),
    }

    if tipo == "antes":
        fotos = tarea.fotos_antes or []
        fotos.append(foto_info)
        tarea.fotos_antes = fotos
    else:
        fotos = tarea.fotos_despues or []
        fotos.append(foto_info)
        tarea.fotos_despues = fotos

    await db.flush()
    await db.refresh(tarea)
    return tarea


@router.put("/{tarea_id}/completar", response_model=TareaResponse)
async def completar_tarea(
    tarea_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Marcar tarea como 'Clean & Ready'.
    Valida que se cumplan requisitos mínimos antes de completar.
    Dispara notificación push al admin.
    """
    result = await db.execute(
        select(TareaLimpieza).where(TareaLimpieza.id == tarea_id)
    )
    tarea = result.scalar_one_or_none()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    if tarea.estado == EstadoTarea.COMPLETADA:
        raise HTTPException(status_code=400, detail="La tarea ya está completada")

    # Validar que tenga fotos de antes y después
    fotos_antes = tarea.fotos_antes or []
    fotos_despues = tarea.fotos_despues or []
    if len(fotos_antes) < 1:
        raise HTTPException(
            status_code=400,
            detail="Debes subir al menos 1 foto ANTES de limpiar"
        )
    if len(fotos_despues) < 1:
        raise HTTPException(
            status_code=400,
            detail="Debes subir al menos 1 foto DESPUÉS de limpiar"
        )

    # Validar checklist: items requeridos deben estar completados
    if tarea.checklist:
        items_pendientes = [
            item for item in tarea.checklist
            if item.get("requerido") and not item.get("completado")
        ]
        if items_pendientes:
            nombres = ", ".join(i["item"] for i in items_pendientes[:3])
            raise HTTPException(
                status_code=400,
                detail=f"Items requeridos pendientes: {nombres}"
            )

    # Marcar como completada
    tarea.estado = EstadoTarea.COMPLETADA
    tarea.completada_at = datetime.utcnow()
    await db.flush()
    await db.refresh(tarea)

    # Enviar notificación push al admin
    try:
        from app.services.notifications import notificar_tarea_completada
        await notificar_tarea_completada(tarea, db)
    except Exception as e:
        # No bloquear la operación si falla la notificación
        print(f"Error enviando notificación: {e}")

    return tarea


@router.put("/{tarea_id}/asignar", response_model=TareaConDetalles)
async def asignar_tarea(
    tarea_id: UUID,
    staff_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Asignar un miembro del staff a una tarea.
    Si staff_id es None, desasigna la tarea.
    """
    result = await db.execute(
        select(TareaLimpieza).where(TareaLimpieza.id == tarea_id)
    )
    tarea = result.scalar_one_or_none()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    if staff_id:
        # Verificar que el staff existe y está disponible
        staff_result = await db.execute(
            select(UsuarioStaff).where(UsuarioStaff.id == staff_id)
        )
        staff = staff_result.scalar_one_or_none()
        if not staff:
            raise HTTPException(status_code=404, detail="Staff no encontrado")
        tarea.asignado_a = str(staff_id)
    else:
        tarea.asignado_a = None

    await db.flush()
    await db.refresh(tarea)

    # Devolver con detalles
    tarea_dict = TareaResponse.model_validate(tarea).model_dump()
    if tarea.propiedad:
        tarea_dict["nombre_propiedad"] = tarea.propiedad.nombre
        tarea_dict["direccion_propiedad"] = tarea.propiedad.direccion
    if tarea.reserva:
        tarea_dict["nombre_huesped"] = tarea.reserva.nombre_huesped
        tarea_dict["check_in"] = tarea.reserva.check_in
        tarea_dict["check_out"] = tarea.reserva.check_out
    if tarea.asignado:
        tarea_dict["nombre_asignado"] = tarea.asignado.nombre
    return TareaConDetalles(**tarea_dict)


@router.post("/auto-asignar", response_model=dict)
async def auto_asignar_tareas(
    db: AsyncSession = Depends(get_db),
):
    """
    Auto-asignar todas las tareas pendientes sin asignación
    usando el algoritmo round-robin por carga de trabajo.
    """
    from app.services.task_automation import obtener_staff_disponible

    result = await db.execute(
        select(TareaLimpieza).where(
            TareaLimpieza.asignado_a == None,
            TareaLimpieza.estado.in_([EstadoTarea.PENDIENTE, EstadoTarea.EN_PROGRESO]),
        )
    )
    tareas_sin_asignar = result.scalars().all()

    asignadas = 0
    for tarea in tareas_sin_asignar:
        staff = await obtener_staff_disponible(db, tarea.fecha_programada)
        if staff:
            tarea.asignado_a = staff.id
            asignadas += 1

    await db.flush()

    return {
        "message": f"{asignadas} de {len(tareas_sin_asignar)} tareas asignadas automáticamente",
        "asignadas": asignadas,
        "total_sin_asignar": len(tareas_sin_asignar),
    }


@router.put("/{tarea_id}/verificar", response_model=TareaResponse)
async def verificar_tarea(
    tarea_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Admin verifica y aprueba la tarea completada."""
    result = await db.execute(
        select(TareaLimpieza).where(TareaLimpieza.id == tarea_id)
    )
    tarea = result.scalar_one_or_none()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    if tarea.estado != EstadoTarea.COMPLETADA:
        raise HTTPException(
            status_code=400,
            detail="Solo se pueden verificar tareas completadas"
        )

    tarea.estado = EstadoTarea.VERIFICADA
    tarea.verificada_at = datetime.utcnow()
    await db.flush()
    await db.refresh(tarea)
    return tarea
