"""
Modelo Incidencia — Reporte de daños, reparaciones y compras (misceláneos).
Permite gestionar presupuestos y aprobaciones de propietarios.
"""

import uuid
import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import String, DateTime, Text, Boolean, ForeignKey, Enum as SQLEnum, JSON, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TipoIncidencia(str, enum.Enum):
    REPARACION = "REPARACION"
    MANTENIMIENTO = "MANTENIMIENTO"
    MISCELANEO = "MISCELANEO"  # Compras: pilas, bombillas, cubiertos, etc.
    AUDITORIA_FALLIDA = "AUDITORIA_FALLIDA"


class EstadoIncidencia(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    PRESUPUESTADO = "PRESUPUESTADO"
    ENVIADO_A_DUENO = "ENVIADO_A_DUENO"
    APROBADO = "APROBADO"
    RECHAZADO = "RECHAZADO"
    COMPLETADO = "COMPLETADO"
    PAGADO = "PAGADO"


class Incidencia(Base):
    __tablename__ = "incidencias"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    propiedad_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("propiedades.id"), nullable=False
    )
    # Una incidencia puede originarse en una tarea de limpieza
    tarea_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("tareas_limpieza.id"), nullable=True
    )
    reportado_por: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("usuarios_staff.id"), nullable=True
    )

    titulo: Mapped[str] = mapped_column(String(100), nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, nullable=False)
    
    tipo: Mapped[TipoIncidencia] = mapped_column(
        SQLEnum(TipoIncidencia), default=TipoIncidencia.REPARACION, nullable=False
    )
    estado: Mapped[EstadoIncidencia] = mapped_column(
        SQLEnum(EstadoIncidencia), default=EstadoIncidencia.PENDIENTE, nullable=False
    )

    urgente: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Fotos del daño/necesidad
    fotos: Mapped[dict | None] = mapped_column(JSON, nullable=True, default=list)
    
    # Datos financieros para el propietario
    costo_estimado: Mapped[float | None] = mapped_column(Float, nullable=True)
    comprobante_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # Gestión de aprobaciones
    token_aprobacion: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    notas_admin: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    fecha_reporte: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    fecha_resolucion: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    propiedad = relationship("Propiedad", backref="incidencias", lazy="selectin")
    tarea = relationship("TareaOperativa", backref="incidencias", lazy="selectin")
    reportero = relationship("UsuarioStaff", backref="incidencias_reportadas", lazy="selectin")

    def __repr__(self):
        return f"<Incidencia {self.titulo} - {self.estado.value}>"
