
import os
from google.cloud import storage

def create_emergency_bucket():
    try:
        cred_path = "c:/Users/virgi/ClearHos/functions/firebase-credentials.json"
        project_id = "clearhost-c8919"
        # Usar un nombre que no sea un dominio-estilo para evitar validación de propiedad
        bucket_name = f"{project_id}-evidencias"
        
        client = storage.Client.from_service_account_json(cred_path)
        
        print(f"Intentando crear bucket de ACERO: {bucket_name}...")
        bucket = client.create_bucket(bucket_name, location="us-central1")
        print(f"¡ÉXITO ABSOLUTO! Bucket '{bucket.name}' creado.")
        return bucket.name
    except Exception as e:
        print(f"Error fatal al crear bucket: {e}")
        return None

if __name__ == "__main__":
    create_emergency_bucket()
