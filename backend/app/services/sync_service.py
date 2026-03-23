"""
Servicio de Sincronización Real-time — Notifica cambios a la App móvil vía Firebase RTDB.
"""

import time
import firebase_admin
from firebase_admin import db as fb_db
from app.config import get_settings

def trigger_sync(staff_id: str):
    """
    Actualiza la marca de tiempo de sincronización para un miembro del staff específico.
    Esto disparará el listener en la App móvil.
    """
    try:
        # Asegurarnos de que Firebase esté inicializado (debería estarlo en main.py)
        if not firebase_admin._apps:
            return

        ref = fb_db.reference(f"sync/{staff_id}")
        ref.update({
            "last_update": int(time.time() * 1000),
            "source": "backend"
        })
        print(f"SYNC: Notificación enviada a staff {staff_id}")
    except Exception as e:
        print(f"SYNC ERROR: No se pudo actualizar RTDB para {staff_id}: {e}")

def trigger_sync_global():
    """
    Notifica a todos los dispositivos que algo global cambió (ej: una nueva tarea sin asignar).
    """
    try:
        if not firebase_admin._apps:
            return

        ref = fb_db.reference("sync/global")
        ref.update({
            "last_update": int(time.time() * 1000)
        })
        print("SYNC: Notificación global enviada")
    except Exception as e:
        print(f"SYNC ERROR: No se pudo actualizar RTDB global: {e}")
