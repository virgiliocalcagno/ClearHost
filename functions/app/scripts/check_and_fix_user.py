import asyncio
import sys
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.usuario_staff import UsuarioStaff, RolStaff

async def check_user(email):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(UsuarioStaff).where(UsuarioStaff.email == email))
        user = result.scalar_one_or_none()
        if user:
            print(f"Usuario: {user.nombre}")
            print(f"Email: {user.email}")
            print(f"Rol actual: {user.rol}")
            
            if user.rol != RolStaff.SUPER_ADMIN:
                print(f"Actualizando a {RolStaff.SUPER_ADMIN}...")
                user.rol = RolStaff.SUPER_ADMIN
                await db.commit()
                print("¡Actualizado!")
        else:
            print(f"Usuario {email} no encontrado.")

if __name__ == "__main__":
    email = sys.argv[1] if len(sys.argv) > 1 else "virgiliocalcagno@gmail.com"
    asyncio.run(check_user(email))
