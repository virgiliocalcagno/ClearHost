"""
Router de Propietarios — CRUD + Dashboard consolidado.
El endpoint /dashboard devuelve en una sola llamada toda la info
del propietario: sus propiedades, reservas activas, tareas e incidencias.
"""

from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.propietario import Propietario
from app.models.propiedad import Propiedad
from app.models.reserva import Reserva
from app.models.tarea_limpieza import TareaLimpieza
from app.models.incidencia import Incidencia
from app.schemas.propietario import PropietarioCreate, PropietarioUpdate, PropietarioResponse

router = APIRouter(prefix="/propietarios", tags=["Propietarios"])


# ─── CRUD Básico ──────────────────────────────────────────────

@router.get("/", response_model=list[PropietarioResponse])
async def listar_propietarios(db: AsyncSession = Depends(get_db)):
    """Listar todos los propietarios."""
    query = select(Propietario).order_by(Propietario.nombre)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=PropietarioResponse, status_code=status.HTTP_201_CREATED)
async def crear_propietario(data: PropietarioCreate, db: AsyncSession = Depends(get_db)):
    """Crear un nuevo propietario."""
    propietario = Propietario(**data.model_dump())
    db.add(propietario)
    await db.flush()
    await db.refresh(propietario)
    return propietario


@router.get("/{propietario_id}", response_model=PropietarioResponse)
async def obtener_propietario(propietario_id: str, db: AsyncSession = Depends(get_db)):
    """Obtener un propietario por su ID."""
    result = await db.execute(select(Propietario).where(Propietario.id == propietario_id))
    propietario = result.scalar_one_or_none()
    if not propietario:
        raise HTTPException(status_code=404, detail="Propietario no encontrado")
    return propietario


@router.put("/{propietario_id}", response_model=PropietarioResponse)
async def actualizar_propietario(propietario_id: str, data: PropietarioUpdate, db: AsyncSession = Depends(get_db)):
    """Actualizar un propietario."""
    result = await db.execute(select(Propietario).where(Propietario.id == propietario_id))
    propietario = result.scalar_one_or_none()
    if not propietario:
        raise HTTPException(status_code=404, detail="Propietario no encontrado")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(propietario, field, value)

    await db.flush()
    await db.refresh(propietario)
    return propietario


