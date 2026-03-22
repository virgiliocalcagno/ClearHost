"""
Modelo InventarioArticulo — Artículo de insumo o pieza para una propiedad asignada a un propietario.
"""

import uuid
from datetime import datetime

from sqlalchemy import String, Integer, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class InventarioArticulo(Base):
    __tablename__ = "inventario_articulos"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    propietario_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("propietarios.id"), nullable=False, index=True
    )
    # Algunas piezas pueden ser globales para el del dueño o limitadas a una propiedad
    propiedad_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("propiedades.id"), nullable=True, index=True
    )

    articulo: Mapped[str] = mapped_column(String(200), nullable=False)
    categoria: Mapped[str | None] = mapped_column(String(100), nullable=True, default="General")
    
    stock_actual: Mapped[int] = mapped_column(Integer, default=0)
    stock_minimo: Mapped[int] = mapped_column(Integer, default=0)

    # Costo unitario opcional, útil para reportar "cuánto me cuesta reponerlo"
    costo_unitario: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones (opcional si necesitas acceder hacia arriba desde aquí)
    propietario = relationship("Propietario", lazy="selectin", overlaps="inventario")
    propiedad = relationship("Propiedad", lazy="selectin", overlaps="inventario")

    def __repr__(self):
        return f"<InventarioArticulo {self.articulo} ({self.stock_actual})>"
