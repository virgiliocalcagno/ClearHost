"""
Router de Staff — CRUD + Auth + FCM Token.
"""

from uuid import UUID
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import bcrypt
from jose import jwt

from app.database import get_db
from app.config import get_settings
from app.models.usuario_staff import UsuarioStaff, RolStaff
from app.schemas.usuario_staff import (
    StaffCreate, StaffUpdate, StaffResponse,
    StaffLogin, TokenResponse, FCMTokenUpdate,
)

router = APIRouter(prefix="/staff", tags=["Staff"])

settings = get_settings()


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


@router.post("/login", response_model=TokenResponse)
async def login(
    data: StaffLogin,
    db: AsyncSession = Depends(get_db),
):
    """Autenticar un miembro del staff."""
    result = await db.execute(
        select(UsuarioStaff).where(UsuarioStaff.email == data.email)
    )
    user = result.scalar_one_or_none()
    if not user or not bcrypt.checkpw(data.password.encode('utf-8'), user.password_hash.encode('utf-8')):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )
    token = create_access_token({"sub": str(user.id), "rol": user.rol.value})
    return TokenResponse(access_token=token, staff=StaffResponse.model_validate(user))


@router.get("/", response_model=list[StaffResponse])
async def listar_staff(
    rol: RolStaff | None = None,
    disponible: bool | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Listar todo el staff con filtros opcionales."""
    query = select(UsuarioStaff)
    if rol:
        query = query.where(UsuarioStaff.rol == rol)
    if disponible is not None:
        query = query.where(UsuarioStaff.disponible == disponible)
    query = query.order_by(UsuarioStaff.nombre)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/disponibles", response_model=list[StaffResponse])
async def listar_staff_disponible(
    db: AsyncSession = Depends(get_db),
):
    """Listar staff con rol LIMPIEZA que está disponible."""
    result = await db.execute(
        select(UsuarioStaff).where(
            UsuarioStaff.rol == RolStaff.LIMPIEZA,
            UsuarioStaff.disponible == True,
        ).order_by(UsuarioStaff.nombre)
    )
    return result.scalars().all()


@router.get("/{staff_id}", response_model=StaffResponse)
async def obtener_staff(
    staff_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Obtener un miembro del staff por ID."""
    result = await db.execute(
        select(UsuarioStaff).where(UsuarioStaff.id == staff_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Staff no encontrado")
    return user


@router.post("/", response_model=StaffResponse, status_code=status.HTTP_201_CREATED)
async def crear_staff(
    data: StaffCreate,
    db: AsyncSession = Depends(get_db),
):
    """Registrar un nuevo miembro del staff."""
    # Verificar email único
    existing = await db.execute(
        select(UsuarioStaff).where(UsuarioStaff.email == data.email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    user_data = data.model_dump(exclude={"password"})
    user_data["password_hash"] = bcrypt.hashpw(data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user = UsuarioStaff(**user_data)
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


@router.put("/{staff_id}", response_model=StaffResponse)
async def actualizar_staff(
    staff_id: UUID,
    data: StaffUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Actualizar información del staff."""
    result = await db.execute(
        select(UsuarioStaff).where(UsuarioStaff.id == staff_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Staff no encontrado")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    await db.flush()
    await db.refresh(user)
    return user


@router.put("/{staff_id}/fcm-token", response_model=dict)
async def actualizar_fcm_token(
    staff_id: UUID,
    data: FCMTokenUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Actualizar token FCM para push notifications."""
    result = await db.execute(
        select(UsuarioStaff).where(UsuarioStaff.id == staff_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Staff no encontrado")

    user.fcm_token = data.fcm_token
    await db.flush()
    return {"message": "Token FCM actualizado correctamente"}
