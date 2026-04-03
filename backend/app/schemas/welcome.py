from pydantic import BaseModel
from typing import Optional
from datetime import date

class WelcomeInfoResponse(BaseModel):
    reserva_id: str
    nombre_huesped: str
    propiedad_nombre: str
    check_in: date
    check_out: date
    codigo_reserva_canal: Optional[str] = None
    
    # Datos de acceso (Solo se revelan tras registro/validación)
    wifi_nombre: Optional[str] = None
    wifi_password: Optional[str] = None
    codigo_puerta: Optional[str] = None
    instrucciones_acceso: Optional[str] = None
    reglas_edificio: Optional[str] = None

    self_checkin_complete: bool
    auth_required: bool = False

class UnlockRequest(BaseModel):
    digits: str

class WelcomeRegisterRequest(BaseModel):
    nombre_legal: str
    whatsapp: str
    nacionalidad: Optional[str] = None
    foto_id_base64: Optional[str] = None  # Para subir a Firebase
