"""
Seed de datos de prueba para ClearHost PMS.
Crea propiedades, reservas y tareas de limpieza asignadas a Maria.
"""
import asyncio
from datetime import date, time, datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.database import engine
from app.models.propiedad import Propiedad
from app.models.reserva import Reserva, FuenteReserva, EstadoReserva
from app.models.tarea_operativa import TareaOperativa, EstadoTarea
from app.models.usuario_staff import UsuarioStaff


async def seed():
    hoy = date.today()
    manana = hoy + timedelta(days=1)

    async with AsyncSession(engine) as session:
        async with session.begin():
            # Limpiar datos previos (orden por FK)
            await session.execute(delete(TareaOperativa))
            await session.execute(delete(Reserva))
            await session.execute(delete(Propiedad))

        # Obtener staff Maria
        async with session.begin():
            result = await session.execute(
                select(UsuarioStaff).where(UsuarioStaff.email == "maria@clearhost.com")
            )
            maria = result.scalar_one_or_none()
            if not maria:
                print("❌ No se encontró el usuario maria@clearhost.com")
                print("   Ejecuta primero: python create_user.py")
                return

            maria_id = maria.id
            print(f"✅ Staff encontrado: {maria.nombre} (ID: {maria_id})")

        # --- Propiedades ---
        async with session.begin():
            prop1 = Propiedad(
                nombre="Casa Playa Cancún",
                direccion="Calle Kukulcán 45, Zona Hotelera",
                ciudad="Cancún",
                num_habitaciones=3,
                cobro_propietario=65.0,
                moneda_cobro="USD",
                pago_staff=1800.0,
                moneda_pago="MXN",
                checklist_template=[
                    {"item": "Papel de baño en todos los baños", "requerido": True},
                    {"item": "Sábanas limpias en todas las camas", "requerido": True},
                    {"item": "Toallas limpias", "requerido": True},
                    {"item": "Cocina limpia y ordenada", "requerido": True},
                    {"item": "Pisos barridos y trapeados", "requerido": True},
                    {"item": "Basura retirada", "requerido": True},
                    {"item": "Piscina revisada", "requerido": False},
                    {"item": "Terraza limpia", "requerido": False},
                ],
                activos_inventario=[
                    {"activo": "Control remoto TV", "cantidad": 2},
                    {"activo": "Control remoto A/C", "cantidad": 3},
                    {"activo": "Juego de llaves", "cantidad": 2},
                    {"activo": "Toallas de baño", "cantidad": 8},
                    {"activo": "Toallas de mano", "cantidad": 6},
                    {"activo": "Almohadas", "cantidad": 6},
                ],
            )
            prop2 = Propiedad(
                nombre="Depto Centro CDMX",
                direccion="Av. Reforma 220, Piso 8",
                ciudad="Ciudad de México",
                num_habitaciones=2,
                cobro_propietario=45.0,
                moneda_cobro="USD",
                pago_staff=1200.0,
                moneda_pago="MXN",
                checklist_template=[
                    {"item": "Papel de baño en todos los baños", "requerido": True},
                    {"item": "Sábanas limpias en todas las camas", "requerido": True},
                    {"item": "Toallas limpias", "requerido": True},
                    {"item": "Cocina limpia y ordenada", "requerido": True},
                    {"item": "Pisos barridos y trapeados", "requerido": True},
                    {"item": "Basura retirada", "requerido": True},
                    {"item": "WiFi funcionando", "requerido": False},
                ],
                activos_inventario=[
                    {"activo": "Control remoto TV", "cantidad": 1},
                    {"activo": "Control remoto A/C", "cantidad": 2},
                    {"activo": "Juego de llaves", "cantidad": 2},
                    {"activo": "Toallas de baño", "cantidad": 4},
                    {"activo": "Almohadas", "cantidad": 4},
                ],
            )
            prop3 = Propiedad(
                nombre="Villa Tulum",
                direccion="Carretera Tulum-Boca Paila Km 5",
                ciudad="Tulum",
                num_habitaciones=4,
            )
            session.add_all([prop1, prop2, prop3])

        async with session.begin():
            result = await session.execute(select(Propiedad).order_by(Propiedad.nombre))
            props = result.scalars().all()
            prop_ids = []
            for p in props:
                prop_ids.append(p.id)
                print(f"  🏠 {p.nombre} — {p.ciudad}")

        prop1_id = prop_ids[0]  # Casa Playa Cancún
        prop2_id = prop_ids[1]  # Depto Centro CDMX
        prop3_id = prop_ids[2]  # Villa Tulum

        # --- Reservas ---
        async with session.begin():
            res1 = Reserva(
                propiedad_id=prop1_id,
                fuente=FuenteReserva.AIRBNB,
                nombre_huesped="Carlos Ramírez",
                check_in=hoy - timedelta(days=3),
                check_out=hoy,
                num_huespedes=4,
                estado=EstadoReserva.CONFIRMADA,
                notas="Familia con niños. Check-out a las 11am.",
            )
            res2 = Reserva(
                propiedad_id=prop2_id,
                fuente=FuenteReserva.BOOKING,
                nombre_huesped="Ana López",
                check_in=hoy - timedelta(days=2),
                check_out=hoy,
                num_huespedes=2,
                estado=EstadoReserva.CONFIRMADA,
                notas="Pareja. Check-out a las 12pm.",
            )
            res3 = Reserva(
                propiedad_id=prop3_id,
                fuente=FuenteReserva.VRBO,
                nombre_huesped="John Smith",
                check_in=manana,
                check_out=manana + timedelta(days=5),
                num_huespedes=6,
                estado=EstadoReserva.CONFIRMADA,
            )
            session.add_all([res1, res2, res3])

        async with session.begin():
            result = await session.execute(select(Reserva).order_by(Reserva.check_in))
            reservas = result.scalars().all()
            res_ids = []
            for r in reservas:
                res_ids.append(r.id)
                print(f"  📅 {r.nombre_huesped}: {r.check_in} → {r.check_out}")

        res1_id = res_ids[0]
        res2_id = res_ids[1]

        # --- Tareas operativas (hoy, asignadas a Maria) ---
        async with session.begin():
            tarea1 = TareaOperativa(
                reserva_id=res1_id,
                propiedad_id=prop1_id,
                asignado_a=maria_id,
                fecha_programada=hoy,
                hora_inicio=time(11, 0),
                estado=EstadoTarea.PENDIENTE,
                tipo_tarea="LIMPIEZA",
                pago_al_staff=1800.0,
                moneda_tarea="MXN",
                checklist=[
                    {"item": "Papel de baño en todos los baños", "completado": False, "requerido": True},
                    {"item": "Sábanas limpias en todas las camas", "completado": False, "requerido": True},
                    {"item": "Toallas limpias", "completado": False, "requerido": True},
                    {"item": "Cocina limpia y ordenada", "completado": False, "requerido": True},
                    {"item": "Pisos barridos y trapeados", "completado": False, "requerido": True},
                    {"item": "Basura retirada", "completado": False, "requerido": True},
                    {"item": "Piscina revisada", "completado": False, "requerido": False},
                    {"item": "Terraza limpia", "completado": False, "requerido": False},
                ],
                auditoria_activos=[
                    {"activo": "Control remoto TV", "estado": "OK", "cantidad_esperada": 2, "cantidad_encontrada": 2},
                    {"activo": "Control remoto A/C", "estado": "OK", "cantidad_esperada": 3, "cantidad_encontrada": 3},
                    {"activo": "Juego de llaves", "estado": "OK", "cantidad_esperada": 2, "cantidad_encontrada": 2},
                    {"activo": "Toallas de baño", "estado": "OK", "cantidad_esperada": 8, "cantidad_encontrada": 8},
                ],
                requiere_lavado_ropa=True,
            )
            tarea2 = TareaOperativa(
                reserva_id=res2_id,
                propiedad_id=prop2_id,
                asignado_a=maria_id,
                fecha_programada=hoy,
                hora_inicio=time(14, 0),
                estado=EstadoTarea.PENDIENTE,
                tipo_tarea="LIMPIEZA",
                pago_al_staff=1200.0,
                moneda_tarea="MXN",
                checklist=[
                    {"item": "Papel de baño en todos los baños", "completado": False, "requerido": True},
                    {"item": "Sábanas limpias en todas las camas", "completado": False, "requerido": True},
                    {"item": "Toallas limpias", "completado": False, "requerido": True},
                    {"item": "Cocina limpia y ordenada", "completado": False, "requerido": True},
                    {"item": "Pisos barridos y trapeados", "completado": False, "requerido": True},
                    {"item": "Basura retirada", "completado": False, "requerido": True},
                    {"item": "WiFi funcionando", "completado": False, "requerido": False},
                ],
                auditoria_activos=[
                    {"activo": "Control remoto TV", "estado": "OK", "cantidad_esperada": 1, "cantidad_encontrada": 1},
                    {"activo": "Control remoto A/C", "estado": "OK", "cantidad_esperada": 2, "cantidad_encontrada": 2},
                    {"activo": "Juego de llaves", "estado": "OK", "cantidad_esperada": 2, "cantidad_encontrada": 2},
                ],
                requiere_lavado_ropa=True,
            )
            session.add_all([tarea1, tarea2])

        print(f"\n✅ Seed completado:")
        print(f"   3 propiedades (con tarifario inicial)")
        print(f"   3 reservas")
        print(f"   2 tareas operativas (LIMPIEZA) asignadas a Maria para hoy ({hoy})")


if __name__ == "__main__":
    asyncio.run(seed())
