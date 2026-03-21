from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional, List, Any
from app.models.incidencia import TipoIncidencia, EstadoIncidencia

class IncidenciaBase(BaseModel):
    propiedad_id: Any
    tarea_id: Optional[Any] = None
    titulo: str
    descripcion: str
    tipo: TipoIncidencia = TipoIncidencia.REPARACION
    urgente: bool = False
    costo_estimado: Any = 0.0

class IncidenciaCreate(IncidenciaBase):
    pass

class IncidenciaUpdate(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    estado: Optional[EstadoIncidencia] = None
    urgente: Optional[bool] = None
    costo_estimado: Optional[float] = None
    notas_admin: Optional[str] = None
    comprobante_url: Optional[str] = None

class IncidenciaResponse(IncidenciaBase):
    id: Any
    reportado_por: Optional[Any] = None
    estado: EstadoIncidencia
    fotos: Optional[list] = []
    token_aprobacion: Optional[str] = None
    notas_admin: Optional[str] = None
    comprobante_url: Optional[str] = None
    fecha_reporte: datetime
    fecha_resolucion: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}

class IncidenciaConDetalles(IncidenciaResponse):
    nombre_propiedad: Optional[str] = None
    reportero_nombre: Optional[str] = None
