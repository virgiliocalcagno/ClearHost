"""
Modelo UsuarioStaff — Personal de limpieza, mantenimiento y administradores.
"""

import uuid
import enum
from datetime import datetime

from sqlalchemy import String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class RolStaff(str, enum.Enum):
    LIMPIEZA = "LIMPIEZA"
    MANTENIMIENTO = "MANTENIMIENTO"
    ADMIN = "ADMIN"


class UsuarioStaff(Base):
    __tablename__ = "usuarios_staff"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    documento: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, default="000")
    email: Mapped[str | None] = mapped_column(String(300), unique=True, nullable=True)
    telefono: Mapped[str | None] = mapped_column(String(20), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(500), nullable=False)

    rol: Mapped[RolStaff] = mapped_column(
        SQLEnum(RolStaff), default=RolStaff.LIMPIEZA, nullable=False
    )

    fcm_token: Mapped[str | None] = mapped_column(String(500), nullable=True)
    disponible: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    tareas_asignadas = relationship("TareaLimpieza", back_populates="asignado", lazy="selectin")

    def __repr__(self):
        return f"<UsuarioStaff {self.nombre} ({self.rol.value})>"
