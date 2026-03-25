import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.config import get_settings

async def update_reservas_schema():
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL)
    
    async with engine.begin() as conn:
        print("Modificando tabla reservas para añadir campos de identidad y horas...")
        
        columns = [
            ("hora_checkin", "TIME"),
            ("hora_checkout", "TIME"),
            ("tipo_documento", "VARCHAR(50)"),
            ("documento_identidad", "VARCHAR(100)"),
            ("nacionalidad", "VARCHAR(100)")
        ]
        
        for col_name, col_type in columns:
            try:
                await conn.execute(
                    text(f"ALTER TABLE reservas ADD COLUMN {col_name} {col_type};")
                )
                print(f"✅ Columna '{col_name}' añadida.")
            except Exception as e:
                if "already exists" in str(e).lower():
                    print(f"ℹ️ Columna '{col_name}' ya existe.")
                else:
                    print(f"❌ Error al añadir '{col_name}': {e}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(update_reservas_schema())
