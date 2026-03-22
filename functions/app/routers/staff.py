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
from app.models.tarea_limpieza import TareaOperativa, EstadoTarea
from app.models.adelanto_staff import AdelantoStaff
from app.schemas.usuario_staff import (
    StaffCreate, StaffUpdate, StaffResponse,
    StaffLogin, TokenResponse, FCMTokenUpdate,
    ForgotPasswordRequest, ResetPasswordRequest,
    AdelantoCreate, AdelantoResponse, BilleteraResponse
)


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
    
    # Historial de tareas para la app móvil (Privacy Wall: solo lo que ganó el staff)
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
        moneda="MXN", # O la moneda principal del sistema
        historial_tareas=historial
    )


@router.post("/adelantos", response_model=AdelantoResponse, status_code=status.HTTP_201_CREATED)
async def registrar_adelanto(
    data: AdelantoCreate,
    db: AsyncSession = Depends(get_db),
):
    """Registrar un nuevo adelanto de pago para un staff."""
    adelanto = AdelantoStaff(**data.model_dump())
    db.add(adelanto)
    await db.commit()
    await db.refresh(adelanto)
    return adelanto
from jose import JWTError

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
            UsuarioStaff.rol == RolStaff.STAFF,
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
        select(UsuarioStaff).where(UsuarioStaff.id == str(staff_id))
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
    # Verificar email único si se proporciona
    if data.email:
        existing_email = await db.execute(
            select(UsuarioStaff).where(UsuarioStaff.email == data.email)
        )
        if existing_email.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="El email ya está registrado")

    # Verificar documento único
    existing_doc = await db.execute(
        select(UsuarioStaff).where(UsuarioStaff.documento == data.documento)
    )
    if existing_doc.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El documento ya está registrado")

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
        select(UsuarioStaff).where(UsuarioStaff.id == str(staff_id))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Staff no encontrado")

    update_data = data.model_dump(exclude_unset=True)
    if "password" in update_data:
        pwd = update_data.pop("password")
        if pwd:
            user.password_hash = bcrypt.hashpw(pwd.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
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
        select(UsuarioStaff).where(UsuarioStaff.id == str(staff_id))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Staff no encontrado")

    user.fcm_token = data.fcm_token
    await db.commit()
    return {"message": "FCM Token actualizado correctamente"}


@router.post("/olvide-password")
async def olvide_password(
    data: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    import smtplib
    from email.mime.text import MIMEText
    
    result = await db.execute(select(UsuarioStaff).where(UsuarioStaff.email == data.email))
    user = result.scalar_one_or_none()
    
    if not user:
        # Resolvemos siempre OK por seguridad para evitar enumeración de cuentas
        return {"message": "Si el correo está registrado, recibirás un enlace."}
        
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        raise HTTPException(status_code=500, detail="El servidor SMTP no está configurado.")

    expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode = {"sub": str(user.id), "action": "reset_password", "exp": expire}
    token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    reset_link = f"{settings.FRONTEND_URL}/recuperar-password?token={token}"
    
    msg = MIMEText(f"Hola {user.nombre},\n\nHaz clic en el siguiente enlace para restablecer tu contraseña:\n{reset_link}\n\nEste enlace caduca en 30 minutos.")
    msg['Subject'] = 'Recuperación de Contraseña - ClearHost'
    msg['From'] = settings.SMTP_USER
    msg['To'] = user.email

    try:
        server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT)
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error enviando email")

    return {"message": "Si el correo está registrado, recibirás un enlace."}


@router.post("/reset-password")
async def reset_password(
    data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        payload = jwt.decode(data.token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        action = payload.get("action")
        if action != "reset_password" or not user_id:
            raise ValueError("Token inválido")
    except JWTError:
        raise HTTPException(status_code=400, detail="El enlace es inválido o ha expirado")

    result = await db.execute(select(UsuarioStaff).where(UsuarioStaff.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    hashed = bcrypt.hashpw(data.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user.password_hash = hashed
    await db.commit()
    
    return {"message": "Contraseña restablecida exitosamente"}
