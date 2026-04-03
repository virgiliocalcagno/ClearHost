import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def migrate():
    if not DATABASE_URL:
        print("❌ Error: No se encontró DATABASE_URL en el archivo .env")
        return

    print(f"🚀 Conectando a la base de datos: {DATABASE_URL.split('@')[-1]}") # Mostrar host sin credenciales
    engine = create_async_engine(DATABASE_URL)

    async with engine.begin() as conn:
        print("🛠 Añadiendo nuevas columnas a la tabla 'reservas'...")
        
        # SQL para añadir columnas si no existen
        queries = [
            "ALTER TABLE reservas ADD COLUMN IF NOT EXISTS doc_identidad VARCHAR(100);",
            "ALTER TABLE reservas ADD COLUMN IF NOT EXISTS nacionalidad VARCHAR(100);",
            "ALTER TABLE reservas ADD COLUMN IF NOT EXISTS telefono_huesped VARCHAR(50);"
        ]
        
        for query in queries:
            try:
                await conn.execute(text(query))
                print(f"✅ Ejecutado: {query}")
            except Exception as e:
                print(f"⚠️ Error o ya existe: {e}")

    print("\n✨ Migración completada con éxito. Ya puedes usar los nuevos campos en la nube.")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(migrate())
