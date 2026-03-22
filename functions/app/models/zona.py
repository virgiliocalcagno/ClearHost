"""
Modelo Zona — Unidad geográfica/administrativa para segregar propiedades y managers.
"""

import uuid
from datetime import datetime

from sqlalchemy import String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Zona(Base):
    __tablename__ = "zonas"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    nombre: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relaciones inversas
    propiedades = relationship("Propiedad", back_populates="zona", lazy="selectin")
    staff = relationship("UsuarioStaff", back_populates="zona", lazy="selectin")

    def __repr__(self):
        return f"<Zona {self.nombre}>"
