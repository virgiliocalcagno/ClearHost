"""
Router CRUD para Zonas.
Solo el SUPER_ADMIN puede crear/editar/eliminar zonas.
Cualquier usuario autenticado puede listarlas (para los selects).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.database import get_db
from app.models.zona import Zona
from app.models.usuario_staff import UsuarioStaff, RolStaff
from app.schemas.zona import ZonaCreate, ZonaUpdate, ZonaResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/zonas", tags=["zonas"])


def require_super_admin(current_user: UsuarioStaff = Depends(get_current_user)):
    if current_user.rol != RolStaff.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo el SUPER_ADMIN puede gestionar zonas."
        )
    return current_user


# ── GET /api/zonas/ ────────────────────────────────────────────────────────────
@router.get("/", response_model=list[ZonaResponse])
async def listar_zonas(
    db: AsyncSession = Depends(get_db),
    current_user: UsuarioStaff = Depends(get_current_user),
):
    """Lista todas las zonas. Requiere autenticación."""
    result = await db.execute(select(Zona).order_by(Zona.nombre))
    return result.scalars().all()


# ── POST /api/zonas/ ───────────────────────────────────────────────────────────
@router.post("/", response_model=ZonaResponse, status_code=status.HTTP_201_CREATED)
async def crear_zona(
    body: ZonaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UsuarioStaff = Depends(require_super_admin),
):
    """Crea una nueva zona. Solo SUPER_ADMIN."""
    # Verificar que el nombre no exista ya
    existing = await db.execute(select(Zona).where(Zona.nombre == body.nombre))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe una zona con el nombre '{body.nombre}'."
        )
    zona = Zona(nombre=body.nombre, descripcion=body.descripcion)
    db.add(zona)
    await db.commit()
    await db.refresh(zona)
    return zona


# ── PUT /api/zonas/{zona_id} ───────────────────────────────────────────────────
@router.put("/{zona_id}", response_model=ZonaResponse)
async def actualizar_zona(
    zona_id: str,
    body: ZonaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UsuarioStaff = Depends(require_super_admin),
):
    """Actualiza una zona existente. Solo SUPER_ADMIN."""
    result = await db.execute(select(Zona).where(Zona.id == zona_id))
    zona = result.scalar_one_or_none()
    if not zona:
        raise HTTPException(status_code=404, detail="Zona no encontrada.")

    if body.nombre is not None:
        # Verificar unicidad del nuevo nombre
        conflict = await db.execute(
            select(Zona).where(Zona.nombre == body.nombre, Zona.id != zona_id)
        )
        if conflict.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Ya existe una zona con el nombre '{body.nombre}'."
            )
        zona.nombre = body.nombre

    if body.descripcion is not None:
        zona.descripcion = body.descripcion

    await db.commit()
    await db.refresh(zona)
    return zona


# ── DELETE /api/zonas/{zona_id} ────────────────────────────────────────────────
@router.delete("/{zona_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_zona(
    zona_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UsuarioStaff = Depends(require_super_admin),
):
    """Elimina una zona. Solo SUPER_ADMIN. Falla si hay propiedades o staff asignados."""
    result = await db.execute(select(Zona).where(Zona.id == zona_id))
    zona = result.scalar_one_or_none()
    if not zona:
        raise HTTPException(status_code=404, detail="Zona no encontrada.")

    # Verificar que no haya propiedades o staff asignados
    if zona.propiedades:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"No se puede eliminar: {len(zona.propiedades)} propiedad(es) asignada(s) a esta zona."
        )
    if zona.staff:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"No se puede eliminar: {len(zona.staff)} miembro(s) de staff asignado(s) a esta zona."
        )

    await db.execute(delete(Zona).where(Zona.id == zona_id))
    await db.commit()
