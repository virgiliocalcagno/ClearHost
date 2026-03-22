from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class InventarioArticuloBase(BaseModel):
    articulo: str = Field(..., max_length=200, example="Sabanas Blancas King")
    categoria: Optional[str] = Field("General", max_length=100)
    stock_actual: int = Field(0, ge=0)
    stock_minimo: int = Field(0, ge=0)
    propiedad_id: Optional[str] = Field(None, example="1234")
    costo_unitario: Optional[float] = Field(None, ge=0)


class InventarioArticuloCreate(InventarioArticuloBase):
    pass


class InventarioArticuloUpdate(BaseModel):
    articulo: Optional[str] = None
    categoria: Optional[str] = None
    stock_actual: Optional[int] = None
    stock_minimo: Optional[int] = None
    propiedad_id: Optional[str] = None
    costo_unitario: Optional[float] = None


class InventarioArticuloResponse(InventarioArticuloBase):
    id: str
    propietario_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
