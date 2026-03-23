"""
Schemas Pydantic para TareaOperativa.
"""

from datetime import datetime, date, time
from typing import Optional, Any
from pydantic import BaseModel
from app.models.tarea_operativa import EstadoTarea, PrioridadTarea

class ChecklistItem(BaseModel):
    item: str
    completado: bool = False
    requerido: bool = True

class AuditoriaActivo(BaseModel):
    activo: str
    estado: str = "OK"  # OK, FALTANTE, DAÑADO
    cantidad_esperada: int = 1
    cantidad_encontrada: int = 1
    notas: Optional[str] = None

class TareaCreate(BaseModel):
    reserva_id: Optional[Any] = None
    propiedad_id: Any
    tipo_tarea: str = "LIMPIEZA"  # LIMPIEZA, MANTENIMIENTO, DILIGENCIA
    asignado_a: Optional[Any] = None
    fecha_programada: date
    hora_inicio: Optional[time] = None
    estado: str = "PENDIENTE"
    notas_staff: Optional[str] = None
    checklist: Optional[list[ChecklistItem]] = None
    auditoria_activos: Optional[list[AuditoriaActivo]] = None
    requiere_lavado_ropa: bool = True
    pago_al_staff: float = 0.0
    moneda_tarea: str = "MXN"

class TareaUpdate(BaseModel):
    tipo_tarea: Optional[str] = None
    asignado_a: Optional[Any] = None
    fecha_programada: Optional[date] = None
    hora_inicio: Optional[time] = None
    estado: Optional[EstadoTarea] = None
    prioridad: Optional[PrioridadTarea] = None
    notas_staff: Optional[str] = None
    pago_al_staff: Optional[float] = None
    moneda_tarea: Optional[str] = None

class ChecklistUpdate(BaseModel):
    checklist: list[ChecklistItem]

class AuditoriaUpdate(BaseModel):
    auditoria_activos: list[AuditoriaActivo]

class FotoUpload(BaseModel):
    tipo: str  # "antes" o "despues"
    url: str
    descripcion: Optional[str] = None

class TareaResponse(BaseModel):
    id: Any
    reserva_id: Any
    propiedad_id: Any
    tipo_tarea: str
    asignado_a: Optional[Any] = None
    fecha_programada: date
    hora_inicio: Optional[time] = None
    estado: EstadoTarea
    prioridad: PrioridadTarea
    id_secuencial: Optional[int] = None
    fecha_asignacion: Optional[datetime] = None
    checklist: Optional[list] = None
    auditoria_activos: Optional[list] = None
    fotos_antes: Optional[list] = None
    fotos_despues: Optional[list] = None
    requiere_lavado_ropa: bool
    liquidada: bool = False
    progreso: float = 0.0
    notas_staff: Optional[str] = None
    pago_al_staff: float
    moneda_tarea: str
    completada_at: Optional[datetime] = None
    verificada_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class TareaConDetalles(TareaResponse):
    """Tarea con información de propiedad y reserva incluida."""
    nombre_propiedad: Optional[str] = None
    direccion_propiedad: Optional[str] = None
    nombre_huesped: Optional[str] = None
    nombre_asignado: Optional[str] = None
    fuente_reserva: Optional[str] = None
    check_in: Optional[date] = None
    check_out: Optional[date] = None
