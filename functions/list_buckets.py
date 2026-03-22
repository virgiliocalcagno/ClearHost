
import os
from google.cloud import storage
import firebase_admin
from firebase_admin import credentials

def list_buckets():
    try:
        cred_path = "c:/Users/virgi/ClearHos/functions/firebase-credentials.json"
        if not os.path.exists(cred_path):
            print(f"Error: No se encontró el archivo de credenciales en {cred_path}")
            return

        cred = credentials.Certificate(cred_path)
        # Inicializar firebase_admin solo si no está inicializado
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        
        # Usar el cliente de storage con las credenciales
        client = storage.Client.from_service_account_json(cred_path)
        buckets = list(client.list_buckets())
        print("BUCKETS ENCONTRADOS:")
        for bucket in buckets:
            print(f"- {bucket.name}")
        
        if not buckets:
            print("No se encontraron buckets. ¿Está habilitado Storage?")
    except Exception as e:
        print(f"Error al listar buckets: {e}")

if __name__ == "__main__":
    list_buckets()
