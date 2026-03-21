"""
Router de Incidencias — Gestión de reparaciones, misceláneos y aprobaciones.
"""

import os
import urllib.parse
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
    propiedad_id: Optional[str] = None,
    estado: Optional[EstadoIncidencia] = None,
    tipo: Optional[TipoIncidencia] = None,
    db: AsyncSession = Depends(get_db),
):
    """Listar incidencias con filtros opcionales."""
    try:
        # Usamos selectinload para asegurar que las relaciones se carguen en entorno asíncrono
        query = select(Incidencia).options(
            selectinload(Incidencia.propiedad),
            selectinload(Incidencia.reportero)
        )
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
            inc_data = IncidenciaResponse.model_validate(inc).model_dump()
            detalles.append(IncidenciaConDetalles(
                **inc_data,
                nombre_propiedad=inc.propiedad.nombre if inc.propiedad else "Propiedad desconocida",
                reportero_nombre=inc.reportero.nombre if inc.reportero else "Staff"
            ))
        
        return detalles
    except Exception as e:
        print(f"ERROR LISTAR_INCIDENCIAS: {e}")
        return []


@router.post("/", response_model=IncidenciaResponse, status_code=status.HTTP_201_CREATED)
async def crear_incidencia(
    data: IncidenciaCreate,
    db: AsyncSession = Depends(get_db),
):
    """Crear un reporte de incidencia o necesidad de compra."""
    try:
        # 1. Verificar propiedad con ID en formato string
        prop_id_str = str(data.propiedad_id)
        prop = await db.get(Propiedad, prop_id_str)
        if not prop:
            raise HTTPException(status_code=404, detail=f"Propiedad {prop_id_str} no encontrada")

        # 2. Preparar token
        token = None
        if data.tipo == TipoIncidencia.REPARACION or (data.costo_estimado and data.costo_estimado > 0):
            token = uuid_mod.uuid4().hex

        # 3. Crear objeto manualmente para control total
        incidencia = Incidencia(
            id=str(uuid_mod.uuid4()),
            propiedad_id=prop_id_str,
            tarea_id=str(data.tarea_id) if data.tarea_id else None,
            reportado_por=None,
            titulo=data.titulo,
            descripcion=data.descripcion,
            tipo=data.tipo,
            estado=EstadoIncidencia.PENDIENTE,
            urgente=data.urgente,
            fotos=[],
            costo_estimado=float(data.costo_estimado or 0.0),
            token_aprobacion=token,
            fecha_reporte=datetime.utcnow()
        )
        
        db.add(incidencia)
        await db.commit()
        
        # 4. Devolver respuesta limpia usando los datos que ya tenemos
        # (Usamos db.refresh solo si es necesario, pero commit ya persistió)
        await db.refresh(incidencia)
        return incidencia

    except Exception as e:
        print(f"CRITICAL ERROR IN CREAR_INCIDENCIA: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.get("/{incidencia_id}", response_model=IncidenciaConDetalles)
async def obtener_incidencia(incidencia_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Incidencia)
        .where(Incidencia.id == str(incidencia_id))
        .options(selectinload(Incidencia.propiedad), selectinload(Incidencia.reportero))
    )
    inc = result.scalar_one_or_none()
    if not inc:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada")
    
    inc_data = IncidenciaResponse.model_validate(inc).model_dump()
    extra = {
        "nombre_propiedad": inc.propiedad.nombre if inc.propiedad else None,
        "reportero_nombre": inc.reportero.nombre if inc.reportero else None
    }
    return IncidenciaConDetalles(**{**inc_data, **extra})


@router.put("/{incidencia_id}", response_model=IncidenciaResponse)
async def actualizar_incidencia(
    incidencia_id: str, 
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
    incidencia_id: str,
    foto: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Subir foto de evidencia del daño o compra a Firebase Storage."""
    inc = await db.get(Incidencia, str(incidencia_id))
    if not inc:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada")

    # Subir a Firebase Storage
    import firebase_admin
    from firebase_admin import storage as fb_storage
    
    # Asegurar bucket explícitamente y Token
    try:
        bucket = fb_storage.bucket("clearhost-c8919.appspot.com")
    except:
        bucket = fb_storage.bucket()
        
    ext = os.path.splitext(foto.filename)[1] if foto.filename else ".jpg"
    filename = f"incidencias/{incidencia_id}/{uuid_mod.uuid4().hex[:8]}{ext}"
    
    blob = bucket.blob(filename)
    
    # Reposicionar y subir (streaming)
    await foto.seek(0)
    blob.upload_from_file(foto.file, content_type=foto.content_type or "image/jpeg")
    
    # Metadatos del token
    download_token = str(uuid_mod.uuid4())
    blob.metadata = {"firebaseStorageDownloadTokens": download_token}
    blob.patch()
    
    encoded_name = urllib.parse.quote(filename, safe="")
    foto_url = f"https://firebasestorage.googleapis.com/v0/b/{bucket.name}/o/{encoded_name}?alt=media&token={download_token}"
    
    fotos = list(inc.fotos or [])
    fotos.append({"url": foto_url, "uploaded_at": datetime.utcnow().isoformat()})
    inc.fotos = fotos

    await db.commit()
    await db.refresh(inc)
    return inc


@router.get("/public/pago/{token}", response_model=IncidenciaConDetalles)
async def obtener_incidencia_publica(token: str, db: AsyncSession = Depends(get_db)):
    """Obtener info detallada de la incidencia vía token seguro (para el propietario)."""
    result = await db.execute(
        select(Incidencia)
        .where(Incidencia.token_aprobacion == token)
        .options(selectinload(Incidencia.propiedad), selectinload(Incidencia.reportero))
    )
    inc = result.scalar_one_or_none()
    if not inc:
        raise HTTPException(status_code=404, detail="El link ha expirado o es inválido")
    
    inc_data = IncidenciaResponse.model_validate(inc).model_dump()
    extra = {
        "nombre_propiedad": inc.propiedad.nombre if inc.propiedad else None,
        "reportero_nombre": inc.reportero.nombre if inc.reportero else None
    }
    return IncidenciaConDetalles(**{**inc_data, **extra})


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
