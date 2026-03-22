"""
Modelo GastoOperativo — Registro de egresos por propiedad y propietario.
"""

import uuid
import enum
from datetime import datetime, date

from sqlalchemy import String, Float, Date, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CategoriaGasto(str, enum.Enum):
    LIMPIEZA = "LIMPIEZA"
    MANTENIMIENTO = "MANTENIMIENTO"
    SUMINISTROS = "SUMINISTROS"
    SERVICIOS = "SERVICIOS" # Agua, Luz, WiFi
    REPARACION = "REPARACION"
    OTRO = "OTRO"


class GastoOperativo(Base):
    __tablename__ = "gastos_operativos"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    
    propiedad_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("propiedades.id"), nullable=False, index=True
    )
    propietario_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("propietarios.id"), nullable=False, index=True
    )

    monto: Mapped[float] = mapped_column(Float, nullable=False)
    fecha: Mapped[date] = mapped_column(Date, default=date.today)
    
    categoria: Mapped[CategoriaGasto] = mapped_column(
        SQLEnum(CategoriaGasto), default=CategoriaGasto.OTRO, nullable=False
    )
    
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    comprobante_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    propiedad = relationship("Propiedad", backref="gastos", lazy="selectin")
    propietario = relationship("Propietario", backref="gastos", lazy="selectin")

    def __repr__(self):
        return f"<GastoOperativo {self.categoria} - {self.monto}>"
