from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import os
import uuid
import base64
from datetime import datetime

from app.database import get_db
from app.models.reserva import Reserva
from app.models.propiedad import Propiedad
from app.schemas.welcome import WelcomeInfoResponse, WelcomeRegisterRequest
from app.services.notifications import send_push_notification
from app.models.usuario_staff import UsuarioStaff, RolStaff

router = APIRouter(prefix="/welcome", tags=["Welcome Portal"])

@router.get("/{reserva_id}", response_model=WelcomeInfoResponse)
async def get_welcome_info(reserva_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Reserva).where(Reserva.id == reserva_id)
    )
    reserva = result.scalar_one_or_none()
    
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    
    # Obtener info de la propiedad
    prop_result = await db.execute(
        select(Propiedad).where(Propiedad.id == reserva.propiedad_id)
    )
    propiedad = prop_result.scalar_one_or_none()

    # Determinar si requiere Soft Auth (si tenemos los 4 dígitos y no ha completado el check-in)
    auth_required = False
    if reserva.telefono_ultimos_4 and not reserva.self_checkin_complete:
        auth_required = True

    # Si el check-in ya fue completado, entregamos "el premio" (WiFi, códigos)
    if reserva.self_checkin_complete:
        return WelcomeInfoResponse(
            reserva_id=reserva.id,
            nombre_huesped=reserva.nombre_huesped,
            propiedad_nombre=propiedad.nombre,
            check_in=reserva.check_in,
            check_out=reserva.check_out,
            codigo_reserva_canal=reserva.codigo_reserva_canal,
            wifi_nombre=propiedad.wifi_nombre,
            wifi_password=propiedad.wifi_password,
            codigo_puerta=propiedad.codigo_puerta,
            instrucciones_acceso=propiedad.instrucciones_acceso,
            reglas_edificio=propiedad.reglas_edificio,
            self_checkin_complete=True,
            auth_required=False
        )
    
    # Si no, solo entregamos lo básico para el formulario
    return WelcomeInfoResponse(
        reserva_id=reserva.id,
        nombre_huesped=reserva.nombre_huesped,
        propiedad_nombre=propiedad.nombre,
        check_in=reserva.check_in,
        check_out=reserva.check_out,
        codigo_reserva_canal=reserva.codigo_reserva_canal,
        self_checkin_complete=False,
        auth_required=auth_required
    )

@router.post("/{reserva_id}/unlock")
async def unlock_welcome(
    reserva_id: str,
    data: UnlockRequest,
    db: AsyncSession = Depends(get_db)
):
    """Verificar los últimos 4 dígitos para desbloquear el portal."""
    result = await db.execute(select(Reserva).where(Reserva.id == reserva_id))
    reserva = result.scalar_one_or_none()
    
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    
    if not reserva.telefono_ultimos_4:
        # Si no hay dígitos registrados, permitimos el paso (o podrías denegarlo)
        return {"status": "unlocked", "message": "No se requiere validación adicional"}

    if data.digits != reserva.telefono_ultimos_4:
        raise HTTPException(status_code=401, detail="Los dígitos no coinciden con nuestros registros")

    return {"status": "unlocked", "message": "Validación exitosa"}


@router.post("/{reserva_id}/register")
async def register_guest_data(
    reserva_id: str, 
    data: WelcomeRegisterRequest, 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Reserva).where(Reserva.id == reserva_id))
    reserva = result.scalar_one_or_none()
    
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    # Guardar foto de ID si viene en base64
    foto_url = None
    if data.foto_id_base64:
        try:
            # Procesar base64
            header, encoded = data.foto_id_base64.split(",", 1)
            file_ext = header.split("/")[1].split(";")[0]
            file_name = f"id_{reserva.id}_{uuid.uuid4().hex[:8]}.{file_ext}"
            
            # Directorio de subida (mismo que evidencias)
            upload_dir = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
            os.makedirs(upload_dir, exist_ok=True)
            
            file_path = os.path.join(upload_dir, file_name)
            with open(file_path, "wb") as f:
                f.write(base64.b64decode(encoded))
            
            foto_url = f"/uploads/{file_name}"
        except Exception as e:
            print(f"Error guardando foto ID: {e}")

    # Actualizar reserva
    reserva.nombre_huesped = data.nombre_legal
    reserva.telefono_huesped = data.whatsapp
    reserva.nacionalidad = data.nacionalidad
    if foto_url:
        reserva.foto_id_url = foto_url
    
    reserva.self_checkin_complete = True
    reserva.self_checkin_at = datetime.utcnow()
    
    await db.commit()

    # NOTIFICAR AL SUPERVISOR
    try:
        admin_result = await db.execute(
            select(UsuarioStaff).where(UsuarioStaff.rol == RolStaff.SUPER_ADMIN, UsuarioStaff.fcm_token.isnot(None))
        )
        admins = admin_result.scalars().all()
        
        for admin in admins:
            await send_push_notification(
                admin.fcm_token,
                "✅ ¡Nuevo Auto Check-in!",
                f"El huésped {reserva.nombre_huesped} ha completado su registro para la reserva {reserva.codigo_reserva_canal or 'S/N'}.",
                {"type": "SELF_CHECKIN", "reserva_id": reserva.id}
            )
    except Exception as e:
        print(f"Error al notificar: {e}")

    return {"status": "success", "message": "Registro completado con éxito"}
