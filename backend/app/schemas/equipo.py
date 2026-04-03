"""
Schemas Pydantic para la entidad Equipo.
"""

from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional, List

class EquipoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class EquipoCreate(EquipoBase):
    pass

class EquipoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None

class EquipoResponse(EquipoBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class EquipoDetail(EquipoResponse):
    miembros: List[dict] = [] # Se puede profundizar con StaffResponse si es necesario
