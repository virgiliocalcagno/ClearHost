"""
Router de Tareas de Limpieza — CRUD + Checklist + Auditoría + Fotos + Completar.
"""

import os
import uuid as uuid_mod
from uuid import UUID
from typing import Optional
from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.tarea_limpieza import TareaLimpieza, EstadoTarea, PrioridadTarea
from app.models.usuario_staff import UsuarioStaff, RolStaff
from app.schemas.tarea_limpieza import (
    TareaCreate, TareaUpdate, TareaResponse, TareaConDetalles,
    ChecklistUpdate, AuditoriaUpdate,
)

router = APIRouter(prefix="/tareas", tags=["Tareas de Limpieza"])

class WSConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, staff_id: str):
        await websocket.accept()
        self.active_connections[staff_id] = websocket

    def disconnect(self, staff_id: str):
        if staff_id in self.active_connections:
            del self.active_connections[staff_id]

    async def send_update_to_staff(self, staff_id: str, message: dict):
        websocket = self.active_connections.get(staff_id)
        if websocket:
            try:
                await websocket.send_json(message)
            except Exception:
                self.disconnect(staff_id)

ws_manager = WSConnectionManager()

@router.websocket("/ws/{staff_id}")
async def websocket_endpoint(websocket: WebSocket, staff_id: str):
    await ws_manager.connect(websocket, staff_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(staff_id)

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
        query = query.where(TareaLimpieza.asignado_a == str(asignado_a))
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
        if tarea.estado not in (EstadoTarea.CLEAN_AND_READY, EstadoTarea.VERIFICADA):
            ahora = datetime.utcnow()
            t_hora = tarea.hora_inicio if tarea.hora_inicio else time(11, 0)
            tarea_dt = datetime.combine(tarea.fecha_programada, t_hora)
            horas_faltantes = (tarea_dt - ahora).total_seconds() / 3600.0

            if horas_faltantes <= 12:
                tarea_dict["prioridad"] = PrioridadTarea.EMERGENCIA
            elif horas_faltantes <= 24:
                tarea_dict["prioridad"] = PrioridadTarea.ALTA
            elif horas_faltantes <= 48:
                tarea_dict["prioridad"] = PrioridadTarea.MEDIA
            else:
                tarea_dict["prioridad"] = PrioridadTarea.BAJA

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
            TareaLimpieza.asignado_a == str(staff_id),
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
        select(TareaLimpieza).where(TareaLimpieza.id == str(tarea_id))
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
    """Crear una tarea de limpieza con prioridad visual (semáforo)."""
    tarea = TareaLimpieza(**data.model_dump())
    
    # Calcular semáforo de prioridad (simplificado: si es hoy -> Emergencia, mañana -> Media, +1 -> Baja)
    hoy = date.today()
    if tarea.fecha_programada == hoy:
        tarea.prioridad = PrioridadTarea.EMERGENCIA
    elif (tarea.fecha_programada - hoy).days == 1:
        tarea.prioridad = PrioridadTarea.MEDIA
    else:
        tarea.prioridad = PrioridadTarea.BAJA
        
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
        select(TareaLimpieza).where(TareaLimpieza.id == str(tarea_id))
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
        select(TareaLimpieza).where(TareaLimpieza.id == str(tarea_id))
    )
    tarea = result.scalar_one_or_none()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    tarea.checklist = [item.model_dump() for item in data.checklist]

    # Si la tarea no estaba en progreso (y ya está aceptada), pasar a en progreso
    if tarea.estado in [EstadoTarea.PENDIENTE, EstadoTarea.ASIGNADA_NO_CONFIRMADA, EstadoTarea.ACEPTADA]:
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
        select(TareaLimpieza).where(TareaLimpieza.id == str(tarea_id))
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
    """Subir foto de evidencia a Firebase Storage."""
    if tipo not in ("antes", "despues"):
        raise HTTPException(status_code=400, detail="tipo debe ser 'antes' o 'despues'")

    result = await db.execute(
        select(TareaLimpieza).where(TareaLimpieza.id == str(tarea_id))
    )
    tarea = result.scalar_one_or_none()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    # Subir a Firebase Storage
    import firebase_admin
    from firebase_admin import storage as fb_storage

    if not firebase_admin._apps:
        firebase_admin.initialize_app(options={"storageBucket": "clearhost-c8919.firebasestorage.app"})

    bucket = fb_storage.bucket()
    
    ext = os.path.splitext(foto.filename)[1] if foto.filename else ".jpg"
    filename = f"evidencias/{tarea_id}/{tipo}_{uuid_mod.uuid4().hex[:8]}{ext}"
    
    content = await foto.read()
    blob = bucket.blob(filename)
    blob.upload_from_string(content, content_type=foto.content_type or "image/jpeg")
    blob.make_public()
    
    foto_url = blob.public_url

    foto_info = {
        "url": foto_url,
        "filename": filename,
        "uploaded_at": datetime.utcnow().isoformat(),
    }

    if tipo == "antes":
        fotos = list(tarea.fotos_antes or [])
        fotos.append(foto_info)
        tarea.fotos_antes = fotos
    else:
        fotos = list(tarea.fotos_despues or [])
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
        select(TareaLimpieza).where(TareaLimpieza.id == str(tarea_id))
    )
    tarea = result.scalar_one_or_none()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    if tarea.estado == EstadoTarea.CLEAN_AND_READY:
        raise HTTPException(status_code=400, detail="La tarea ya está completada (Clean & Ready)")

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

    # Marcar como Clean & Ready
    tarea.estado = EstadoTarea.CLEAN_AND_READY
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
    hora_inicio: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Asignar un miembro del staff a una tarea.
    Si staff_id es None, desasigna la tarea.
    Adicionalmente permite editar la hora de inicio.
    """
    result = await db.execute(
        select(TareaLimpieza).where(TareaLimpieza.id == str(tarea_id))
    )
    tarea = result.scalar_one_or_none()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    old_staff_id = tarea.asignado_a

    if staff_id:
        # Verificar que el staff existe y está disponible
        staff_result = await db.execute(
            select(UsuarioStaff).where(UsuarioStaff.id == str(staff_id))
        )
        staff = staff_result.scalar_one_or_none()
        if not staff:
            raise HTTPException(status_code=404, detail="Staff no encontrado")
        tarea.asignado_a = str(staff_id)
        tarea.estado = EstadoTarea.ASIGNADA_NO_CONFIRMADA
        tarea.fecha_asignacion = datetime.utcnow()
    else:
        tarea.asignado_a = None
        tarea.estado = EstadoTarea.PENDIENTE
        tarea.fecha_asignacion = None

    if hora_inicio:
        try:
            tarea.hora_inicio = datetime.strptime(hora_inicio, "%H:%M").time()
        except ValueError:
            pass

    await db.flush()
    await db.refresh(tarea)

    # Notificar por WebSocket al staff anterior y nuevo
    if old_staff_id and old_staff_id != str(staff_id):
        await ws_manager.send_update_to_staff(old_staff_id, {"action": "RELOAD_TAREAS"})
    if staff_id:
        await ws_manager.send_update_to_staff(str(staff_id), {"action": "RELOAD_TAREAS"})

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
            tarea.estado = EstadoTarea.ASIGNADA_NO_CONFIRMADA
            tarea.fecha_asignacion = datetime.utcnow()
            asignadas += 1
            await ws_manager.send_update_to_staff(str(staff.id), {"action": "RELOAD_TAREAS"})

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
        select(TareaLimpieza).where(TareaLimpieza.id == str(tarea_id))
    )
    tarea = result.scalar_one_or_none()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    if tarea.estado != EstadoTarea.CLEAN_AND_READY:
        raise HTTPException(
            status_code=400,
            detail="Solo se pueden verificar tareas que estén CLEAN_AND_READY"
        )

    tarea.estado = EstadoTarea.VERIFICADA
    tarea.verificada_at = datetime.utcnow()
    await db.flush()
    await db.refresh(tarea)
    return tarea


@router.post("/{tarea_id}/whatsapp-link")
async def generar_link_whatsapp(
    tarea_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Endpoint Base (MVP) para integración con WhatsApp API.
    Genera un link único de la tarea para enviar al staff.
    """
    result = await db.execute(
        select(TareaLimpieza).where(TareaLimpieza.id == str(tarea_id))
    )
    tarea = result.scalar_one_or_none()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
        
    if not tarea.asignado:
        raise HTTPException(status_code=400, detail="La tarea no tiene personal asignado")
        
    staff = tarea.asignado
    propiedad = tarea.propiedad
    
    frontend_url = "https://clearhost-c8919.web.app" # URL de la web
    link_tarea = f"{frontend_url}/app/tarea/{tarea.id}"
    
    mensaje = (
        f"Hola {staff.nombre.split()[0]}! 👋\n\n"
        f"Tienes una nueva tarea de limpieza:\n"
        f"🏠 *Propiedad:* {propiedad.nombre}\n"
        f"📅 *Día:* {tarea.fecha_programada}\n"
        f"🕒 *Check-out:* {tarea.hora_inicio.strftime('%H:%M') if tarea.hora_inicio else '11:00'}\n"
        f"👤 *Huésped:* {tarea.reserva.nombre_huesped if tarea.reserva else 'N/A'}\n\n"
        f"Ver detalles y confirmar aquí:\n{link_tarea}"
    )
    
    import urllib.parse
    mensaje_encoded = urllib.parse.quote(mensaje)
    
    # Limpiar teléfono (quitar espacios, +, etc. si es necesario para wa.me)
    tel = staff.telefono or ""
    tel_clean = "".join(filter(str.isdigit, tel))
    
    whatsapp_url = f"https://wa.me/{tel_clean}?text={mensaje_encoded}"
    
    return {
        "message": "Link de WhatsApp generado",
        "link": whatsapp_url,
        "whatsapp_template": mensaje
    }

@router.put("/{tarea_id}/aceptar", response_model=TareaResponse)
async def aceptar_tarea(
    tarea_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Staff marca la tarea asignada como ACEPTADA."""
    result = await db.execute(
        select(TareaLimpieza).where(TareaLimpieza.id == str(tarea_id))
    )
    tarea = result.scalar_one_or_none()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    if tarea.estado != EstadoTarea.ASIGNADA_NO_CONFIRMADA:
        raise HTTPException(
            status_code=400,
            detail="Solo se pueden aceptar tareas en estado ASIGNADA_NO_CONFIRMADA"
        )

    tarea.estado = EstadoTarea.ACEPTADA
    await db.flush()
    await db.refresh(tarea)
    return tarea
