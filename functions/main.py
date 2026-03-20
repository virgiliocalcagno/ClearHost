from firebase_functions import https_fn
from mangum import Mangum
from app.main import app as fastapi_app

# Adaptador para ASGI -> Cloud Functions
handler = Mangum(fastapi_app, lifespan="off")

# Exponemos la app de FastAPI como una función de Firebase
@https_fn.on_request()
def backend(req: https_fn.Request) -> https_fn.Response:
    # Mangum se encarga de traducir el evento de Firebase a ASGI
    return https_fn.handle_request(fastapi_app, req)
