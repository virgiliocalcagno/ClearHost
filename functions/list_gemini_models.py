import google.generativeai as genai
import os
from dotenv import load_dotenv

# Cargar .env desde la carpeta functions
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("❌ ERROR: No se encontró GEMINI_API_KEY en el entorno.")
else:
    print(f"🔑 Usando API Key: {api_key[:5]}...{api_key[-5:]}")
    genai.configure(api_key=api_key)
    try:
        print("🔍 Listando modelos disponibles...")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"✅ {m.name}")
    except Exception as e:
        print(f"❌ Error al listar modelos: {e}")
