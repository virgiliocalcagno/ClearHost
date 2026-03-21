from firebase_functions import https_fn, options
from a2wsgi import ASGIMiddleware
from app.main import app as fastapi_app
import firebase_admin

# Inicializar Firebase Admin una sola vez al cargar el módulo
if not firebase_admin._apps:
    firebase_admin.initialize_app(options={
        "storageBucket": "clearhost-c8919.firebasestorage.app"
    })

# Adaptador para ASGI -> WSGI
wsgi_app = ASGIMiddleware(fastapi_app)

# Exponemos la app con más memoria para manejo de fotos (512MB)
@https_fn.on_request(memory=512)
def backend(req: https_fn.Request) -> https_fn.Response:
    return https_fn.Response.from_app(wsgi_app, req.environ)
