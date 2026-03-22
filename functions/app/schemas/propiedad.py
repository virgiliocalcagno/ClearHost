"""
Schemas Pydantic para Propiedad.
"""

from datetime import datetime, time
from typing import Optional, Any
from pydantic import BaseModel, Field


class ChecklistItemTemplate(BaseModel):
    item: str
    requerido: bool = True


class ActivoInventario(BaseModel):
    activo: str
    cantidad: int = 1


class PropiedadCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=200)
    direccion: str = Field(..., min_length=1, max_length=500)
    ciudad: str = Field(..., min_length=1, max_length=100)
    num_habitaciones: int = Field(default=1, ge=1)
    ical_url: Optional[str] = None
    checklist_template: Optional[list[ChecklistItemTemplate]] = None
    activos_inventario: Optional[list[ActivoInventario]] = None
    notas: Optional[str] = None
    hora_checkout: Optional[time] = None
    hora_checkin: Optional[time] = None
    propietario_id: Optional[str] = None


class PropiedadUpdate(BaseModel):
    nombre: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    num_habitaciones: Optional[int] = None
    ical_url: Optional[str] = None
    checklist_template: Optional[list[ChecklistItemTemplate]] = None
    activos_inventario: Optional[list[ActivoInventario]] = None
    notas: Optional[str] = None
    activa: Optional[bool] = None
    hora_checkout: Optional[time] = None
    hora_checkin: Optional[time] = None
    propietario_id: Optional[str] = None


class PropiedadResponse(BaseModel):
    id: Any
    nombre: str
    direccion: str
    ciudad: str
    num_habitaciones: int
    ical_url: Optional[str] = None
    ical_last_sync: Optional[datetime] = None
    checklist_template: Optional[list] = None
    activos_inventario: Optional[list] = None
    notas: Optional[str] = None
    activa: bool
    hora_checkout: Optional[time] = None
    hora_checkin: Optional[time] = None
    propietario_id: Optional[str] = None
    propietario_nombre: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
