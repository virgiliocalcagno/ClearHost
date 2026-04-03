import asyncio
import os
import sys
import logging

# Configurar logging para ver los intentos de fallback
logging.basicConfig(level=logging.INFO)

# Añadir el path de la app para poder importar
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.ocr_service import extract_guest_data_from_image

async def test_ocr():
    print("\n🔍 Iniciando diagnóstico de OCR Resiliente v9.0...")
    
    # Imagen de prueba (1x1 transparente)
    fake_image = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n2\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    
    try:
        result = await extract_guest_data_from_image(fake_image)
        print("\n📊 RESULTADO FINAL:")
        print(f"Nombre: {result.get('nombre_huesped')}")
        print(f"ID: {result.get('doc_identidad')}")
        print(f"Nacionalidad: {result.get('nacionalidad')}")
        
        if result.get("nombre_huesped") == "REINTENTAR ESCANEO":
            print("\n❌ EL FALLO PERSISTE: Ningún modelo de Gemini respondió adecuadamente.")
            print("Posibles causas: API Key inválida, geobloqueo o cuota excedida.")
        else:
            print("\n🎉 ÉXITO: El sistema de fallback encontró un modelo funcional.")
            
    except Exception as e:
        print(f"\n❌ Error catastrófico en la prueba: {e}")

if __name__ == "__main__":
    asyncio.run(test_ocr())
