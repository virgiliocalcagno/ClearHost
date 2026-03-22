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
    password: str = Field(..., min_length=6)
    rol: RolStaff = RolStaff.STAFF
    zona_id: Optional[str] = None



class StaffUpdate(BaseModel):
    nombre: Optional[str] = None
    documento: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6)
    rol: Optional[RolStaff] = None
    zona_id: Optional[str] = None

    disponible: Optional[bool] = None


class StaffResponse(BaseModel):
    id: UUID
    nombre: str
    documento: str
    email: Optional[str] = None
    telefono: Optional[str] = None
    rol: RolStaff
    zona_id: Optional[str] = None
    zona_nombre: Optional[str] = None
    disponible: bool

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @model_validator(mode='after')
    def set_zona_nombre(self) -> 'StaffResponse':
        # Si el objeto original tiene la relación zona, la usamos
        # En Pydantic V2, tenemos acceso al objeto original si usamos from_attributes
        # pero es más seguro si el router ya lo pre-carga.
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
    moneda: str = "MXN"
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
