"""
Modelo TareaLimpieza — Tarea de limpieza y preparación de propiedad.
Incluye checklist digital, auditoría de activos y fotos de evidencia.
"""

import uuid
import enum
from datetime import datetime, date, time

from sqlalchemy import String, Date, Time, DateTime, Text, Boolean, ForeignKey, Enum as SQLEnum, JSON, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class EstadoTarea(str, enum.Enum):
    PENDIENTE = "PENDIENTE" # Tarea en la bolsa general (sin staff)
    ASIGNADA_NO_CONFIRMADA = "ASIGNADA_NO_CONFIRMADA"
    ACEPTADA = "ACEPTADA"
    EN_PROGRESO = "EN_PROGRESO"
    CLEAN_AND_READY = "CLEAN_AND_READY"
    VERIFICADA = "VERIFICADA" # Para el admin


class PrioridadTarea(str, enum.Enum):
    EMERGENCIA = "EMERGENCIA"
    ALTA = "ALTA"
    MEDIA = "MEDIA"
    BAJA = "BAJA"


class TareaOperativa(Base):
    __tablename__ = "tareas_operativas"

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

    # ── Datos de la Tarea ──
    tipo_tarea: Mapped[str] = mapped_column(String(50), default="LIMPIEZA", comment="LIMPIEZA, MANTENIMIENTO, DILIGENCIA")
    fecha_programada: Mapped[date] = mapped_column(Date, nullable=False)
    hora_inicio: Mapped[time | None] = mapped_column(Time, nullable=True)

    estado: Mapped[EstadoTarea] = mapped_column(
        SQLEnum(EstadoTarea), default=EstadoTarea.PENDIENTE, nullable=False
    )
    
    prioridad: Mapped[PrioridadTarea] = mapped_column(
        SQLEnum(PrioridadTarea), default=PrioridadTarea.BAJA, nullable=False
    )

    # ── Datos Financieros (Doble Tarifario) ──
    pago_al_staff: Mapped[float] = mapped_column(Float, default=0.0, comment="Pago por esta tarea")
    moneda_tarea: Mapped[str] = mapped_column(String(10), default="MXN")
    
    fecha_asignacion: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Checklist digital con validaciones booleanas
    checklist: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Auditoría de activos por reserva
    auditoria_activos: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # URLs de fotos de evidencia
    fotos_antes: Mapped[list | None] = mapped_column(JSON, nullable=True, default=list)
    fotos_despues: Mapped[list | None] = mapped_column(JSON, nullable=True, default=list)

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
        return f"<TareaOperativa {self.fecha_programada} - {self.estado.value}>"
