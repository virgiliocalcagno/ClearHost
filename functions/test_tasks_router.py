import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.models.usuario_staff import UsuarioStaff, RolStaff
from app.routers.tareas import listar_tareas
from app.database import Base

async def test_router():
    DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_Q8DNcmCL6ZgJ@ep-odd-salad-amnmroia-pooler.c-5.us-east-1.aws.neon.tech/neondb?ssl=require"
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        # Fetch the real admin user
        res = await db.execute(select(UsuarioStaff).where(UsuarioStaff.email == 'virgiliocalcagno@gmail.com'))
        admin = res.scalar_one()
        print(f"Testing as user: {admin.email} (Role: {admin.rol})")
        
        # Call the router function
        tareas = await listar_tareas(db=db, current_user=admin)
        print(f"Total Tareas devueltas por el router: {len(tareas)}")
        for t in tareas:
            print(f" - {t.fecha_programada} | {t.estado} | {t.nombre_propiedad}")
            
    await engine.dispose()

if __name__ == "__main__":
    import os
    # Set PYTHONPATH to current dir so 'app' can be imported
    import sys
    sys.path.append(os.getcwd())
    asyncio.run(test_router())
