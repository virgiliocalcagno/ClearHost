"""
Schemas Pydantic para Reserva.
Sincronizado con backend/v2.0 para soportar doc_identidad y telefono_huesped.
"""

from datetime import datetime, date, time
from typing import Optional, Any
from pydantic import BaseModel, Field

from app.models.reserva import FuenteReserva, EstadoReserva


class ReservaCreate(BaseModel):
    propiedad_id: Any
    fuente: FuenteReserva = FuenteReserva.MANUAL
    nombre_huesped: str = Field(..., min_length=1, max_length=300)
    doc_identidad: Optional[str] = None
    nacionalidad: Optional[str] = None
    telefono_huesped: Optional[str] = None
    check_in: date
    check_out: date
    num_huespedes: int = Field(default=1, ge=1)
    notas: Optional[str] = None


class ReservaUpdate(BaseModel):
    propiedad_id: Optional[Any] = None
    fuente: Optional[FuenteReserva] = None
    nombre_huesped: Optional[str] = None
    doc_identidad: Optional[str] = None
    nacionalidad: Optional[str] = None
    telefono_huesped: Optional[str] = None
    check_in: Optional[date] = None
    check_out: Optional[date] = None
    num_huespedes: Optional[int] = None
    estado: Optional[EstadoReserva] = None
    notas: Optional[str] = None


class ReservaResponse(BaseModel):
    id: Any
    propiedad_id: Any
    fuente: FuenteReserva
    uid_ical: Optional[str] = None
    nombre_huesped: str
    doc_identidad: Optional[str] = None
    nacionalidad: Optional[str] = None
    telefono_huesped: Optional[str] = None
    check_in: date
    check_out: date
    num_huespedes: int
    estado: EstadoReserva
    notas: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
