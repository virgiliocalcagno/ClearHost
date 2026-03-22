import asyncio
from sqlalchemy import text
from app.database import engine

async def fix_database():
    async with engine.connect() as conn:
        print("--- Verificando Enums ---")
        try:
            # Intentar agregar los nuevos valores al Enum de staff_rol
            # Nota: ALTER TYPE no puede ejecutarse dentro de una transacción en algunos casos, 
            # pero asyncpg e SQLAlchemy suelen manejarlo bien si usamos execution_options(isolation_level="AUTOCOMMIT")
            await conn.execute(text("COMMIT")) # Salir de cualquier transacción abierta
            
            # Verificar valores actuales
            res = await conn.execute(text("SELECT enum_range(NULL::rolstaff)")) # Según el modelo es RolStaff o staff_rol
            # Si falla arriba, intentamos con el nombre que JPA/SQLAlchemy suele usar
            print(f"Valores actuales del Enum: {res.scalar()}")
        except Exception as e:
            print(f"Error al leer enum: {e}. Intentando actualizar...")
            
        # Intentar actualizaciones comunes
        enum_names = ["rolstaff", "staff_rol"] # Nombres probables
        new_roles = ["SUPER_ADMIN", "MANAGER_LOCAL"]
        
        for name in enum_names:
            for role in new_roles:
                try:
                    await conn.execute(text(f"ALTER TYPE {name} ADD VALUE '{role}'"))
                    print(f"✅ Agregado '{role}' a TYPE {name}")
                except Exception as e:
                    if "already exists" in str(e).lower():
                        print(f"ℹ️ '{role}' ya existe en {name}")
                    else:
                        print(f"❌ Error al agregar '{role}' a {name}: {e}")

        print("\n--- Creando Tablas Faltantes ---")
        # Forzar creación de tablas importando modelos
        from app.models.gasto_operativo import GastoOperativo
        from app.database import Base
        async with engine.begin() as conn_init:
            await conn_init.run_sync(Base.metadata.create_all)
        print("✅ Proceso de creación de tablas finalizado.")

if __name__ == "__main__":
    asyncio.run(fix_database())
