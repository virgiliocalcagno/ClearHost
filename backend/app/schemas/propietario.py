from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


class PropietarioBase(BaseModel):
    nombre: str = Field(..., example="Juan Pérez")
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    datos_bancarios: Optional[str] = None
    notas: Optional[str] = None


class PropietarioCreate(PropietarioBase):
    pass


class PropietarioUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    datos_bancarios: Optional[str] = None
    notas: Optional[str] = None


class PropietarioResponse(PropietarioBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
