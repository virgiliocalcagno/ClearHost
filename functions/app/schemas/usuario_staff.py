"""
Schemas Pydantic para UsuarioStaff.
"""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, EmailStr, model_validator
from typing import Optional

from app.models.usuario_staff import RolStaff


class StaffCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=200)
    documento: str = Field(..., min_length=4, max_length=50)
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    telefono_emergencia: Optional[str] = None
    direccion: Optional[str] = None
    referencias: Optional[dict] = None # Ej: [{"nombre": "...", "tel": "...", "rel": "..."}]
    
    password: str = Field(..., min_length=4) # Bajado a 4 para facilitar PINs de campo
    rol: RolStaff = RolStaff.STAFF
    zona_id: Optional[str] = None
    equipo_id: Optional[str] = None
    permisos: Optional[dict] = {}
    propiedades_acceso: Optional[list] = []
    etiquetas_acceso: Optional[list[str]] = []
    notificaciones_pref: Optional[dict] = {"email": True, "push": True, "sms": False}
    status: str = "ACTIVE"
    pago_por_tarea: Optional[float] = 0.0


class StaffUpdate(BaseModel):
    nombre: Optional[str] = None
    documento: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    telefono_emergencia: Optional[str] = None
    direccion: Optional[str] = None
    referencias: Optional[dict] = None
    
    password: Optional[str] = Field(None, min_length=4)
    rol: Optional[RolStaff] = None
    zona_id: Optional[str] = None
    equipo_id: Optional[str] = None
    permisos: Optional[dict] = None
    propiedades_acceso: Optional[list] = None
    notificaciones_pref: Optional[dict] = None
    etiquetas_acceso: Optional[list[str]] = None
    disponible: Optional[bool] = None
    status: Optional[str] = None
    pago_por_tarea: Optional[float] = None
    last_activity: Optional[datetime] = None


class StaffResponse(BaseModel):
    id: UUID
    nombre: str
    documento: str
    email: Optional[str] = None
    telefono: Optional[str] = None
    telefono_emergencia: Optional[str] = None
    direccion: Optional[str] = None
    referencias: Optional[dict] = None
    
    rol: RolStaff
    zona_id: Optional[str] = None
    zona_nombre: Optional[str] = None
    equipo_id: Optional[str] = None
    permisos: Optional[dict] = None
    propiedades_acceso: Optional[list] = []
    notificaciones_pref: Optional[dict] = None
    disponible: bool
    status: str
    pago_por_tarea: Optional[float] = 0.0
    last_activity: Optional[datetime] = None
    etiquetas_acceso: Optional[list[str]] = []

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @model_validator(mode='after')
    def enrich_data(self) -> 'StaffResponse':
        # Mantenemos para compatibilidad si el router no lo precarga
        return self


class StaffLogin(BaseModel):
    identificador: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    staff: StaffResponse


class FCMTokenUpdate(BaseModel):
    fcm_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)


# ── Nuevos Schemas Financieros ──

class AdelantoCreate(BaseModel):
    staff_id: str
    monto: float
    moneda: str = "DOP"
    notas: Optional[str] = None

class AdelantoResponse(BaseModel):
    id: UUID
    monto: float
    moneda: str
    fecha: datetime
    notas: Optional[str] = None
    
    model_config = {"from_attributes": True}

class BilleteraResponse(BaseModel):
    total_ganado: float
    total_adelantos: float
    saldo_neto: float
    moneda: str
    historial_tareas: list[dict] # Para mostrar en la app móvil
