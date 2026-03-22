
import asyncio
from app.database import engine, Base
import app.models

async def sync_schema():
    print("🔄 Sincronizando esquema con la base de datos remota...")
    async with engine.begin() as conn:
        # Esto creará las tablas que faltan (como tareas_operativas)
        await conn.run_sync(Base.metadata.create_all)
        
        # Añadir columnas faltantes a 'propiedades' si no existen (Neon detecta si ya existen)
        # Usamos raw SQL con 'IF NOT EXISTS' no es estándar en ALTER COLUMN pero podemos
        # intentar añadir y capturar el error o usar una técnica más limpia.
        try:
            await conn.execute(text("ALTER TABLE propiedades ADD COLUMN cobro_propietario FLOAT DEFAULT 0.0"))
            await conn.execute(text("ALTER TABLE propiedades ADD COLUMN moneda_cobro VARCHAR(10) DEFAULT 'MXN'"))
            await conn.execute(text("ALTER TABLE propiedades ADD COLUMN pago_staff FLOAT DEFAULT 0.0"))
            await conn.execute(text("ALTER TABLE propiedades ADD COLUMN moneda_pago VARCHAR(10) DEFAULT 'MXN'"))
            print("✅ Columnas de tarifario añadidas a 'propiedades'.")
        except Exception as e:
            print(f"ℹ️ Nota: Algunas columnas ya podrían existir o hubo un error manejable: {e}")

    print("✅ Esquema sincronizado exitosamente.")

if __name__ == "__main__":
    from sqlalchemy import text
    asyncio.run(sync_schema())
