"""Crear usuario staff de prueba — versión corregida."""
import asyncio
import bcrypt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.database import engine
from app.models.usuario_staff import UsuarioStaff, RolStaff

async def create_user():
    password = "staff123"
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    
    async with AsyncSession(engine) as session:
        async with session.begin():
            # Borrar usuario existente si hay
            await session.execute(
                delete(UsuarioStaff).where(UsuarioStaff.email == "maria@clearhost.com")
            )
            # Crear nuevo
            user = UsuarioStaff(
                nombre="Maria Garcia",
                email="maria@clearhost.com",
                password_hash=hashed,
                telefono="+52 55 1234 5678",
                rol=RolStaff.LIMPIEZA,
            )
            session.add(user)
    
    # Verificar que se puede hacer login
    async with AsyncSession(engine) as session:
        result = await session.execute(
            select(UsuarioStaff).where(UsuarioStaff.email == "maria@clearhost.com")
        )
        user = result.scalar_one_or_none()
        if user:
            ok = bcrypt.checkpw(password.encode("utf-8"), user.password_hash.encode("utf-8"))
            print(f"Usuario: {user.email}")
            print(f"Hash: {user.password_hash[:20]}...")
            print(f"Verificacion password: {'OK' if ok else 'FALLO'}")
        else:
            print("ERROR: usuario no encontrado")

asyncio.run(create_user())
