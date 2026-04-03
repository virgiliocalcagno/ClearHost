import logging
from fastapi import APIRouter, File, UploadFile, HTTPException
from app.services.ocr_service import extract_guest_data_from_image

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ocr", tags=["OCR"])

@router.post("/escanear-documento")
async def escanear_documento(file: UploadFile = File(...)):
    """
    Endpoint Unificado de OCR.
    Utiliza el motor multi-etapa de ocr_service.
    """
    try:
        content = await file.read()
        result = await extract_guest_data_from_image(content)
        return result
    except Exception as e:
        logger.error(f"Error en router OCR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

