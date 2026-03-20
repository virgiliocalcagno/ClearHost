
import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.usuario_staff import UsuarioStaff

async def check_staff():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(UsuarioStaff))
        staff = result.scalars().all()
        for s in staff:
            print(f"ID: {s.id}, Email: {s.email}, Nombre: {s.nombre}")

if __name__ == "__main__":
    asyncio.run(check_staff())
