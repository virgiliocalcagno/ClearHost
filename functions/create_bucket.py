
import os
from google.cloud import storage
import firebase_admin
from firebase_admin import credentials

def create_default_bucket():
    try:
        cred_path = "c:/Users/virgi/ClearHos/functions/firebase-credentials.json"
        project_id = "clearhost-c8919"
        bucket_name = f"{project_id}.appspot.com"
        
        client = storage.Client.from_service_account_json(cred_path)
        
        print(f"Intentando crear bucket: {bucket_name}...")
        bucket = client.create_bucket(bucket_name, location="us-central1")
        print(f"¡ÉXITO! Bucket '{bucket.name}' creado.")
        return True
    except Exception as e:
        print(f"Error al crear bucket: {e}")
        return False

if __name__ == "__main__":
    create_default_bucket()
