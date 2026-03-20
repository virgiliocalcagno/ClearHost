from firebase_functions import https_fn
from a2wsgi import ASGIMiddleware
from app.main import app as fastapi_app

# Adaptador para ASGI -> WSGI (Cloud Functions / Firebase usa Flask / WSGI)
wsgi_app = ASGIMiddleware(fastapi_app)

# Exponemos la app de FastAPI como una función de Firebase
@https_fn.on_request()
def backend(req: https_fn.Request) -> https_fn.Response:
    return https_fn.Response.from_app(wsgi_app, req.environ)
