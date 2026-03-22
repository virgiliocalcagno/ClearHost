"""
Router de Incidencias — Gestión de reparaciones, misceláneos y aprobaciones.
"""

import os
import io
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
from app.config import get_settings
from app.models.incidencia import Incidencia, TipoIncidencia, EstadoIncidencia
from app.models.propiedad import Propiedad
from app.models.usuario_staff import UsuarioStaff
from app.schemas.incidencia import IncidenciaCreate, IncidenciaUpdate, IncidenciaResponse, IncidenciaConDetalles
from app.services.sync_service import trigger_sync, trigger_sync_global

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
        prop_id_str = str(data.propiedad_id)
        prop = await db.get(Propiedad, prop_id_str)
        if not prop:
            raise HTTPException(status_code=404, detail=f"Propiedad {prop_id_str} no encontrada")

        token = None
        if data.tipo == TipoIncidencia.REPARACION or (data.costo_estimado and data.costo_estimado > 0):
            token = uuid_mod.uuid4().hex

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
        await db.refresh(incidencia)
        
        return incidencia

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
