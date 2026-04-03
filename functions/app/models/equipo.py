"""
Modelo Equipo — Agrupaciones de miembros del staff.
"""

import uuid
from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Equipo(Base):
    __tablename__ = "equipos"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relación inversa con los miembros
    miembros: Mapped[list["UsuarioStaff"]] = relationship("UsuarioStaff", back_populates="equipo", lazy="selectin")

    def __repr__(self):
        return f"<Equipo {self.nombre}>"
