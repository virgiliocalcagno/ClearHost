import asyncio
from sqlalchemy import text
from app.database import engine

async def migrate_enum():
    async with engine.connect() as conn:
        print("--- Migrando Enum RolStaff ---")
        # El comando ALTER TYPE ADD VALUE no puede ejecutarse dentro de bloques transaccionales en PG < 12
        # o suele requerir estar fuera de una transacción. 
        # PostgreSQL permite agregar valores si no estamos en un bloque BEGIN/COMMIT.
        
        roles_to_add = ["SUPER_ADMIN", "MANAGER_LOCAL"]
        
        # En SQLAlchemy Async, usualmente cada execute es una transacción. 
        # Intentaremos usar el modo autocommit oCOMMIT manual previo.
        await conn.execute(text("COMMIT"))
        
        for role in roles_to_add:
            try:
                # Importante: Algunos drivers/versiones requieren nombres de tipo entre comillas si tienen mayúsculas,
                # pero vimos 'rolstaff' en minúsculas en pg_type.
                query = text(f"ALTER TYPE rolstaff ADD VALUE '{role}'")
                await conn.execute(query)
                print(f"✅ Valor '{role}' agregado a rolstaff.")
            except Exception as e:
                if "already exists" in str(e).lower():
                    print(f"ℹ️ Valor '{role}' ya existe en rolstaff.")
                else:
                    print(f"❌ Error al agregar '{role}': {e}")
        
        # También verificamos 'estadotarea' por si acaso agregamos alguno nuevo antes
        # (aunque por ahora el usuario no lo pidió explícitamente en este turno, 
        # pero es bueno asegurar los estados 'ASIGNADA_NO_CONFIRMADA', 'ACEPTADA', 'CLEAN_AND_READY' que se mencionaron en historias previas)
        
        new_statuses = ["ASIGNADA_NO_CONFIRMADA", "ACEPTADA", "CLEAN_AND_READY"]
        for status in new_statuses:
            try:
                await conn.execute(text(f"ALTER TYPE estadotarea ADD VALUE '{status}'"))
                print(f"✅ Estado '{status}' agregado a estadotarea.")
            except Exception as e:
                if "already exists" in str(e).lower():
                    pass
                else:
                    print(f"❌ Error al agregar estado '{status}': {e}")

if __name__ == "__main__":
    asyncio.run(migrate_enum())
