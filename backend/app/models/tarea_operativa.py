"""
Modelo TareaLimpieza — Tarea de limpieza y preparación de propiedad.
Incluye checklist digital, auditoría de activos y fotos de evidencia.
"""

import uuid
import enum
from datetime import datetime, date, time

from sqlalchemy import String, Date, Time, DateTime, Text, Boolean, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class EstadoTarea(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    EN_PROGRESO = "EN_PROGRESO"
    COMPLETADA = "COMPLETADA"
    VERIFICADA = "VERIFICADA"


class TareaLimpieza(Base):
    __tablename__ = "tareas_limpieza"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    reserva_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("reservas.id"), nullable=False
    )
    propiedad_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("propiedades.id"), nullable=False
    )
    asignado_a: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("usuarios_staff.id"), nullable=True
    )

    fecha_programada: Mapped[date] = mapped_column(Date, nullable=False)
    hora_inicio: Mapped[time | None] = mapped_column(Time, nullable=True)

    estado: Mapped[EstadoTarea] = mapped_column(
        SQLEnum(EstadoTarea), default=EstadoTarea.PENDIENTE, nullable=False
    )

    # Checklist digital con validaciones booleanas
    checklist: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Auditoría de activos por reserva
    auditoria_activos: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # URLs de fotos de evidencia
    fotos_antes: Mapped[dict | None] = mapped_column(JSON, nullable=True, default=list)
    fotos_despues: Mapped[dict | None] = mapped_column(JSON, nullable=True, default=list)

    requiere_lavado_ropa: Mapped[bool] = mapped_column(Boolean, default=True)

    notas_staff: Mapped[str | None] = mapped_column(Text, nullable=True)

    completada_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    verificada_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    reserva = relationship("Reserva", back_populates="tareas", lazy="selectin")
    propiedad = relationship("Propiedad", back_populates="tareas", lazy="selectin")
    asignado = relationship("UsuarioStaff", back_populates="tareas_asignadas", lazy="selectin")

    def __repr__(self):
        return f"<TareaLimpieza {self.fecha_programada} - {self.estado.value}>"
