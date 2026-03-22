"""
Router de Staff — CRUD + Auth + FCM Token.
"""

from uuid import UUID
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import bcrypt
from jose import jwt, JWTError

from app.database import get_db
from app.config import get_settings
from app.models.tarea_operativa import TareaOperativa, EstadoTarea
from app.models.adelanto_staff import AdelantoStaff
from app.models.usuario_staff import UsuarioStaff, RolStaff
from app.schemas.usuario_staff import (
    StaffCreate, StaffUpdate, StaffResponse,
    StaffLogin, TokenResponse, FCMTokenUpdate,
    ForgotPasswordRequest, ResetPasswordRequest,
    AdelantoCreate, AdelantoResponse, BilleteraResponse
)

router = APIRouter(prefix="/staff", tags=["Staff"])
settings = get_settings()


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


@router.get("/{staff_id}/billetera", response_model=BilleteraResponse)
async def obtener_billetera_staff(
    staff_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Calcula el balance financiero de un miembro del staff.
    Total Ganado (tareas VERIFICADAS) - Total Adelantos.
    """
    # 1. Sumar tareas verificadas
    result_tareas = await db.execute(
        select(TareaOperativa).where(
            TareaOperativa.asignado_a == str(staff_id),
            TareaOperativa.estado == EstadoTarea.VERIFICADA
        )
    )
    tareas = result_tareas.scalars().all()
    total_ganado = sum(t.pago_al_staff for t in tareas)
    
    # 2. Sumar adelantos
    result_adelantos = await db.execute(
        select(AdelantoStaff).where(AdelantoStaff.staff_id == str(staff_id))
    )
    adelantos = result_adelantos.scalars().all()
    total_adelantos = sum(a.monto for a in adelantos)
    
    # Historial de tareas para la app móvil
    historial = [
        {
            "fecha": t.fecha_programada,
            "tipo": t.tipo_tarea,
            "monto": t.pago_al_staff,
            "moneda": t.moneda_tarea,
            "estado": t.estado.value
        }
        for t in tareas
    ]
    
    return BilleteraResponse(
        total_ganado=total_ganado,
        total_adelantos=total_adelantos,
        saldo_neto=total_ganado - total_adelantos,
        moneda="MXN",
        historial_tareas=historial
    )


@router.post("/adelantos", response_model=AdelantoResponse, status_code=status.HTTP_201_CREATED)
async def registrar_adelanto(
    data: AdelantoCreate,
    db: AsyncSession = Depends(get_db),
):
    """Registrar un nuevo adelanto de pago."""
    adelanto = AdelantoStaff(**data.model_dump())
    db.add(adelanto)
    await db.commit()
    await db.refresh(adelanto)
    return adelanto


@router.post("/login", response_model=TokenResponse)
async def login(
    data: StaffLogin,
    db: AsyncSession = Depends(get_db),
):
    """Autenticar un miembro del staff."""
    from sqlalchemy import or_
    result = await db.execute(
        select(UsuarioStaff).where(
            or_(
                UsuarioStaff.email == data.identificador,
                UsuarioStaff.documento == data.identificador
            )
        )
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
    """Listar todo el staff."""
    query = select(UsuarioStaff)
    if rol:
        query = query.where(UsuarioStaff.rol == rol)
    if disponible is not None:
        query = query.where(UsuarioStaff.disponible == disponible)
    query = query.order_by(UsuarioStaff.nombre)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{staff_id}", response_model=StaffResponse)
async def obtener_staff(
    staff_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Obtener staff por ID."""
    result = await db.execute(select(UsuarioStaff).where(UsuarioStaff.id == str(staff_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Staff no encontrado")
    return user


@router.post("/", response_model=StaffResponse, status_code=status.HTTP_201_CREATED)
async def crear_staff(data: StaffCreate, db: AsyncSession = Depends(get_db)):
    """Registrar nuevo staff."""
    user_data = data.model_dump(exclude={"password"})
    user_data["password_hash"] = bcrypt.hashpw(data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user = UsuarioStaff(**user_data)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.put("/{staff_id}", response_model=StaffResponse)
async def actualizar_staff(staff_id: UUID, data: StaffUpdate, db: AsyncSession = Depends(get_db)):
    """Actualizar staff."""
    result = await db.execute(select(UsuarioStaff).where(UsuarioStaff.id == str(staff_id)))
    user = result.scalar_one_or_none()
    if not user: raise HTTPException(status_code=404, detail="Staff no encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        if k == "password":
            user.password_hash = bcrypt.hashpw(v.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        else:
            setattr(user, k, v)
    await db.commit()
    await db.refresh(user)
    return user


@router.put("/{staff_id}/fcm-token", response_model=dict)
async def actualizar_fcm_token(staff_id: UUID, data: FCMTokenUpdate, db: AsyncSession = Depends(get_db)):
    """Token push."""
    result = await db.execute(select(UsuarioStaff).where(UsuarioStaff.id == str(staff_id)))
    user = result.scalar_one_or_none()
    if not user: raise HTTPException(status_code=404, detail="Staff no encontrado")
    user.fcm_token = data.fcm_token
    await db.commit()
    return {"message": "FCM Token actualizado"}
