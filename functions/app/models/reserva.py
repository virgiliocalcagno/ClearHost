"""
Modelo Reserva — Representa una reservación en una propiedad.
Sincronizado con backend/v2.0 para soporte de Identidad y Teléfono.
"""

import uuid
import enum
from datetime import datetime, date, time

from sqlalchemy import String, Integer, Float, Boolean, Text, Date, DateTime, JSON, Time, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class FuenteReserva(str, enum.Enum):
    AIRBNB = "AIRBNB"
    BOOKING = "BOOKING"
    VRBO = "VRBO"
    MANUAL = "MANUAL"
    OTRO = "OTRO"


class EstadoReserva(str, enum.Enum):
    CONFIRMADA = "CONFIRMADA"
    CANCELADA = "CANCELADA"
    COMPLETADA = "COMPLETADA"


class Reserva(Base):
    __tablename__ = "reservas"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    propiedad_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("propiedades.id"), nullable=False
    )

    fuente: Mapped[FuenteReserva] = mapped_column(
        SQLEnum(FuenteReserva), default=FuenteReserva.MANUAL, nullable=False
    )

    uid_ical: Mapped[str | None] = mapped_column(String(500), unique=True, nullable=True)

    nombre_huesped: Mapped[str] = mapped_column(String(300), nullable=False)
    doc_identidad: Mapped[str | None] = mapped_column(String(100), nullable=True)
    nacionalidad: Mapped[str | None] = mapped_column(String(100), nullable=True)
    telefono_huesped: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    check_in: Mapped[date] = mapped_column(Date, nullable=False)
    check_out: Mapped[date] = mapped_column(Date, nullable=False)
    num_huespedes: Mapped[int] = mapped_column(Integer, default=1)

    estado: Mapped[EstadoReserva] = mapped_column(
        SQLEnum(EstadoReserva), default=EstadoReserva.CONFIRMADA, nullable=False
    )
    
    notas: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    propiedad = relationship("Propiedad", back_populates="reservas")
    tareas = relationship("TareaOperativa", back_populates="reserva", lazy="selectin")

    def __repr__(self):
        return f"<Reserva {self.nombre_huesped} @ {self.check_in} - {self.check_out}>"
