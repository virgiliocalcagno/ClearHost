"""
Schemas Pydantic para Reserva.
"""

from datetime import datetime, date
from uuid import UUID
from pydantic import BaseModel, Field
from typing import Optional

from app.models.reserva import FuenteReserva, EstadoReserva


class ReservaCreate(BaseModel):
    propiedad_id: UUID
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
    id: UUID
    propiedad_id: UUID
    fuente: FuenteReserva
    uid_ical: Optional[str] = None
    nombre_huesped: str
    doc_identidad: Optional[str] = None
    nacionalidad: Optional[str] = None
    telefono_huesped: Optional[str] = None
    telefono_ultimos_4: Optional[str] = None
    codigo_reserva_canal: Optional[str] = None
    check_in: date
    check_out: date
    num_huespedes: int
    estado: EstadoReserva
    notas: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
