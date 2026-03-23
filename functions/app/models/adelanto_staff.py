import uuid
from datetime import datetime
from sqlalchemy import String, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class AdelantoStaff(Base):
    __tablename__ = "adelantos_staff"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    staff_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("usuarios_staff.id"), nullable=False, index=True
    )
    
    monto: Mapped[float] = mapped_column(Float, nullable=False)
    moneda: Mapped[str] = mapped_column(String(10), default="DOP")
    fecha: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    notas: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Relación
    staff = relationship("UsuarioStaff", back_populates="adelantos", lazy="selectin")

    def __repr__(self):
        return f"<AdelantoStaff staff={self.staff_id} monto={self.monto}>"
