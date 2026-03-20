"""
Schemas Pydantic para UsuarioStaff.
"""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, EmailStr
from typing import Optional

from app.models.usuario_staff import RolStaff


class StaffCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=200)
    documento: str = Field(..., min_length=4, max_length=50)
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    password: str = Field(..., min_length=6)
    rol: RolStaff = RolStaff.LIMPIEZA


class StaffUpdate(BaseModel):
    nombre: Optional[str] = None
    documento: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    rol: Optional[RolStaff] = None
    disponible: Optional[bool] = None


class StaffResponse(BaseModel):
    id: UUID
    nombre: str
    documento: str
    email: Optional[str] = None
    telefono: Optional[str] = None
    rol: RolStaff
    disponible: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class StaffLogin(BaseModel):
    identificador: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    staff: StaffResponse


class FCMTokenUpdate(BaseModel):
    fcm_token: str
