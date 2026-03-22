"""
Router de Gastos Operativos — CRUD para contabilidad y liquidación.
"""

from uuid import UUID
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.gasto_operativo import GastoOperativo, CategoriaGasto
from app.models.usuario_staff import UsuarioStaff, RolStaff
from app.dependencies import get_current_user
from pydantic import BaseModel, ConfigDict


router = APIRouter(prefix="/gastos", tags=["Gastos Operativos"])

# Esquemas Pydantic locales (para rapidez)
class GastoCreate(BaseModel):
    propiedad_id: str
    propietario_id: str
    monto: float
    fecha: date = date.today()
    categoria: CategoriaGasto = CategoriaGasto.OTRO
    descripcion: Optional[str] = None
    comprobante_url: Optional[str] = None

class GastoResponse(GastoCreate):
    id: str
    model_config = ConfigDict(from_attributes=True)

class ResumenLiquidacion(BaseModel):
    propiedad_id: str
    total_ingresos: float
    total_gastos: float
    balance_neto: float


@router.get("/", response_model=list[GastoResponse])
async def listar_gastos(
    propiedad_id: Optional[str] = None,
    propietario_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: UsuarioStaff = Depends(get_current_user),
):
    """Listar gastos con filtros y segregación por zona."""
    query = select(GastoOperativo)
    
    # Segregación básica
    if current_user.rol == RolStaff.MANAGER_LOCAL:
        from app.models.propiedad import Propiedad
        query = query.join(Propiedad).where(Propiedad.zona_id == current_user.zona_id)
    
    if propiedad_id:
        query = query.where(GastoOperativo.propiedad_id == propiedad_id)
    if propietario_id:
        query = query.where(GastoOperativo.propietario_id == propietario_id)
        
    query = query.order_by(GastoOperativo.fecha.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=GastoResponse, status_code=status.HTTP_201_CREATED)
async def crear_gasto(
    data: GastoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UsuarioStaff = Depends(get_current_user),
):
    """Registrar un nuevo gasto operativo."""
    if current_user.rol == RolStaff.STAFF:
        raise HTTPException(status_code=403, detail="No tienes permisos para registrar gastos")
        
    gasto = GastoOperativo(**data.model_dump())
    db.add(gasto)
    await db.commit()
    await db.refresh(gasto)
    return gasto


@router.get("/liquidacion/{propiedad_id}", response_model=ResumenLiquidacion)
async def resumen_liquidacion(
    propiedad_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Calcula el balance para liquidación (Ingresos vs Gastos)."""
    # Nota: Los ingresos vendrían de un cálculo de reservas completadas. 
    # Por ahora simularemos ingresos basados en una tasa fija o suma de reservas si existiera el campo monto_reserva.
    # Como el usuario mencionó "(Ingresos Reservas - Gastos Operativos)", 
    # asumo que hay una lógica de ingresos que ya existe o que debo bosquejar.
    
    # Sumar gastos
    result_gastos = await db.execute(
        select(func.sum(GastoOperativo.monto)).where(GastoOperativo.propiedad_id == propiedad_id)
    )
    total_gastos = result_gastos.scalar() or 0.0
    
    # Simulación de ingresos (esto debería conectarse a Reservas en el futuro)
    total_ingresos = 1500.0 # Placeholder
    
    return ResumenLiquidacion(
        propiedad_id=propiedad_id,
        total_ingresos=total_ingresos,
        total_gastos=total_gastos,
        balance_neto=total_ingresos - total_gastos
    )
