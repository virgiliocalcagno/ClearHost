import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.config import get_settings

async def update_schema():
    settings = get_settings()
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")
    
    engine = create_async_engine(db_url)
    
    async with engine.begin() as conn:
        print("--- Iniciando actualización de esquema ---")
        
        # 1. DROP previous failed table (cleanup)
        print("Limpiando tabla 'propietarios' previa...")
        await conn.execute(text("DROP TABLE IF EXISTS propietarios CASCADE;"))
        
        # 2. Crear tabla propietarios con VARCHAR(36)
        print("Creando tabla 'propietarios'...")
        try:
            await conn.execute(text("""
                CREATE TABLE propietarios (
                    id VARCHAR(36) PRIMARY KEY,
                    nombre VARCHAR(100) NOT NULL,
                    email VARCHAR(100),
                    telefono VARCHAR(20),
                    datos_bancarios TEXT,
                    notas TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
            print("✓ Tabla 'propietarios' creada.")
        except Exception as e:
            print(f"✘ Error creando tabla propietarios: {e}")

        # 3. Añadir propietario_id a propiedades con VARCHAR(36)
        print("Añadiendo columna 'propietario_id' a 'propiedades'...")
        try:
            await conn.execute(text("""
                ALTER TABLE propiedades 
                ADD COLUMN IF NOT EXISTS propietario_id VARCHAR(36) REFERENCES propietarios(id) ON DELETE SET NULL;
            """))
            print("✓ Columna 'propietario_id' añadida a 'propiedades'.")
        except Exception as e:
            print(f"✘ Error añadiendo columna propietario_id: {e}")
            
        print("--- Finalizado ---")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(update_schema())
