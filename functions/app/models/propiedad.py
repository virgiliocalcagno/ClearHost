"""
Modelo Propiedad — Representa una propiedad/unidad vacacional.
Ficha completa con datos de propietario, acceso, operación y plataformas.
"""

import uuid
from datetime import datetime, time

from sqlalchemy import String, Integer, Float, Boolean, Text, DateTime, JSON, Time, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Propiedad(Base):
    __tablename__ = "propiedades"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    # ── Relación con Propietario ──
    # Una propiedad pertenece a un solo propietario
    propietario_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("propietarios.id"), nullable=True, index=True
    )
    propietario: Mapped["Propietario"] = relationship(
        "Propietario", 
        back_populates="propiedades",
        lazy="selectin"
    )

    # ── Datos básicos (visibles para staff) ──
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    direccion: Mapped[str] = mapped_column(String(500), nullable=False)
    ciudad: Mapped[str] = mapped_column(String(100), nullable=False)
    num_habitaciones: Mapped[int] = mapped_column(Integer, default=1)

    # ── Datos del propietario (confidencial — solo admin) ──
    propietario_nombre: Mapped[str | None] = mapped_column(String(200), nullable=True)
    propietario_telefono: Mapped[str | None] = mapped_column(String(50), nullable=True)
    propietario_email: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # ── Detalles de acceso (confidencial) ──
    wifi_nombre: Mapped[str | None] = mapped_column(String(100), nullable=True)
    wifi_password: Mapped[str | None] = mapped_column(String(100), nullable=True)
    codigo_lockbox: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="Código del lockbox o caja de llaves")
    codigo_puerta: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="Código de puerta electrónica")
    instrucciones_acceso: Mapped[str | None] = mapped_column(Text, nullable=True, comment="Instrucciones detalladas de acceso")

    # ── Ubicación detallada ──
    piso: Mapped[str | None] = mapped_column(String(20), nullable=True, comment="Número de piso o planta")
    numero_puerta: Mapped[str | None] = mapped_column(String(20), nullable=True, comment="Número de departamento/puerta")
    codigo_postal: Mapped[str | None] = mapped_column(String(20), nullable=True)
    referencia_ubicacion: Mapped[str | None] = mapped_column(Text, nullable=True, comment="Referencias para llegar")
    latitud: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitud: Mapped[float | None] = mapped_column(Float, nullable=True)

    # ── Especificaciones de la propiedad ──
    tipo_propiedad: Mapped[str | None] = mapped_column(
        String(50), nullable=True, default="DEPARTAMENTO",
        comment="CASA, DEPARTAMENTO, ESTUDIO, VILLA, LOFT, HABITACION"
    )
    num_banos: Mapped[int | None] = mapped_column(Integer, nullable=True, default=1)
    max_huespedes: Mapped[int | None] = mapped_column(Integer, nullable=True, default=2)
    metros_cuadrados: Mapped[float | None] = mapped_column(Float, nullable=True)
    hora_checkout: Mapped[time | None] = mapped_column(Time, nullable=True)
    hora_checkin: Mapped[time | None] = mapped_column(Time, nullable=True)
    amenidades: Mapped[dict | None] = mapped_column(
        JSON, nullable=True,
        comment="Lista de amenidades: piscina, AC, parking, etc."
    )

    # ── Estacionamiento ──
    tiene_estacionamiento: Mapped[bool] = mapped_column(Boolean, default=False)
    detalles_estacionamiento: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="Ubicación del cajón, número, etc.")

    # ── Información operativa ──
    tarifa_limpieza: Mapped[float | None] = mapped_column(Float, nullable=True, comment="Costo de limpieza por turno")
    contacto_emergencia: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="Nombre y teléfono de contacto de emergencia")
    contacto_mantenimiento: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="Plomero, electricista, etc.")
    dia_basura: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="Días que pasa el camión de basura")
    reglas_edificio: Mapped[str | None] = mapped_column(Text, nullable=True, comment="Reglas del edificio/condominio")

    # ── Links de plataformas ──
    link_airbnb: Mapped[str | None] = mapped_column(String(500), nullable=True)
    link_booking: Mapped[str | None] = mapped_column(String(500), nullable=True)
    link_vrbo: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # ── iCal / Sincronización ──
    ical_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    ical_last_sync: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # ── Checklist default para esta propiedad ──
    checklist_template: Mapped[dict | None] = mapped_column(
        JSON, nullable=True,
        default=lambda: [
            {"item": "Papel de baño en todos los baños", "requerido": True},
            {"item": "Sábanas limpias en todas las camas", "requerido": True},
            {"item": "Toallas limpias", "requerido": True},
            {"item": "Cocina limpia y ordenada", "requerido": True},
            {"item": "Pisos barridos y trapeados", "requerido": True},
            {"item": "Basura retirada", "requerido": True},
            {"item": "Aire acondicionado funcionando", "requerido": False},
            {"item": "WiFi funcionando", "requerido": False},
        ]
    )

    # ── Inventario de activos para auditoría ──
    activos_inventario: Mapped[dict | None] = mapped_column(
        JSON, nullable=True,
        default=lambda: [
            {"activo": "Control remoto TV", "cantidad": 1},
            {"activo": "Control remoto A/C", "cantidad": 1},
            {"activo": "Juego de llaves", "cantidad": 2},
            {"activo": "Toallas de baño", "cantidad": 4},
            {"activo": "Toallas de mano", "cantidad": 4},
            {"activo": "Almohadas", "cantidad": 4},
            {"activo": "Cobijas", "cantidad": 2},
        ]
    )

    # ── Notas internas (solo admin) ──
    notas: Mapped[str | None] = mapped_column(Text, nullable=True)
    notas_limpieza: Mapped[str | None] = mapped_column(Text, nullable=True, comment="Instrucciones especiales de limpieza")

    activa: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    reservas = relationship("Reserva", back_populates="propiedad", lazy="selectin")
    tareas = relationship("TareaLimpieza", back_populates="propiedad", lazy="selectin")

    # Propiedades dinámicas
    @property
    def get_propietario_nombre(self) -> str | None:
        if self.propietario:
            return self.propietario.nombre
        return self.propietario_nombre  # Usar el campo estático si no hay relación en DB aún

    def __repr__(self):
        return f"<Propiedad {self.nombre} ({self.ciudad})>"
