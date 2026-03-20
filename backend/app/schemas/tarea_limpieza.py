"""
Schemas Pydantic para TareaLimpieza.
"""

from datetime import datetime, date, time
from uuid import UUID
from pydantic import BaseModel
from typing import Optional

from app.models.tarea_limpieza import EstadoTarea


class ChecklistItem(BaseModel):
    item: str
    completado: bool = False
    requerido: bool = True


class AuditoriaActivo(BaseModel):
    activo: str
    estado: str = "OK"  # OK, FALTANTE, DAÑADO
    cantidad_esperada: int = 1
    cantidad_encontrada: int = 1
    notas: Optional[str] = None


class TareaCreate(BaseModel):
    reserva_id: UUID
    propiedad_id: UUID
    asignado_a: Optional[UUID] = None
    fecha_programada: date
    hora_inicio: Optional[time] = None
    checklist: Optional[list[ChecklistItem]] = None
    auditoria_activos: Optional[list[AuditoriaActivo]] = None
    requiere_lavado_ropa: bool = True


class TareaUpdate(BaseModel):
    asignado_a: Optional[UUID] = None
    fecha_programada: Optional[date] = None
    hora_inicio: Optional[time] = None
    estado: Optional[EstadoTarea] = None
    notas_staff: Optional[str] = None


class ChecklistUpdate(BaseModel):
    checklist: list[ChecklistItem]


class AuditoriaUpdate(BaseModel):
    auditoria_activos: list[AuditoriaActivo]


class FotoUpload(BaseModel):
    tipo: str  # "antes" o "despues"
    url: str
    descripcion: Optional[str] = None


class TareaResponse(BaseModel):
    id: UUID
    reserva_id: UUID
    propiedad_id: UUID
    asignado_a: Optional[UUID] = None
    fecha_programada: date
    hora_inicio: Optional[time] = None
    estado: EstadoTarea
    checklist: Optional[list] = None
    auditoria_activos: Optional[list] = None
    fotos_antes: Optional[list] = None
    fotos_despues: Optional[list] = None
    requiere_lavado_ropa: bool
    notas_staff: Optional[str] = None
    completada_at: Optional[datetime] = None
    verificada_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TareaConDetalles(TareaResponse):
    """Tarea con información de propiedad y reserva incluida."""
    nombre_propiedad: Optional[str] = None
    direccion_propiedad: Optional[str] = None
    nombre_huesped: Optional[str] = None
    nombre_asignado: Optional[str] = None
    check_in: Optional[date] = None
    check_out: Optional[date] = None
