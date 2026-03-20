"""
Router de Incidencias — Gestión de reparaciones, misceláneos y aprobaciones.
"""

import uuid as uuid_mod
from uuid import UUID
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.incidencia import Incidencia, TipoIncidencia, EstadoIncidencia
from app.models.propiedad import Propiedad
from app.models.usuario_staff import UsuarioStaff
from app.schemas.incidencia import IncidenciaCreate, IncidenciaUpdate, IncidenciaResponse, IncidenciaConDetalles

router = APIRouter(prefix="/incidencias", tags=["Mantenimiento e Incidencias"])


@router.get("/", response_model=list[IncidenciaConDetalles])
async def listar_incidencias(
    propiedad_id: Optional[UUID] = None,
    estado: Optional[EstadoIncidencia] = None,
    tipo: Optional[TipoIncidencia] = None,
    db: AsyncSession = Depends(get_db),
):
    """Listar incidencias con filtros opcionales."""
    query = select(Incidencia)
    if propiedad_id:
        query = query.where(Incidencia.propiedad_id == str(propiedad_id))
    if estado:
        query = query.where(Incidencia.estado == estado)
    if tipo:
        query = query.where(Incidencia.tipo == tipo)
    
    query = query.order_by(Incidencia.fecha_reporte.desc())
    result = await db.execute(query)
    incidencias = result.scalars().all()

    detalles = []
    for inc in incidencias:
        data = IncidenciaResponse.model_validate(inc).model_dump()
        if inc.propiedad:
            data["nombre_propiedad"] = inc.propiedad.nombre
        if inc.reportero:
            data["reportero_nombre"] = inc.reportero.nombre
        detalles.append(IncidenciaConDetalles(**data))
    
    return detalles


@router.post("/", response_model=IncidenciaResponse, status_code=status.HTTP_201_CREATED)
async def crear_incidencia(
    data: IncidenciaCreate,
    db: AsyncSession = Depends(get_db),
    # TODO: Obtener current_user para reportar_por
):
    """Crear un reporte de incidencia o necesidad de compra."""
    # Verificar propiedad
    prop = await db.get(Propiedad, str(data.propiedad_id))
    if not prop:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")

    incidencia = Incidencia(
        **data.model_dump(),
        token_aprobacion=uuid_mod.uuid4().hex if data.tipo == TipoIncidencia.REPARACION or data.costo_estimado else None
    )
    db.add(incidencia)
    await db.commit()
    await db.refresh(incidencia)
    return incidencia


@router.get("/{incidencia_id}", response_model=IncidenciaConDetalles)
async def obtener_incidencia(incidencia_id: UUID, db: AsyncSession = Depends(get_db)):
    inc = await db.get(Incidencia, str(incidencia_id))
    if not inc:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada")
    
    data = IncidenciaResponse.model_validate(inc).model_dump()
    if inc.propiedad:
        data["nombre_propiedad"] = inc.propiedad.nombre
    if inc.reportero:
        data["reportero_nombre"] = inc.reportero.nombre
    return IncidenciaConDetalles(**data)


@router.put("/{incidencia_id}", response_model=IncidenciaResponse)
async def actualizar_incidencia(
    incidencia_id: UUID, 
    data: IncidenciaUpdate, 
    db: AsyncSession = Depends(get_db)
):
    inc = await db.get(Incidencia, str(incidencia_id))
    if not inc:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(inc, key, value)
    
    if inc.estado == EstadoIncidencia.COMPLETADO and not inc.fecha_resolucion:
        inc.fecha_resolucion = datetime.utcnow()

    await db.commit()
    await db.refresh(inc)
    return inc


@router.post("/{incidencia_id}/fotos", response_model=IncidenciaResponse)
async def subir_foto_incidencia(
    incidencia_id: UUID,
    foto: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Subir foto de evidencia del daño o compra a Firebase Storage."""
    inc = await db.get(Incidencia, str(incidencia_id))
    if not inc:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada")

    import firebase_admin
    from firebase_admin import storage as fb_storage

    if not firebase_admin._apps:
        firebase_admin.initialize_app(options={"storageBucket": "clearhost-c8919.firebasestorage.app"})

    bucket = fb_storage.bucket()
    ext = ".jpg"
    filename = f"incidencias/{incidencia_id}/{uuid_mod.uuid4().hex[:8]}{ext}"
    
    content = await foto.read()
    blob = bucket.blob(filename)
    blob.upload_from_string(content, content_type=foto.content_type or "image/jpeg")
    blob.make_public()
    
    fotos = list(inc.fotos or [])
    fotos.append({"url": blob.public_url, "uploaded_at": datetime.utcnow().isoformat()})
    inc.fotos = fotos

    await db.commit()
    await db.refresh(inc)
    return inc


@router.get("/public/pago/{token}", response_model=IncidenciaConDetalles)
async def obtener_incidencia_publica(token: str, db: AsyncSession = Depends(get_db)):
    """Obtener info detallada de la incidencia vía token seguro (para el propietario)."""
    result = await db.execute(select(Incidencia).where(Incidencia.token_aprobacion == token))
    inc = result.scalar_one_or_none()
    if not inc:
        raise HTTPException(status_code=404, detail="El link ha expirado o es inválido")
    
    data = IncidenciaResponse.model_validate(inc).model_dump()
    if inc.propiedad:
        data["nombre_propiedad"] = inc.propiedad.nombre
    if inc.reportero:
        data["reportero_nombre"] = inc.reportero.nombre
    return IncidenciaConDetalles(**data)


@router.get("/public/aprobar/{token}", response_model=dict)
async def aprobar_desde_link_publico(token: str, db: AsyncSession = Depends(get_db)):
    """Aprobar un presupuesto mediante el link enviado al propietario."""
    result = await db.execute(select(Incidencia).where(Incidencia.token_aprobacion == token))
    inc = result.scalar_one_or_none()
    if not inc:
        raise HTTPException(status_code=404, detail="Link inválido o caducado")
    
    inc.estado = EstadoIncidencia.APROBADO
    inc.notas_admin = (inc.notas_admin or "") + f"\n[Aprobado vía link público el {datetime.now().strftime('%Y-%m-%d %H:%M')}]"
    await db.commit()
    return {"message": f"Incidencia '{inc.titulo}' aprobada correctamente", "estado": inc.estado}
