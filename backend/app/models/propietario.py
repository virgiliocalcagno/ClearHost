"""
Modelo Propietario — Persona o entidad dueña de las unidades.
"""

import uuid
from datetime import datetime
from typing import List

from sqlalchemy import String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Propietario(Base):
    __tablename__ = "propietarios"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    telefono: Mapped[str | None] = mapped_column(String(50), nullable=True)
    datos_bancarios: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Notas administrativas
    notas: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relación 1 a Muchos: Un propietario tiene múltiples propiedades
    # Usamos string para evitar importaciones circulares en tiempo de definición
    propiedades: Mapped[List["Propiedad"]] = relationship(
        "Propiedad", 
        back_populates="propietario",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    def __repr__(self):
        return f"<Propietario {self.nombre}>"
