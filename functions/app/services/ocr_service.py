import os
import json
import logging
import traceback
import google.generativeai as genai
from google.cloud import vision_v1 as vision
from google.oauth2 import service_account
from PIL import Image
import io

from app.config import get_settings

logger = logging.getLogger(__name__)

async def extract_guest_data_from_image(image_bytes: bytes) -> dict:
    """
    Motor OCR Unificado v9.0 (Senior Resilience).
    Estrategia: Multi-Stage + Multi-Model Fallback.
    Resuelve: 404 models/gemini-1-5-flash not found.
    """
    try:
        settings = get_settings()
        api_key = settings.GEMINI_API_KEY
        
        if not api_key:
            logger.error("❌ ERROR: GEMINI_API_KEY no configurada.")
            return {"error": "Falta API Key"}

        genai.configure(api_key=api_key)
        
        # --- DIAGNÓSTICO: Listar modelos disponibles ---
        try:
            available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
            logger.info(f"📋 Modelos disponibles para esta API Key: {available_models}")
        except Exception as le:
            logger.warning(f"⚠️ No se pudo listar modelos: {le}")
            
        raw_text = ""
        
        # --- ETAPA 1: Google Cloud Vision ---
        try:
            base_path = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            key_path = os.path.join(base_path, "google-vision-key.json")
            
            if os.path.exists(key_path):
                credentials = service_account.Credentials.from_service_account_file(key_path)
                client = vision.ImageAnnotatorClient(credentials=credentials)
                image = vision.Image(content=image_bytes)
                response_vision = client.text_detection(image=image)
                if response_vision.full_text_annotation:
                    raw_text = response_vision.full_text_annotation.text
                    logger.info("✅ Texto base extraído con Vision API.")
        except Exception as ve:
            logger.warning(f"⚠️ Vision API falló: {ve}")

        # --- ETAPA 2: Gemini con Fallback de Modelos ---
        # Lista de candidatos en orden de preferencia (intentaremos versiones cortas y largas)
        models_to_try = [
            'gemini-2.0-flash-exp',       # Prioridad 1 (Confirmado por el usuario)
            'gemini-1.5-flash',
            'models/gemini-1.5-flash',
            'gemini-1.5-flash-8b',        # Ultra rápido cualitativamente similar
            'gemini-1.5-pro',
            'gemini-1.5-flash-latest',
            'gemini-pro',
            'gemini-pro-vision'           # Legado
        ]

        # Si logramos listar modelos, dar prioridad a lo que el API dice que tiene
        try:
            if 'available_models' in locals() and available_models:
                # Filtrar modelos de interés (sacar el prefijo 'models/')
                targets = ['flash', 'pro', '2.0']
                discovered = [m for m in available_models if any(t in m for t in targets)]
                if discovered:
                    # Mezclar: Discovered primero, luego los hardcoded
                    models_to_try = discovered + [m for m in models_to_try if m not in discovered]
                    logger.info(f"✨ Estrategia dinámica (discovered first): {models_to_try}")
        except:
            pass

        prompt = (
            "Eres un experto en lectura de documentos. "
            "Extrae los datos en JSON puro:\n"
            "nombre_huesped: NOMBRE COMPLETO\n"
            "doc_identidad: NUMERO\n"
            "nacionalidad: ISO 3 LETRAS\n"
            "telefono_huesped: NUMERO O NULL\n"
            "REGLA: ÚNICAMENTE JSON."
        )

        safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ]

        response = None
        success_model = None

        for model_name in models_to_try:
            try:
                logger.info(f"🔄 Intentando con modelo: {model_name}...")
                model = genai.GenerativeModel(model_name)
                
                # Intentar primero con JSON mode si el modelo lo permite
                try:
                    if raw_text:
                        response = model.generate_content(
                            f"{prompt}\n\nTexto detectado:\n{raw_text}",
                            generation_config={"response_mime_type": "application/json"},
                            safety_settings=safety_settings
                        )
                    else:
                        image_part = {"mime_type": "image/jpeg", "data": image_bytes}
                        response = model.generate_content(
                            [prompt, image_part],
                            generation_config={"response_mime_type": "application/json"},
                            safety_settings=safety_settings
                        )
                except Exception as json_err:
                    logger.warning(f"⚠️ Mode JSON falló para {model_name}, reintentando modo normal: {json_err}")
                    # Reintento sin JSON mode (para modelos más viejos)
                    if raw_text:
                        response = model.generate_content(
                            f"{prompt}\n\nTexto detectado:\n{raw_text}",
                            safety_settings=safety_settings
                        )
                    else:
                        image_part = {"mime_type": "image/jpeg", "data": image_bytes}
                        response = model.generate_content(
                            [prompt, image_part],
                            safety_settings=safety_settings
                        )
                
                if response and response.candidates:
                    success_model = model_name
                    break
            except Exception as e:
                logger.warning(f"❌ Falló modelo {model_name}: {e}")
                continue

        if not response or not response.candidates:
            raise Exception("Ningún modelo de Gemini pudo procesar la solicitud.")

        # Limpiar y cargar JSON
        res_text = response.text.strip()
        if "```json" in res_text:
            res_text = res_text.split("```json")[-1].split("```")[0].strip()
        data = json.loads(res_text)
        
        # Normalización
        final_data = {
            "nombre_huesped": str(data.get("nombre_huesped") or "REVISAR").upper(),
            "doc_identidad": str(data.get("doc_identidad") or "").upper().replace(" ", ""),
            "documento_identidad": str(data.get("doc_identidad") or "").upper().replace(" ", ""),
            "nacionalidad": str(data.get("nacionalidad") or "DOM").upper(),
            "telefono_huesped": data.get("telefono_huesped")
        }

        logger.info(f"✅ OCR Exitoso con {success_model}: {final_data['nombre_huesped']}")
        return final_data

    except Exception as e:
        logger.error(f"❌ ERROR CRÍTICO OCR: {str(e)}")
        return {
            "nombre_huesped": "REINTENTAR ESCANEO",
            "doc_identidad": "REVISAR",
            "documento_identidad": "REVISAR",
            "nacionalidad": "ERROR",
            "telefono_huesped": None
        }
