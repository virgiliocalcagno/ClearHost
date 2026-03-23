"""
Router de Propiedades — CRUD completo.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.propiedad import Propiedad
from app.schemas.propiedad import PropiedadCreate, PropiedadUpdate, PropiedadResponse

from app.dependencies import get_current_user, require_role
from app.models.usuario_staff import UsuarioStaff, RolStaff

router = APIRouter(prefix="/propiedades", tags=["Propiedades"], redirect_slashes=False)



@router.get("/", response_model=list[PropiedadResponse])
async def listar_propiedades(
    activa: bool | None = None,
    ciudad: str | None = None,
    propietario_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: UsuarioStaff = Depends(get_current_user),
):
    """Listar todas las propiedades con filtros opcionales y restricción por zona."""
    query = select(Propiedad).options(
        selectinload(Propiedad.propietario),
        selectinload(Propiedad.zona)
    )
    
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
    properties = result.scalars().all()
    for p in properties:
        if p.propietario:
            p.propietario_nombre = p.propietario.nombre
        if p.zona:
            p.zona_nombre = p.zona.nombre
    return properties



@router.get("/{propiedad_id}", response_model=PropiedadResponse)
async def obtener_propiedad(
    propiedad_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UsuarioStaff = Depends(get_current_user),
):
    """Obtener una propiedad por su ID con muro de privacidad."""
    result = await db.execute(
        select(Propiedad).options(
            selectinload(Propiedad.propietario),
            selectinload(Propiedad.zona)
        ).where(Propiedad.id == str(propiedad_id))
    )
    propiedad = result.scalar_one_or_none()
    if not propiedad:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    
    # ── Muro de Privacidad ──
    if current_user.rol == RolStaff.STAFF:
        propiedad.cobro_propietario = 0.0  # Ocultar ingresos
        propiedad.notas = "Información restringida"
    
    # Enriquecer nombres para el frontend
    if propiedad.propietario:
        propiedad.propietario_nombre = propiedad.propietario.nombre
    if propiedad.zona:
        propiedad.zona_nombre = propiedad.zona.nombre
        
    return propiedad


@router.post("/", response_model=PropiedadResponse, status_code=status.HTTP_201_CREATED)
async def crear_propiedad(
    data: PropiedadCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UsuarioStaff = Depends(require_role([RolStaff.SUPER_ADMIN, RolStaff.MANAGER_LOCAL]))
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
    current_user: UsuarioStaff = Depends(require_role([RolStaff.SUPER_ADMIN, RolStaff.MANAGER_LOCAL]))
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
        # Limpiar strings vacíos en FKs
        if field in ["propietario_id", "zona_id", "manager_id"] and value == "":
            value = None
        setattr(propiedad, field, value)

    await db.flush()
    await db.refresh(propiedad, ["propietario", "zona"])

    # Enriquecer nombres para el frontend
    if propiedad.propietario:
        propiedad.propietario_nombre = propiedad.propietario.nombre
    if propiedad.zona:
        propiedad.zona_nombre = propiedad.zona.nombre

    return propiedad


@router.delete("/{propiedad_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_propiedad(
    propiedad_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UsuarioStaff = Depends(require_role([RolStaff.SUPER_ADMIN]))
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
