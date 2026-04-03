"""
Router de Tareas de Limpieza — CRUD + Checklist + Auditoría + Fotos + Completar.
"""

import os
import uuid as uuid_mod
from uuid import UUID
from typing import Optional
from datetime import date, datetime, time

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.tarea_operativa import TareaOperativa, EstadoTarea
from app.models.usuario_staff import UsuarioStaff, RolStaff
from app.schemas.tarea_operativa import (
    TareaCreate, TareaUpdate, TareaResponse, TareaConDetalles,
    ChecklistUpdate, AuditoriaUpdate, TareaCancel,
)

router = APIRouter(prefix="/tareas", tags=["Tareas de Limpieza"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/", response_model=TareaResponse, status_code=status.HTTP_201_CREATED)
async def crear_tarea(
    data: TareaCreate,
    db: AsyncSession = Depends(get_db),
):
    """Crear una nueva tarea operativa manualmente."""
    # Generar id_secuencial
    from sqlalchemy import func
    max_id_result = await db.execute(select(func.max(TareaOperativa.id_secuencial)))
    max_id = max_id_result.scalar() or 1000
    
    tarea_data = data.model_dump()
    # Asegurar que reserva_id sea UUID válido o None
    if not tarea_data.get("reserva_id"):
        tarea_data["reserva_id"] = None
        
    tarea = TareaOperativa(**tarea_data)
    tarea.id_secuencial = max_id + 1
    
    db.add(tarea)
    try:
        await db.commit()
        await db.refresh(tarea)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al guardar en DB: {str(e)}")
        
    return tarea


@router.post("/sync-now", response_model=dict)
@router.post("/sync-now/", include_in_schema=False)
@router.get("/sync-now", response_model=dict, include_in_schema=False)
async def sync_now_tareas(
    db: AsyncSession = Depends(get_db),
):
    """Re-sincronizar tareas para todas las reservas confirmadas que no tengan una."""
    from app.models.reserva import Reserva, EstadoReserva
    from app.services.task_automation import crear_tarea_para_reserva
    
    res_result = await db.execute(select(Reserva).where(Reserva.estado == EstadoReserva.CONFIRMADA))
    reservas = res_result.scalars().all()
    
    count = 0
    errors = []
    for res in reservas:
        task_result = await db.execute(select(TareaOperativa).where(TareaOperativa.reserva_id == res.id))
        if not task_result.scalar_one_or_none():
            try:
                await crear_tarea_para_reserva(str(res.id), db=db)
                count += 1
            except Exception as e:
                errors.append(f"Error en reserva {res.id}: {str(e)}")
    
    await db.commit()
    return {"status": "success", "created": count, "errors": errors}

@router.get("/", response_model=list[TareaConDetalles])
async def listar_tareas(
    fecha: date | None = None,
    fecha_inicio: date | None = None,
    fecha_fin: date | None = None,
    estado: str | None = None,
    asignado_a: str | None = None,
    id_secuencial: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Listar tareas con filtros opcionales (incluyendo rangos), enriquecidas con detalles."""
    query = select(TareaOperativa)
    if fecha:
        query = query.where(TareaOperativa.fecha_programada == fecha)
    if fecha_inicio:
        query = query.where(TareaOperativa.fecha_programada >= fecha_inicio)
    if fecha_fin:
        query = query.where(TareaOperativa.fecha_programada <= fecha_fin)
    if estado:
        query = query.where(TareaOperativa.estado == estado)
    if asignado_a:
        query = query.where(TareaOperativa.asignado_a == asignado_a)
    if id_secuencial:
        query = query.where(TareaOperativa.id_secuencial == id_secuencial)
        
    query = query.order_by(TareaOperativa.fecha_programada, TareaOperativa.hora_inicio)
    result = await db.execute(query)
    tareas = result.scalars().all()

    # Enriquecer con info de propiedad y reserva para la vista de admin
    tareas_detalladas = []
    for tarea in tareas:
        tarea_dict = TareaResponse.model_validate(tarea).model_dump()
        tarea_dict["id_secuencial"] = tarea.id_secuencial
        if tarea.propiedad:
            tarea_dict["nombre_propiedad"] = tarea.propiedad.nombre
            tarea_dict["direccion_propiedad"] = tarea.propiedad.direccion
        if tarea.reserva:
            tarea_dict["nombre_huesped"] = tarea.reserva.nombre_huesped
            tarea_dict["check_in"] = tarea.reserva.check_in
            tarea_dict["check_out"] = tarea.reserva.check_out
            tarea_dict["fuente_reserva"] = tarea.reserva.fuente.value if tarea.reserva.fuente else "MANUAL"
        if tarea.asignado:
            tarea_dict["nombre_asignado"] = tarea.asignado.nombre
        tareas_detalladas.append(TareaConDetalles(**tarea_dict))
    return tareas_detalladas


@router.post("/{tarea_id}/whatsapp-link", response_model=dict)
async def generar_whatsapp_link(
    tarea_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Genera un link de WhatsApp dinámico para contactar al staff asignado.
    Recupera el teléfono del staff y construye el link wa.me con mensaje pre-cargado.
    """
    result = await db.execute(
        select(TareaOperativa).where(TareaOperativa.id == tarea_id)
    )
    tarea = result.scalar_one_or_none()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    if not tarea.asignado_a or not tarea.asignado:
        raise HTTPException(
            status_code=400, 
            detail="La tarea no tiene personal asignado para contactar"
        )

    staff = tarea.asignado
    if not staff.telefono:
        raise HTTPException(
            status_code=400,
            detail=f"El miembro del staff {staff.nombre} no tiene un teléfono registrado"
        )

    # Limpiar teléfono (solo números)
    phone = "".join(filter(str.isdigit, staff.telefono))
    
    # Mensaje pre-configurado profesional
    prop_nombre = tarea.propiedad.nombre if tarea.propiedad else "la propiedad"
    msg = (
        f"Hola {staff.nombre}, tienes asignada la tarea de {tarea.tipo_tarea} "
        f"en *{prop_nombre}* para el día {tarea.fecha_programada}. "
        f"Por favor confirma que has recibido esta asignación."
    )
    
    import urllib.parse
    encoded_msg = urllib.parse.quote(msg)
    link = f"https://wa.me/{phone}?text={encoded_msg}"

    return {"link": link, "telefono": staff.telefono, "staff_nombre": staff.nombre}


@router.get("/hoy/{staff_id}", response_model=list[TareaConDetalles])
async def tareas_de_hoy(
    staff_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Obtener tareas del día actual para un miembro del staff (pantalla principal app)."""
    hoy = date.today()
    result = await db.execute(
        select(TareaOperativa).where(
            TareaOperativa.asignado_a == staff_id,
            TareaOperativa.fecha_programada == hoy,
        ).order_by(TareaOperativa.hora_inicio)
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
            tarea_dict["fuente_reserva"] = tarea.reserva.fuente.value if (tarea.reserva and tarea.reserva.fuente) else "MANUAL"
        tareas_detalladas.append(TareaConDetalles(**tarea_dict))

    return tareas_detalladas


@router.put("/{tarea_id}/aceptar", response_model=TareaResponse)
async def aceptar_tarea(
    tarea_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    El staff confirma la recepción y acepta la tarea asignada.
    Cambia el estado de PENDIENTE o ASIGNADA a ACEPTADA.
    """
    result = await db.execute(
        select(TareaOperativa).where(TareaOperativa.id == tarea_id)
    )
    tarea = result.scalar_one_or_none()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    # Si ya está aceptada o en progreso, devolvemos el estado actual sin error
    if tarea.estado not in (EstadoTarea.PENDIENTE, EstadoTarea.ASIGNADA_NO_CONFIRMADA):
        return tarea

    tarea.estado = EstadoTarea.ACEPTADA
    await db.flush()
    await db.refresh(tarea)
    return tarea


@router.get("/{tarea_id}", response_model=TareaConDetalles)
async def obtener_tarea(
    tarea_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Obtener detalle completo de una tarea."""
    result = await db.execute(
        select(TareaOperativa).where(TareaOperativa.id == tarea_id)
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




@router.put("/{tarea_id}", response_model=TareaResponse)
async def actualizar_tarea(
    tarea_id: UUID,
    data: TareaUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Actualizar información general de una tarea."""
    result = await db.execute(
        select(TareaOperativa).where(TareaOperativa.id == tarea_id)
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
        select(TareaOperativa).where(TareaOperativa.id == tarea_id)
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
        select(TareaOperativa).where(TareaOperativa.id == tarea_id)
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
        select(TareaOperativa).where(TareaOperativa.id == tarea_id)
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
        select(TareaOperativa).where(TareaOperativa.id == tarea_id)
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
    hora_inicio: Optional[time] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Asignar un miembro del staff a una tarea y/o establecer la hora de inicio.
    Si staff_id es None, se mantiene la asignación actual o se desasigna dependiendo de la lógica de negocio.
    """
    result = await db.execute(
        select(TareaOperativa).where(TareaOperativa.id == tarea_id)
    )
    tarea = result.scalar_one_or_none()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    if staff_id:
        staff_result = await db.execute(
            select(UsuarioStaff).where(UsuarioStaff.id == staff_id)
        )
        staff = staff_result.scalar_one_or_none()
        if not staff:
            raise HTTPException(status_code=404, detail="Staff no encontrado")
        tarea.asignado_a = str(staff_id)
        tarea.fecha_asignacion = datetime.utcnow()
    
    if hora_inicio is not None:
        tarea.hora_inicio = hora_inicio

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
        select(TareaOperativa).where(
            TareaOperativa.asignado_a == None,
            TareaOperativa.estado.in_([EstadoTarea.PENDIENTE, EstadoTarea.EN_PROGRESO]),
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
        select(TareaOperativa).where(TareaOperativa.id == tarea_id)
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


@router.delete("/{tarea_id}", response_model=dict)
async def eliminar_tarea_auditada(
    tarea_id: UUID,
    audit: Optional[TareaCancel] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Protocolo de Borrado Maestro (Sacred iCal).
    Si la tarea es externa (iCal/Airbnb), se marca como CANCELADA con auditoría obligatoria.
    Si es manual, se elimina o se cancela según preferencia de trazabilidad.
    """
    result = await db.execute(
        select(TareaOperativa).where(TareaOperativa.id == tarea_id)
    )
    tarea = result.scalar_one_or_none()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    fuente = "MANUAL"
    if tarea.reserva and tarea.reserva.fuente:
        fuente = tarea.reserva.fuente.value

    is_protected = fuente in ("ICAL", "AIRBNB")

    if is_protected and not audit:
        raise HTTPException(
            status_code=403, 
            detail="ACCESO DENEGADO: Las tareas iCal requieren Protocolo de Auditoría Maestro."
        )

    if audit:
        # Borrado Suave (Cancelación Auditada)
        tarea.estado = EstadoTarea.CANCELADA
        tarea.eliminada_por_nombre = audit.authName
        tarea.motivo_eliminacion = audit.reason
        tarea.eliminada_at = datetime.utcnow()
        await db.flush()
        return {
            "message": f"Tarea T-{tarea.id_secuencial} CANCELADA bajo protocolo de auditoría",
            "audit_log": f"Autorizado por {audit.authName}"
        }
    else:
        # Tarea manual sin auditoría específica (permiso estándar)
        # Se puede eliminar físicamente o cancelar. Elegimos CANCELAR para no romper IDs secuenciales.
        tarea.estado = EstadoTarea.CANCELADA
        tarea.eliminada_por_nombre = "ADMIN_DIRECTO"
        tarea.motivo_eliminacion = "Eliminación manual estándar"
        tarea.eliminada_at = datetime.utcnow()
        await db.flush()
        return {"message": "Tarea marcada como CANCELADA"}
