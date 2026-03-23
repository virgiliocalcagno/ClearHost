import asyncio
import uuid
from datetime import date, datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

# CONFIGURACIÓN NEON
DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_Q8DNcmCL6ZgJ@ep-odd-salad-amnmroia-pooler.c-5.us-east-1.aws.neon.tech/neondb"

async def restore():
    engine = create_async_engine(DATABASE_URL)
    ahora = datetime.utcnow()
    
    async with engine.begin() as conn:
        print("🗑️ Limpiando tablas...")
        await conn.execute(text("TRUNCATE tareas_operativas, reservas, propiedades, usuarios_staff, propietarios, zonas CASCADE;"))
        
        # 1. Crear Zonas
        print("🌍 Creando zonas...")
        zona_punta_cana_id = str(uuid.uuid4())
        zona_pueblo_bavaro_id = str(uuid.uuid4())
        
        await conn.execute(text("""
            INSERT INTO zonas (id, nombre, created_at, updated_at) 
            VALUES (:id, :n, :ca, :ua)
        """), [
            {"id": zona_punta_cana_id, "n": "Punta Cana / White Sands", "ca": ahora, "ua": ahora},
            {"id": zona_pueblo_bavaro_id, "n": "Pueblo Bavaro", "ca": ahora, "ua": ahora}
        ])

        # 2. Crear Propietarios
        print("👤 Creando propietario...")
        propietario_id = "d676c244-c053-47d9-95ea-c33c57373fce"
        await conn.execute(text("""
            INSERT INTO propietarios (id, nombre, email, telefono, created_at, updated_at) 
            VALUES (:id, :n, :e, :t, :ca, :ua)
        """), {"id": propietario_id, "n": "Virgilio Calcagno", "e": "virgiliocalcagno@gmail.com", "t": "19417992044", "ca": ahora, "ua": ahora})

        # 3. Crear Staff
        print("👥 Creando staff...")
        staff_sofia_id = "11111111-1111-1111-1111-111111111110"
        staff_virgilio_id = "10000000-0000-0000-0000-000000000000"
        staff_admin_id = "00000000-0000-0000-0000-000000000000"
        
        pass_hash = "$2b$12$LQv3c1VqBWjh5A.arFV6quG.fO.m1X.N8.g3Z2.Z2Z2Z2Z2Z2Z2Z"
        
        staff_data = [
            {"id": staff_admin_id, "n": "Admin ClearHost", "e": "admin@clearhost.com", "r": "SUPER_ADMIN", "z": None, "d": "V-000000"},
            {"id": staff_virgilio_id, "n": "Virgilio", "e": "virgiliocalcagno@gmail.com", "r": "SUPER_ADMIN", "z": None, "d": "V-100000"},
            {"id": staff_sofia_id, "n": "sofia", "e": "sofia@gmail.com", "r": "STAFF", "z": zona_punta_cana_id, "d": "111111110"}
        ]
        
        for s in staff_data:
            await conn.execute(text("""
                INSERT INTO usuarios_staff (id, nombre, email, password_hash, rol, zona_id, disponible, documento, created_at, updated_at)
                VALUES (:id, :n, :e, :p, :r, :z, true, :d, :ca, :ua)
            """), {"id": s['id'], "n": s['n'], "e": s['e'], "p": pass_hash, "r": s['r'], "z": s['z'], "d": s['d'], "ca": ahora, "ua": ahora})

        # 4. Crear Propiedades
        print("🏠 Creando propiedades...")
        prop_emy_id = "e31794e1-3179-4e17-b37f-0f1cc777485e"
        prop_g44_id = "42784979-1f88-4650-9bd7-28725a06562b"
        prop_seadreams_id = "5eadea31-5ead-ea31-5ead-ea315eadea31"
        
        props_data = [
            {"id": prop_emy_id, "n": "EMY virgilio", "d": "Bloque 4 ap 101", "c": "Pueblo Bavaro", "z": zona_pueblo_bavaro_id},
            {"id": prop_g44_id, "n": "G-44 virilio", "d": "G-44 3C1", "c": "white sand punta cana", "z": zona_punta_cana_id},
            {"id": prop_seadreams_id, "n": "Seadreams 1", "d": "Seadreams 1 4B2", "c": "White Sand Punta Cana", "z": zona_punta_cana_id}
        ]
        
        for p in props_data:
            await conn.execute(text("""
                INSERT INTO propiedades (id, nombre, direccion, ciudad, zona_id, propietario_id, activa, tiene_estacionamiento, num_habitaciones, created_at, updated_at)
                VALUES (:id, :n, :d, :c, :z, :oid, true, false, 1, :ca, :ua)
            """), {"id": p['id'], "n": p['n'], "d": p['d'], "c": p['c'], "z": p['z'], "oid": propietario_id, "ca": ahora, "ua": ahora})

        # 5. Crear Reservas
        print("📅 Creando reservas...")
        reservas = [
            (prop_emy_id, "Airbnb Guest 1", date(2026, 3, 4), date(2026, 3, 24), "AIRBNB", 2),
            (prop_emy_id, "Airbnb Guest 2", date(2026, 3, 23), date(2026, 3, 26), "AIRBNB", 2),
            (prop_emy_id, "Airbnb Guest 3", date(2026, 3, 25), date(2026, 3, 29), "AIRBNB", 2),
            (prop_emy_id, "Airbnb Guest 4", date(2026, 4, 3), date(2026, 4, 6), "AIRBNB", 2),
            (prop_g44_id, "Airbnb Guest 5", date(2026, 3, 16), date(2026, 3, 22), "AIRBNB", 2),
            (prop_seadreams_id, "prueba 2", date(2026, 3, 21), date(2026, 3, 22), "MANUAL", 1),
            (prop_seadreams_id, "yo", date(2026, 3, 21), date(2026, 3, 22), "MANUAL", 1),
        ]
        
        for p_id, guest, start, end, source, num in reservas:
            await conn.execute(text("""
                INSERT INTO reservas (id, propiedad_id, nombre_huesped, check_in, check_out, fuente, estado, num_huespedes, created_at, updated_at)
                VALUES (:id, :pid, :g, :s, :e, :f, 'CONFIRMADA', :n, :ca, :ua)
            """), {"id": str(uuid.uuid4()), "pid": p_id, "g": guest, "s": start, "e": end, "f": source, "n": num, "ca": ahora, "ua": ahora})

        # 6. Crear Tareas Operativas
        print("🧹 Creando tareas...")
        res_id_test = str(uuid.uuid4())
        await conn.execute(text("""
            INSERT INTO reservas (id, propiedad_id, nombre_huesped, check_in, check_out, fuente, estado, num_huespedes, created_at, updated_at)
            VALUES (:id, :pid, 'Huésped actual', :s, :e, 'AIRBNB', 'CONFIRMADA', 2, :ca, :ua)
        """), {"id": res_id_test, "pid": prop_seadreams_id, "s": date.today(), "e": date.today() + timedelta(days=2), "ca": ahora, "ua": ahora})
        
        await conn.execute(text("""
            INSERT INTO tareas_operativas (id, propiedad_id, reserva_id, asignado_a, fecha_programada, estado, tipo_tarea, prioridad, moneda_tarea, pago_al_staff, requiere_lavado_ropa, created_at, updated_at)
            VALUES (:id, :pid, :rid, :aid, :fecha, 'EN_PROGRESO', 'LIMPIEZA', 'ALTA', 'MXN', 0, false, :ca, :ua)
        """), {
            "id": str(uuid.uuid4()), "pid": prop_seadreams_id, "rid": res_id_test, 
            "aid": staff_sofia_id, "fecha": date.today(), "ca": ahora, "ua": ahora
        })

    print("✅ RESTAURACIÓN COMPLETADA")

if __name__ == "__main__":
    asyncio.run(restore())
