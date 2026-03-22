"""
Router de Propietarios — CRUD + Dashboard consolidado.
El endpoint /dashboard devuelve en una sola llamada toda la info
del propietario: sus propiedades, reservas activas, tareas e incidencias.
"""

from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.propietario import Propietario
from app.models.propiedad import Propiedad
from app.models.reserva import Reserva
from app.models.tarea_operativa import TareaOperativa
from app.models.incidencia import Incidencia
from app.models.inventario_articulo import InventarioArticulo
from app.schemas.propietario import PropietarioCreate, PropietarioUpdate, PropietarioResponse
from app.schemas.inventario_articulo import InventarioArticuloCreate, InventarioArticuloUpdate, InventarioArticuloResponse

router = APIRouter(prefix="/propietarios", tags=["Propietarios"])


# ─── CRUD Básico ──────────────────────────────────────────────

@router.get("/", response_model=list[PropietarioResponse])
async def listar_propietarios(db: AsyncSession = Depends(get_db)):
    """Listar todos los propietarios."""
    query = select(Propietario).order_by(Propietario.nombre)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=PropietarioResponse, status_code=status.HTTP_201_CREATED)
async def crear_propietario(data: PropietarioCreate, db: AsyncSession = Depends(get_db)):
    """Crear un nuevo propietario."""
    propietario = Propietario(**data.model_dump())
    db.add(propietario)
    await db.flush()
    await db.refresh(propietario)
    return propietario


@router.get("/{propietario_id}", response_model=PropietarioResponse)
async def obtener_propietario(propietario_id: str, db: AsyncSession = Depends(get_db)):
    """Obtener un propietario por su ID."""
    result = await db.execute(select(Propietario).where(Propietario.id == propietario_id))
    propietario = result.scalar_one_or_none()
    if not propietario:
        raise HTTPException(status_code=404, detail="Propietario no encontrado")
    return propietario


@router.put("/{propietario_id}", response_model=PropietarioResponse)
async def actualizar_propietario(propietario_id: str, data: PropietarioUpdate, db: AsyncSession = Depends(get_db)):
    """Actualizar un propietario."""
    result = await db.execute(select(Propietario).where(Propietario.id == propietario_id))
    propietario = result.scalar_one_or_none()
    if not propietario:
        raise HTTPException(status_code=404, detail="Propietario no encontrado")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(propietario, field, value)

    await db.flush()
    await db.refresh(propietario)
    return propietario


@router.delete("/{propietario_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_propietario(propietario_id: str, db: AsyncSession = Depends(get_db)):
    """Eliminar un propietario."""
    result = await db.execute(select(Propietario).where(Propietario.id == propietario_id))
    propietario = result.scalar_one_or_none()
    if not propietario:
        raise HTTPException(status_code=404, detail="Propietario no encontrado")

    await db.delete(propietario)
    await db.flush()

# ─── CRUD Inventario ──────────────────────────────────────────

@router.get("/{propietario_id}/inventario/", response_model=list[InventarioArticuloResponse])
async def listar_inventario(propietario_id: str, db: AsyncSession = Depends(get_db)):
    """Listar inventario de un propietario."""
    query = select(InventarioArticulo).where(InventarioArticulo.propietario_id == propietario_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/{propietario_id}/inventario/", response_model=InventarioArticuloResponse)
async def crear_articulo_inventario(propietario_id: str, data: InventarioArticuloCreate, db: AsyncSession = Depends(get_db)):
    """Crear un nuevo artículo en el inventario."""
    art = InventarioArticulo(**data.model_dump(), propietario_id=propietario_id)
    db.add(art)
    await db.flush()
    await db.refresh(art)
    return art


@router.put("/{propietario_id}/inventario/{articulo_id}", response_model=InventarioArticuloResponse)
async def actualizar_articulo_inventario(propietario_id: str, articulo_id: str, data: InventarioArticuloUpdate, db: AsyncSession = Depends(get_db)):
    """Actualizar artículo del inventario."""
    result = await db.execute(
        select(InventarioArticulo).where(InventarioArticulo.id == articulo_id, InventarioArticulo.propietario_id == propietario_id)
    )
    art = result.scalar_one_or_none()
    if not art:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")
    
    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(art, k, v)
        
    await db.flush()
    await db.refresh(art)
    return art
