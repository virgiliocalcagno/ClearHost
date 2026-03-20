"""Crear usuario ADMIN de prueba para ClearHost PMS."""
import asyncio
import bcrypt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.database import engine
from app.models.usuario_staff import UsuarioStaff, RolStaff

async def create_admin():
    password = "admin123"
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    
    async with AsyncSession(engine) as session:
        async with session.begin():
            # Borrar admin existente si hay
            await session.execute(
                delete(UsuarioStaff).where(UsuarioStaff.email == "admin@clearhost.com")
            )
            # Crear admin
            user = UsuarioStaff(
                nombre="Admin ClearHost",
                email="admin@clearhost.com",
                password_hash=hashed,
                telefono="+52 55 0000 0000",
                rol=RolStaff.ADMIN,
            )
            session.add(user)
    
    # Verificar
    async with AsyncSession(engine) as session:
        result = await session.execute(
            select(UsuarioStaff).where(UsuarioStaff.email == "admin@clearhost.com")
        )
        user = result.scalar_one_or_none()
        if user:
            ok = bcrypt.checkpw(password.encode("utf-8"), user.password_hash.encode("utf-8"))
            print(f"✅ Admin creado: {user.email}")
            print(f"   Rol: {user.rol.value}")
            print(f"   Password verify: {'OK' if ok else 'FALLO'}")
        else:
            print("❌ ERROR: admin no encontrado")

asyncio.run(create_admin())
