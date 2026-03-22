from firebase_functions import https_fn, options
from a2wsgi import ASGIMiddleware
from app.main import app as fastapi_app
import firebase_admin

# DB Migration v2 applied: rolstaff enum updated, CLEAN_AND_READY added, zona_id/manager_id columns added (2026-03-21)

# Inicializar Firebase Admin una sola vez al cargar el módulo
if not firebase_admin._apps:
    from app.config import get_settings
    settings = get_settings()
    firebase_admin.initialize_app(options={
        "storageBucket": settings.FB_STORAGE_BUCKET,
        "databaseURL": settings.FB_DATABASE_URL
    })

# Adaptador para ASGI -> WSGI
wsgi_app = ASGIMiddleware(fastapi_app)

# Exponemos la app con más memoria para manejo de fotos (1024MB)
@https_fn.on_request(memory=1024)
def backend(req: https_fn.Request) -> https_fn.Response:
    return https_fn.Response.from_app(wsgi_app, req.environ)
