import json
import os
import logging
import traceback
from fastapi import APIRouter, File, UploadFile, HTTPException
from google.cloud import vision_v1 as vision
from google.oauth2 import service_account
import google.generativeai as genai

from app.config import get_settings

# Configuración de logging para depuración en producción
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ocr", tags=["OCR"])

@router.post("/escanear-documento")
async def escanear_documento(file: UploadFile = File(...)):
    """
    Motor OCR v6.0: Ultra-robusto con failover multimodal de Gemini Vision.
    Garantiza el éxito del escaneo incluso si falla la API de Vision.
    """
    settings = get_settings()
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="Falta GEMINI_API_KEY")
    
    genai.configure(api_key=settings.GEMINI_API_KEY)
    content = await file.read()
    raw_text = ""
    error_vision = None

    # --- PLAN A: Google Cloud Vision (OCR tradicional) ---
    try:
        # Resolvemos el path absoluto del JSON de credenciales
        base_path = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        key_path = os.path.join(base_path, "google-vision-key.json")
        
        if os.path.exists(key_path):
            credentials = service_account.Credentials.from_service_account_file(key_path)
            client = vision.ImageAnnotatorClient(credentials=credentials)
        else:
            logger.warning(f"Archivo de credenciales no encontrado en {key_path}. Intentando ADC...")
            client = vision.ImageAnnotatorClient()

        image = vision.Image(content=content)
        response = client.text_detection(image=image)
        
        if response.error.message:
            raise Exception(f"Vision API Error: {response.error.message}")

        raw_text = response.full_text_annotation.text if response.full_text_annotation else ""
        logger.info("✅ OCR Vision completado con éxito.")
    except Exception as e:
        error_vision = str(e)
        logger.error(f"❌ Falló Plan A (Vision API): {error_vision}")

    # --- PLAN B: Gemini Vision (Multimodal Directo) + Parseo ---
    try:
        # Usamos gemini-2.5-flash para compatibilidad con el entorno actual (2026)
        model = genai.GenerativeModel("models/gemini-2.5-flash")
        
        prompt = (
            "Eres un sistema experto en extracción de datos de documentos de identidad. "
            "Tu objetivo es extraer el nombre completo del huésped, número de documento y nacionalidad. "
            "Ignora ocupación, lugar de nacimiento, estado civil, sexo o firmas. "
            "Devuelve ÚNICAMENTE un objeto JSON con: 'nombre_huesped', 'documento_identidad' y 'nacionalidad' (ISO 3 letras). "
            "Si no detectas algo, devuélvelo como 'DESCONOCIDO'."
        )

        if raw_text:
            # Si tenemos texto de Vision, lo usamos como base para mayor precisión
            logger.info("Usando Vision Text + Gemini Llama")
            response_gemini = model.generate_content(
                f"{prompt}\n\nTexto extraído por OCR:\n{raw_text}",
                generation_config={"response_mime_type": "application/json"}
            )
        else:
            # FAILOVER: Si Vision falló, mandamos la imagen directamente a Gemini
            logger.info("🔥 FAILOVER: Vision falló. Usando Gemini Multimodal directo...")
            image_part = {
                "mime_type": file.content_type or "image/jpeg",
                "data": content
            }
            response_gemini = model.generate_content(
                [prompt, image_part],
                generation_config={"response_mime_type": "application/json"}
            )

        # Limpieza robusta de la respuesta (por si hay backticks de markdown)
        json_str = response_gemini.text.strip()
        if "```json" in json_str:
            json_str = json_str.split("```json")[-1].split("```")[0].strip()
        elif "```" in json_str:
            json_str = json_str.split("```")[-1].split("```")[0].strip()

        result = json.loads(json_str)
        
        return {
            "nombre_huesped": result.get("nombre_huesped", "REVISAR DOCUMENTO").upper(),
            "documento_identidad": result.get("documento_identidad", "NO DETECTADO").upper(),
            "nacionalidad": result.get("nacionalidad", "DOM").upper()
        }

    except Exception as e:
        logger.error(f"❌ Falló Plan B (Gemini): {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error crítico en sistema OCR: {str(e)}. (Vision falló con: {error_vision})"
        )
