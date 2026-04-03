"""
Router Equipos — Gestión de equipos y miembros (Inspirado en iGMS) en functions.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List

from app.database import get_db
from app.models.equipo import Equipo
from app.models.usuario_staff import UsuarioStaff, RolStaff
from app.schemas.equipo import EquipoCreate, EquipoUpdate, EquipoResponse, EquipoDetail
from app.dependencies import require_role

router = APIRouter(prefix="/equipos", tags=["Equipos"])

@router.get("/", response_model=List[EquipoResponse])
async def listar_equipos(
    db: AsyncSession = Depends(get_db),
    current_user: UsuarioStaff = Depends(require_role([RolStaff.SUPER_ADMIN, RolStaff.MANAGER_LOCAL]))
):
    """Lista todos los equipos registrados."""
    result = await db.execute(select(Equipo))
    return result.scalars().all()

@router.post("/", response_model=EquipoResponse, status_code=status.HTTP_201_CREATED)
async def crear_equipo(
    equipo_in: EquipoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UsuarioStaff = Depends(require_role([RolStaff.SUPER_ADMIN]))
):
    """Crea un nuevo equipo (Solo Super Admin)."""
    nuevo_equipo = Equipo(**equipo_in.model_dump())
    db.add(nuevo_equipo)
    await db.commit()
    await db.refresh(nuevo_equipo)
    return nuevo_equipo

@router.get("/{equipo_id}", response_model=EquipoDetail)
async def obtener_equipo(
    equipo_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UsuarioStaff = Depends(require_role([RolStaff.SUPER_ADMIN, RolStaff.MANAGER_LOCAL]))
):
    """Obtiene detalles de un equipo y sus miembros."""
    result = await db.execute(select(Equipo).where(Equipo.id == equipo_id))
    equipo = result.scalar_one_or_none()
    if not equipo:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    return equipo

@router.put("/{equipo_id}", response_model=EquipoResponse)
async def actualizar_equipo(
    equipo_id: str,
    equipo_in: EquipoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UsuarioStaff = Depends(require_role([RolStaff.SUPER_ADMIN]))
):
    """Actualiza la información de un equipo."""
    result = await db.execute(select(Equipo).where(Equipo.id == equipo_id))
    equipo = result.scalar_one_or_none()
    if not equipo:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    
    update_data = equipo_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(equipo, key, value)
    
    await db.commit()
    await db.refresh(equipo)
    return equipo

@router.delete("/{equipo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_equipo(
    equipo_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UsuarioStaff = Depends(require_role([RolStaff.SUPER_ADMIN]))
):
    """Elimina un equipo. Los miembros quedan sin equipo pero no se eliminan."""
    result = await db.execute(select(Equipo).where(Equipo.id == equipo_id))
    equipo = result.scalar_one_or_none()
    if not equipo:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    
    await db.delete(equipo)
    await db.commit()
    return None

@router.post("/{equipo_id}/miembros/{staff_id}", response_model=EquipoDetail)
async def asignar_miembro(
    equipo_id: str,
    staff_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UsuarioStaff = Depends(require_role([RolStaff.SUPER_ADMIN]))
):
    """Asigna un miembro del staff a un equipo."""
    e_res = await db.execute(select(Equipo).where(Equipo.id == equipo_id))
    equipo = e_res.scalar_one_or_none()
    if not equipo:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    
    s_res = await db.execute(select(UsuarioStaff).where(UsuarioStaff.id == staff_id))
    staff = s_res.scalar_one_or_none()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff no encontrado")
    
    staff.equipo_id = equipo_id
    await db.commit()
    await db.refresh(equipo)
    return equipo
