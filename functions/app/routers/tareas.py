"""
Router de Tareas de Limpieza — CRUD + Checklist + Auditoría + Fotos + Completar.
"""

import os
import io
import urllib.parse
import uuid as uuid_mod
from uuid import UUID
from typing import Optional
from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, WebSocket, WebSocketDisconnect, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.config import get_settings
from app.models.tarea_operativa import TareaOperativa, EstadoTarea, PrioridadTarea
from app.models.usuario_staff import UsuarioStaff, RolStaff
from app.dependencies import get_current_user
from app.schemas.tarea_operativa import (
    TareaCreate, TareaUpdate, TareaResponse, TareaConDetalles,
    ChecklistUpdate, AuditoriaUpdate,
)
from app.models.propiedad import Propiedad
from app.services.sync_service import trigger_sync, trigger_sync_global
from app.services.ical_sync import sync_property_ical


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

# Remove local UPLOAD_DIR as we use Firebase


@router.get("/", response_model=list[TareaConDetalles])
async def listar_tareas(
    fecha: date | None = None,
    estado: str | None = None,
    asignado_a: UUID | None = None,
    id_secuencial: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: UsuarioStaff = Depends(get_current_user),
):
    """Listar tareas con filtros opcionales y segregación por roles."""
    query = select(TareaOperativa)
    
    # ── Segregación por Roles ──
    if current_user.rol == RolStaff.STAFF:
        # El staff solo ve lo que tiene asignado
        query = query.where(TareaOperativa.asignado_a == str(current_user.id))
    elif current_user.rol == RolStaff.MANAGER_LOCAL:
        # El manager solo ve tareas de propiedades en su zona
        if current_user.zona_id:
            query = query.join(Propiedad).where(Propiedad.zona_id == current_user.zona_id)
        else:
            # Si un manager no tiene zona asignada, no ve nada por seguridad
            return []
    # SUPER_ADMIN sigue viendo todo por defecto
    
    # ── Filtrado por Estado de Reserva ──
    # Solo mostrar tareas de reservas CONFIRMADAS o tareas manuales (sin reserva)
    from app.models.reserva import Reserva, EstadoReserva
    query = query.outerjoin(Reserva).where(
        (TareaOperativa.reserva_id == None) | (Reserva.estado == EstadoReserva.CONFIRMADA)
    )
    
    # ── Filtros del usuario ──
    if fecha:
        query = query.where(TareaOperativa.fecha_programada == fecha)
    if estado:
        query = query.where(TareaOperativa.estado == estado)
    if asignado_a and current_user.rol != RolStaff.STAFF:
        query = query.where(TareaOperativa.asignado_a == str(asignado_a))
    if id_secuencial:
        query = query.where(TareaOperativa.id_secuencial == id_secuencial)
        
    query = query.order_by(TareaOperativa.fecha_programada, TareaOperativa.hora_inicio)

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
            tarea_dict["fuente_reserva"] = tarea.reserva.fuente.value if tarea.reserva.fuente else "MANUAL"
            tarea_dict["check_in"] = tarea.reserva.check_in
            tarea_dict["check_out"] = tarea.reserva.check_out
        else:
            tarea_dict["fuente_reserva"] = "ADMIN"
        if tarea.asignado:
            tarea_dict["nombre_asignado"] = tarea.asignado.nombre
        # Calcular progreso
        if tarea.estado in (EstadoTarea.CLEAN_AND_READY, EstadoTarea.VERIFICADA):
            tarea_dict["progreso"] = 100.0
        elif tarea.checklist:
            total = len(tarea.checklist)
            completados = len([i for i in tarea.checklist if i.get("completado")])
            prog_calc = round((completados / total) * 100, 1) if total > 0 else 0.0
            # Si todas están marcadas pero no se ha confirmado estado final, dejamos en 95% para evitar confusión
            if prog_calc >= 100 and tarea.estado not in (EstadoTarea.CLEAN_AND_READY, EstadoTarea.VERIFICADA):
                tarea_dict["progreso"] = 95.0
            else:
                tarea_dict["progreso"] = prog_calc
        else:
            tarea_dict["progreso"] = 0.0

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
    from app.models.reserva import Reserva, EstadoReserva
    result = await db.execute(
        select(TareaOperativa)
        .outerjoin(Reserva)
        .where(
            TareaOperativa.asignado_a == str(staff_id),
            TareaOperativa.fecha_programada == hoy,
            (TareaOperativa.reserva_id == None) | (Reserva.estado == EstadoReserva.CONFIRMADA)
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
            tarea_dict["fuente_reserva"] = tarea.reserva.fuente.value if tarea.reserva.fuente else "MANUAL"
            tarea_dict["check_in"] = tarea.reserva.check_in
            tarea_dict["check_out"] = tarea.reserva.check_out
        else:
            tarea_dict["fuente_reserva"] = "ADMIN"
        tareas_detalladas.append(TareaConDetalles(**tarea_dict))

    return tareas_detalladas


@router.get("/{tarea_id}", response_model=TareaConDetalles)
async def obtener_tarea(
    tarea_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Obtener detalle completo de una tarea."""
    result = await db.execute(
        select(TareaOperativa).where(TareaOperativa.id == str(tarea_id))
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
    # Heredar tarifario de la propiedad si no se envía
    prop_result = await db.execute(select(Propiedad).where(Propiedad.id == data.propiedad_id))
    prop = prop_result.scalar_one_or_none()
    
    tarea_data = data.model_dump()
    
    # Normalizar reserva_id (asegurar que sea None si viene vacío)
    if not tarea_data.get("reserva_id"):
        tarea_data["reserva_id"] = None

    if prop:
        if not tarea_data.get("pago_al_staff") or tarea_data["pago_al_staff"] == 0:
            tarea_data["pago_al_staff"] = prop.pago_staff
            tarea_data["moneda_tarea"] = prop.moneda_pago

    tarea = TareaOperativa(**tarea_data)
    
    # Calcular semáforo de prioridad
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

    # Notificar al staff asignado
    if tarea.asignado_a:
        from app.services.notifications import notificar_nueva_tarea
        from app.models.usuario_staff import UsuarioStaff
        staff_result = await db.execute(select(UsuarioStaff).where(UsuarioStaff.id == tarea.asignado_a))
        staff = staff_result.scalar_one_or_none()
        if staff and prop:
            try:
                await notificar_nueva_tarea(tarea, staff, prop)
            except Exception as e:
                print(f"Error al enviar push de nueva tarea: {e}")

    # Real-time sync update
    if tarea.asignado_a:
        trigger_sync(tarea.asignado_a)
    else:
        trigger_sync_global()

    return tarea


@router.get("/sync-now/", response_model=dict)
@router.post("/sync-now/", response_model=dict)
async def sync_now_tareas(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Sincroniza todas las propiedades que tengan iCal configurado.
    Útil para el botón 'Actualizar' del dashboard.
    """
    result = await db.execute(select(Propiedad).where(Propiedad.ical_url != None))
    propiedades = result.scalars().all()
    
    sync_count = 0
    for prop in propiedades:
        background_tasks.add_task(sync_property_ical, str(prop.id))
        sync_count += 1
        
    return {
        "status": "success",
        "message": f"Sincronización iniciada para {sync_count} propiedades",
        "timestamp": datetime.utcnow().isoformat()
    }



@router.put("/{tarea_id}", response_model=TareaResponse)
async def actualizar_tarea(
    tarea_id: UUID,
    data: TareaUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Actualizar información general de una tarea."""
    result = await db.execute(
        select(TareaOperativa).where(TareaOperativa.id == str(tarea_id))
    )
    tarea = result.scalar_one_or_none()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    # Protección: No permitir editar tareas que vienen de iCal (AIRBNB, BOOKING, etc)
    if tarea.reserva and tarea.reserva.fuente.value != "MANUAL":
        raise HTTPException(
            status_code=403, 
            detail=f"No se puede editar tareas de {tarea.reserva.fuente.value}. Solo tareas manuales."
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tarea, field, value)

    await db.flush()
    await db.refresh(tarea)
    
    # Real-time sync update
    if tarea.asignado_a: trigger_sync(tarea.asignado_a)
    else: trigger_sync_global()
        
    return tarea


@router.put("/{tarea_id}/checklist", response_model=TareaResponse)
async def actualizar_checklist(
    tarea_id: UUID,
    data: ChecklistUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Actualizar el checklist digital de la tarea."""
    result = await db.execute(
        select(TareaOperativa).where(TareaOperativa.id == str(tarea_id))
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
        select(TareaOperativa).where(TareaOperativa.id == str(tarea_id))
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

    print(f"Subiendo foto {tipo} para tarea {tarea_id}. Archivo: {foto.filename}")
    
    # Buscar tarea en la BD
    result = await db.execute(
        select(TareaOperativa).where(TareaOperativa.id == str(tarea_id))
    )
    tarea = result.scalar_one_or_none()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    # Subir a Firebase Storage
    import firebase_admin
    from firebase_admin import storage as fb_storage
    
    try:
        settings = get_settings()
        print(f"DEBUG: Intentando usar bucket: {settings.FB_STORAGE_BUCKET}")
        # Asegurar bucket explícitamente desde configuración
        try:
            bucket = fb_storage.bucket(settings.FB_STORAGE_BUCKET)
            print(f"DEBUG: Bucket obtenido: {bucket.name}")
        except Exception as be:
            print(f"DEBUG: Error al obtener bucket explícito: {be}")
            bucket = fb_storage.bucket()
            print(f"DEBUG: Usando bucket por defecto: {bucket.name}")
        
        ext = os.path.splitext(foto.filename)[1].lower() if foto.filename else ".jpg"
        filename = f"tareas/{tarea_id}/{uuid_mod.uuid4().hex[:8]}{ext}"
        print(f"DEBUG: Generando archivo en Storage: {filename}")
        
        blob = bucket.blob(filename)
        
        # Redimensionar imagen para ahorrar espacio
        try:
            from PIL import Image
            print(f"DEBUG: Pillow version: {Image.__version__}")
            print(f"DEBUG: Leyendo archivo para redimensionar...")
            img_data = await foto.read()
            img = Image.open(io.BytesIO(img_data))
            
            # Convertir a RGB si tiene transparencia (PNG/HEIC)
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            
            # Redimensionar manteniendo proporción (max 1280px)
            max_size = (1280, 1280)
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Guardar en buffer como JPEG optimizado
            output_buffer = io.BytesIO()
            img.save(output_buffer, format="JPEG", quality=85)
            output_buffer.seek(0)
            
            print(f"DEBUG: Subiendo archivo redimensionado ({len(output_buffer.getbuffer())} bytes)...")
            blob.upload_from_file(output_buffer, content_type="image/jpeg")
            
        except Exception as img_err:
            print(f"DEBUG: Falló el redimensionamiento, subiendo original: {img_err}")
            # Si falla el redimensionamiento, intentamos subir el original
            await foto.seek(0)
            blob.upload_from_file(foto.file, content_type=foto.content_type or "image/jpeg")
        
        # Metadatos del token (Standard Firebase pattern)
        download_token = str(uuid_mod.uuid4())
        blob.metadata = {"firebaseStorageDownloadTokens": download_token}
        blob.patch() # Persistir metadatos
        
        encoded_name = urllib.parse.quote(filename, safe="")
        foto_url = f"https://firebasestorage.googleapis.com/v0/b/{bucket.name}/o/{encoded_name}?alt=media&token={download_token}"

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

        await db.commit()
        await db.refresh(tarea)
        return tarea

    except Exception as e:
        print(f"Error crítico en subir_foto: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, 
            detail=f"Error en servidor al procesar foto: {str(e)}"
        )


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
        select(TareaOperativa).where(TareaOperativa.id == str(tarea_id))
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
        select(TareaOperativa).where(TareaOperativa.id == str(tarea_id))
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
        trigger_sync(old_staff_id)
    if staff_id:
        await ws_manager.send_update_to_staff(str(staff_id), {"action": "RELOAD_TAREAS"})
        trigger_sync(str(staff_id))
    
    # Global sync for admin panel overview
    trigger_sync_global()

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
        select(TareaOperativa).where(TareaOperativa.id == str(tarea_id))
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
    
    # ── Lógica de Inventario: Descontar Faltantes/Dañados ──
    try:
        if tarea.auditoria_activos:
            from app.models.inventario_articulo import InventarioArticulo
            from app.services.notifications import notificar_alerta_inventario
            
            for item in tarea.auditoria_activos:
                estado_item = item.get("estado")
                # Si está FALTANTE o DAÑADO, descontamos 1 unidad del stock general
                if estado_item in ("FALTANTE", "DAÑADO"):
                    articulo_nombre = item.get("articulo")
                    # Buscar en inventario para esta propiedad o zona
                    result_inv = await db.execute(
                        select(InventarioArticulo).where(
                            InventarioArticulo.propiedad_id == tarea.propiedad_id,
                            InventarioArticulo.articulo == articulo_nombre
                        )
                    )
                    inv_item = result_inv.scalar_one_or_none()
                    
                    if inv_item:
                        inv_item.stock_actual = max(0, inv_item.stock_actual - 1)
                        logger.info(f"Inventario: {articulo_nombre} -1 por reporte en tarea {tarea.id}")
                        
                        # Alerta stock mínimo
                        if inv_item.stock_actual < inv_item.stock_minimo:
                            await notificar_alerta_inventario(inv_item, db)
    except Exception as e:
        logger.error(f"Error procesando inventario tras verificación: {e}")

    await db.flush()
    await db.refresh(tarea)
    return tarea


@router.api_route("/{tarea_id}/whatsapp-link", methods=["GET", "POST"])
@router.api_route("/{tarea_id}/whatsapp", methods=["GET", "POST"])
async def generar_link_whatsapp(
    tarea_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Endpoint Base (MVP) para integración con WhatsApp API.
    Genera un link único de la tarea para enviar al staff.
    """
    result = await db.execute(
        select(TareaOperativa).where(TareaOperativa.id == str(tarea_id))
    )
    tarea = result.scalar_one_or_none()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
        
    if not tarea.asignado:
        raise HTTPException(status_code=400, detail="La tarea no tiene personal asignado")
        
    staff = tarea.asignado
    propiedad = tarea.propiedad
    
    # Limpiar teléfono (quitar espacios, +, etc. si es necesario para wa.me)
    tel = staff.telefono or ""
    tel_clean = "".join(filter(str.isdigit, tel))
    
    if tarea.estado in [EstadoTarea.PENDIENTE, EstadoTarea.ASIGNADA_NO_CONFIRMADA]:
        frontend_url = "https://clearhost-c8919.web.app" # URL de la web
        link_tarea = f"{frontend_url}/app/tarea/{tarea.id}/confirmar"
        
        id_label = f"T-{tarea.id_secuencial}" if tarea.id_secuencial else "Nueva Tarea"
        
        mensaje = (
            f"Hola {staff.nombre.split()[0]}! 👋\n\n"
            f"Tienes una nueva tarea asignada: *{id_label}*\n"
            f"🏠 *Propiedad:* {propiedad.nombre}\n"
            f"📅 *Día:* {tarea.fecha_programada.strftime('%d/%m/%Y') if hasattr(tarea.fecha_programada, 'strftime') else tarea.fecha_programada}\n"
            f"🕒 *Check-out:* {tarea.hora_inicio.strftime('%H:%M') if tarea.hora_inicio else '11:00'}\n"
            f"👤 *Huésped:* {tarea.reserva.nombre_huesped if tarea.reserva else 'N/A'}\n\n"
            f"Por favor, confírmala aquí:\n{link_tarea}"
        )
        import urllib.parse
        mensaje_encoded = urllib.parse.quote(mensaje)
        whatsapp_url = f"https://wa.me/{tel_clean}?text={mensaje_encoded}"
        res_msg = "Link de WhatsApp con confirmación generado"
    else:
        whatsapp_url = f"https://wa.me/{tel_clean}"
        mensaje = None
        res_msg = "Link de WhatsApp (chat directo) generado"
    
    return {
        "message": res_msg,
        "link": whatsapp_url,
        "whatsapp_template": mensaje
    }

@router.get("/public/{tarea_id}")
async def get_tarea_publica(
    tarea_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Obtener info básica de una tarea sin auth (para el link de WhatsApp)."""
    result = await db.execute(
        select(TareaOperativa).where(TareaOperativa.id == str(tarea_id))
    )
    tarea = result.scalar_one_or_none()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    
    return {
        "id": tarea.id,
        "id_secuencial": tarea.id_secuencial,
        "tipo_tarea": tarea.tipo_tarea,
        "fecha_programada": tarea.fecha_programada,
        "hora_inicio": tarea.hora_inicio.strftime("%H:%M") if tarea.hora_inicio else "11:00",
        "nombre_propiedad": tarea.propiedad.nombre if tarea.propiedad else "N/A",
        "nombre_huesped": tarea.reserva.nombre_huesped if tarea.reserva else None,
        "estado": tarea.estado
    }

@router.put("/public/{tarea_id}/aceptar")
async def aceptar_tarea_publica(
    tarea_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Aceptar tarea desde el link público."""
    result = await db.execute(
        select(TareaOperativa).where(TareaOperativa.id == str(tarea_id))
    )
    tarea = result.scalar_one_or_none()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    
    if tarea.estado not in (EstadoTarea.PENDIENTE, EstadoTarea.ASIGNADA_NO_CONFIRMADA):
         # Si ya está aceptada o en progreso, no dar error, solo devolver éxito
         return {"message": "Tarea ya estaba aceptada o en proceso"}

    tarea.estado = EstadoTarea.ACEPTADA
    await db.flush()
    
    # Sync real-time
    if tarea.asignado_a:
        trigger_sync(tarea.asignado_a)
    trigger_sync_global()
    
    return {"message": "Tarea aceptada con éxito"}

@router.put("/public/{tarea_id}/rechazar")
async def rechazar_tarea_publica(
    tarea_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Rechazar (desasignar) tarea desde el link público."""
    result = await db.execute(
        select(TareaOperativa).where(TareaOperativa.id == str(tarea_id))
    )
    tarea = result.scalar_one_or_none()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    
    # Al rechazar, vuelve a PENDIENTE y se quita el asignado
    tarea.estado = EstadoTarea.PENDIENTE
    old_staff_id = tarea.asignado_a
    tarea.asignado_a = None
    await db.flush()
    
    if old_staff_id:
        trigger_sync(old_staff_id)
    trigger_sync_global()
    
    return {"message": "Tarea rechazada y devuelta a la bolsa"}

@router.put("/{tarea_id}/aceptar", response_model=TareaResponse)
async def aceptar_tarea(
    tarea_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Staff marca la tarea asignada como ACEPTADA."""
    result = await db.execute(
        select(TareaOperativa).where(TareaOperativa.id == str(tarea_id))
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

@router.delete("/{tarea_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_tarea(
    tarea_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UsuarioStaff = Depends(get_current_user),
):
    """Eliminar físicamente una tarea operativa."""
    result = await db.execute(
        select(TareaOperativa).where(TareaOperativa.id == str(tarea_id))
    )
    tarea = result.scalar_one_or_none()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    # Protección: No permitir borrar tareas de plataformas
    if tarea.reserva and tarea.reserva.fuente.value != "MANUAL":
        raise HTTPException(
            status_code=403, 
            detail=f"No se puede eliminar tareas de {tarea.reserva.fuente.value}."
        )

    # Guardar ID del asignado para sync después del borrado
    staff_id = tarea.asignado_a

    await db.delete(tarea)
    await db.flush()
    
    # Real-time sync update
    if staff_id: trigger_sync(staff_id)
    else: trigger_sync_global()
    
    return None
