"""
Router de Propiedades — CRUD completo.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.propiedad import Propiedad
from app.schemas.propiedad import PropiedadCreate, PropiedadUpdate, PropiedadResponse

from app.dependencies import get_current_user
from app.models.usuario_staff import UsuarioStaff, RolStaff

router = APIRouter(prefix="/propiedades", tags=["Propiedades"])



@router.get("/", response_model=list[PropiedadResponse])
async def listar_propiedades(
    activa: bool | None = None,
    ciudad: str | None = None,
    propietario_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: UsuarioStaff = Depends(get_current_user),
):
    """Listar todas las propiedades con filtros opcionales y restricción por zona."""
    query = select(Propiedad)
    
    # ── Segregación por Zona (Manager Local) ──
    if current_user.rol == RolStaff.MANAGER_LOCAL:
        if current_user.zona_id:
            query = query.where(Propiedad.zona_id == current_user.zona_id)
        else:
            return []
    elif current_user.rol == RolStaff.STAFF:
        # El staff no tiene acceso al listado general de propiedades
        raise HTTPException(status_code=403, detail="Acceso no permitido para Staff")
    
    # ── Otros filtros ──
    if activa is not None:
        query = query.where(Propiedad.activa == activa)
    if ciudad:
        query = query.where(Propiedad.ciudad.ilike(f"%{ciudad}%"))
    if propietario_id:
        query = query.where(Propiedad.propietario_id == propietario_id)
        
    query = query.order_by(Propiedad.nombre)
    result = await db.execute(query)
    return result.scalars().all()



@router.get("/{propiedad_id}", response_model=PropiedadResponse)
async def obtener_propiedad(
    propiedad_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UsuarioStaff = Depends(get_current_user),
):
    """Obtener una propiedad por su ID con muro de privacidad."""
    result = await db.execute(
        select(Propiedad).where(Propiedad.id == str(propiedad_id))
    )
    propiedad = result.scalar_one_or_none()
    if not propiedad:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    
    # ── Muro de Privacidad ──
    if current_user.rol == RolStaff.STAFF:
        propiedad.cobro_propietario = 0.0  # Ocultar ingresos
        propiedad.notas = "Información restringida"
        
    return propiedad


@router.post("/", response_model=PropiedadResponse, status_code=status.HTTP_201_CREATED)
async def crear_propiedad(
    data: PropiedadCreate,
    db: AsyncSession = Depends(get_db),
):
    """Crear una nueva propiedad."""
    propiedad = Propiedad(**data.model_dump())
    db.add(propiedad)
    await db.flush()
    await db.refresh(propiedad)
    return propiedad


@router.put("/{propiedad_id}", response_model=PropiedadResponse)
async def actualizar_propiedad(
    propiedad_id: str,
    data: PropiedadUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Actualizar una propiedad existente."""
    result = await db.execute(
        select(Propiedad).where(Propiedad.id == str(propiedad_id))
    )
    propiedad = result.scalar_one_or_none()
    if not propiedad:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(propiedad, field, value)

    await db.flush()
    await db.refresh(propiedad)
    return propiedad


@router.delete("/{propiedad_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_propiedad(
    propiedad_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Eliminar (desactivar) una propiedad."""
    result = await db.execute(
        select(Propiedad).where(Propiedad.id == str(propiedad_id))
    )
    propiedad = result.scalar_one_or_none()
    if not propiedad:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")

    propiedad.activa = False
    await db.flush()