@router.delete("/{propietario_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_propietario(propietario_id: str, db: AsyncSession = Depends(get_db)):
    """Eliminar un propietario."""
    result = await db.execute(select(Propietario).where(Propietario.id == propietario_id))
    propietario = result.scalar_one_or_none()
    if not propietario:
        raise HTTPException(status_code=404, detail="Propietario no encontrado")

    await db.delete(propietario)
    await db.flush()


# ─── Dashboard Consolidado ──────────────────────────────────────────────

@router.get("/{propietario_id}/dashboard")
async def dashboard_propietario(
    propietario_id: str,
    mes: int = Query(default=None, ge=1, le=12, description="Mes para filtrar finanzas (1-12)"),
    anio: int = Query(default=None, ge=2020, description="Año para filtrar finanzas"),
    db: AsyncSession = Depends(get_db),
):
    """
    Dashboard consolidado del propietario.
    Devuelve: info del propietario, sus propiedades, reservas activas,
    tareas recientes e incidencias abiertas. También calcula un resumen
    financiero básico (número de noches, tareas completadas, incidencias, etc.)
    """
    # 1. Obtener propietario
    res = await db.execute(select(Propietario).where(Propietario.id == propietario_id))
    propietario = res.scalar_one_or_none()
    if not propietario:
        raise HTTPException(status_code=404, detail="Propietario no encontrado")

    # 2. Propiedades del propietario
    res_props = await db.execute(
        select(Propiedad).where(Propiedad.propietario_id == propietario_id)
    )
    propiedades = res_props.scalars().all()
    propiedad_ids = [p.id for p in propiedades]

    # Si no tiene propiedades, devolver respuesta vacía coherente
    if not propiedad_ids:
        return {
            "propietario": _serialize_propietario(propietario),
            "propiedades": [],
            "reservas": [],
            "tareas": [],
            "incidencias": [],
            "resumen": {
                "total_propiedades": 0,
                "reservas_activas": 0,
                "tareas_pendientes": 0,
                "incidencias_abiertas": 0,
                "noches_mes": 0,
            },
        }

    # Determinar rango de mes para filtros financieros
    hoy = date.today()
    filtro_mes = mes or hoy.month
    filtro_anio = anio or hoy.year

    # 3. Reservas de sus propiedades
    res_reservas = await db.execute(
        select(Reserva).where(Reserva.propiedad_id.in_(propiedad_ids))
        .order_by(Reserva.check_in.desc())
    )
    reservas = res_reservas.scalars().all()

    # 4. Tareas de sus propiedades
    res_tareas = await db.execute(
        select(TareaLimpieza).where(TareaLimpieza.propiedad_id.in_(propiedad_ids))
        .order_by(TareaLimpieza.fecha_programada.desc())
    )
    tareas = res_tareas.scalars().all()

    # 5. Incidencias de sus propiedades
    res_incidencias = await db.execute(
        select(Incidencia).where(Incidencia.propiedad_id.in_(propiedad_ids))
        .order_by(Incidencia.fecha_reporte.desc())
    )
    incidencias = res_incidencias.scalars().all()

    # 6. Resumen financiero del mes
    reservas_activas = [r for r in reservas if r.estado == "CONFIRMADA"]
    tareas_pendientes = [t for t in tareas if t.estado in ("PENDIENTE", "EN_PROGRESO")]
    incidencias_abiertas = [i for i in incidencias if i.estado not in ("RESUELTO",)]

    # Calcular noches ocupadas en el mes filtrado
    noches_mes = 0
    for r in reservas:
        if r.estado == "CONFIRMADA" and r.check_in and r.check_out:
            try:
                ci = r.check_in if isinstance(r.check_in, date) else date.fromisoformat(str(r.check_in))
                co = r.check_out if isinstance(r.check_out, date) else date.fromisoformat(str(r.check_out))
                # Intersectar con el mes solicitado
                inicio_mes = date(filtro_anio, filtro_mes, 1)
                if filtro_mes == 12:
                    fin_mes = date(filtro_anio + 1, 1, 1)
                else:
                    fin_mes = date(filtro_anio, filtro_mes + 1, 1)
                inicio_real = max(ci, inicio_mes)
                fin_real = min(co, fin_mes)
                if fin_real > inicio_real:
                    noches_mes += (fin_real - inicio_real).days
            except (ValueError, TypeError):
                pass

    # Inventario consolidado (todos los activos de todas las propiedades)
    inventario_consolidado = []
    for p in propiedades:
        if p.activos_inventario:
            for activo in p.activos_inventario:
                inventario_consolidado.append({
                    **activo,
                    "propiedad_id": p.id,
                    "propiedad_nombre": p.nombre,
                })

    return {
        "propietario": _serialize_propietario(propietario),
        "propiedades": [_serialize_propiedad(p) for p in propiedades],
        "reservas": [_serialize_reserva(r, propiedad_ids, propiedades) for r in reservas[:50]],
        "tareas": [_serialize_tarea(t, propiedades) for t in tareas[:50]],
        "incidencias": [_serialize_incidencia(i, propiedades) for i in incidencias[:30]],
        "inventario": inventario_consolidado,
        "resumen": {
            "total_propiedades": len(propiedades),
            "reservas_activas": len(reservas_activas),
            "tareas_pendientes": len(tareas_pendientes),
            "incidencias_abiertas": len(incidencias_abiertas),
            "noches_mes": noches_mes,
            "mes_filtro": filtro_mes,
            "anio_filtro": filtro_anio,
        },
    }


# ─── Helpers de serialización ──────────────────────────────────────────────

def _serialize_propietario(p: Propietario) -> dict:
    return {
        "id": str(p.id),
        "nombre": p.nombre,
        "email": p.email,
        "telefono": p.telefono,
        "datos_bancarios": p.datos_bancarios,
        "notas": p.notas,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }


def _serialize_propiedad(p: Propiedad) -> dict:
    return {
        "id": str(p.id),
        "nombre": p.nombre,
        "direccion": p.direccion,
        "ciudad": p.ciudad,
        "num_habitaciones": p.num_habitaciones,
        "activa": p.activa,
        "ical_url": p.ical_url,
        "hora_checkin": str(p.hora_checkin) if p.hora_checkin else None,
        "hora_checkout": str(p.hora_checkout) if p.hora_checkout else None,
        "activos_inventario": p.activos_inventario,
        "tarifa_limpieza": p.tarifa_limpieza,
        "notas": p.notas,
    }


def _serialize_reserva(r: Reserva, prop_ids: list, propiedades: list) -> dict:
    prop = next((p for p in propiedades if p.id == r.propiedad_id), None)
    return {
        "id": str(r.id),
        "propiedad_id": str(r.propiedad_id),
        "propiedad_nombre": prop.nombre if prop else "—",
        "nombre_huesped": r.nombre_huesped,
        "check_in": str(r.check_in),
        "check_out": str(r.check_out),
        "num_huespedes": r.num_huespedes,
        "estado": r.estado,
        "fuente": r.fuente,
    }


def _serialize_tarea(t: TareaLimpieza, propiedades: list) -> dict:
    prop = next((p for p in propiedades if p.id == t.propiedad_id), None)
    return {
        "id": str(t.id),
        "propiedad_id": str(t.propiedad_id),
        "propiedad_nombre": prop.nombre if prop else "—",
        "fecha_programada": str(t.fecha_programada),
        "estado": t.estado,
        "prioridad": t.prioridad,
        "tarifa_limpieza": prop.tarifa_limpieza if prop else None,
        "completada_at": t.completada_at.isoformat() if t.completada_at else None,
    }


def _serialize_incidencia(i: Incidencia, propiedades: list) -> dict:
    prop = next((p for p in propiedades if p.id == i.propiedad_id), None)
    return {
        "id": str(i.id),
        "propiedad_id": str(i.propiedad_id),
        "propiedad_nombre": prop.nombre if prop else "—",
        "titulo": i.titulo,
        "tipo": i.tipo,
        "estado": i.estado,
        "urgente": i.urgente,
        "costo_estimado": i.costo_estimado,
        "fecha_reporte": i.fecha_reporte.isoformat() if i.fecha_reporte else None,
    }
