from app.main import app as fastapi_app
from a2wsgi import ASGIMiddleware
import json

wsgi_app = ASGIMiddleware(fastapi_app)

def create_env(path):
    return {
        'REQUEST_METHOD': 'GET',
        'SCRIPT_NAME': '',
        'PATH_INFO': path,
        'SERVER_NAME': 'localhost',
        'SERVER_PORT': '80',
        'SERVER_PROTOCOL': 'HTTP/1.1',
        'wsgi.version': (1,0),
        'wsgi.url_scheme': 'http',
        'wsgi.input': None,
        'wsgi.errors': None,
        'wsgi.multithread': False,
        'wsgi.multiprocess': False,
        'wsgi.run_once': False
    }

environ = create_env('/api/seed_db')

def start_response(status, headers):
    print("STATUS:", status)
    print("HEADERS:", headers)

response = wsgi_app(environ, start_response)
body = b"".join(response)
print("BODY:", body.decode("utf-8"))
