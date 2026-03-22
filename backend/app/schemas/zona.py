"""
Schemas Pydantic para Zona.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ZonaCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    descripcion: Optional[str] = None


class ZonaUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    descripcion: Optional[str] = None


class ZonaResponse(BaseModel):
    id: str
    nombre: str
    descripcion: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
