from typing import Optional, Dict, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.translation.sarvam_service import SarvamTranslationService

router = APIRouter(prefix="/translate", tags=["Translation"])


class TranslateRequest(BaseModel):
    text: str
    target_language: str
    source_language: Optional[str] = "en-IN"
    mode: Optional[str] = "formal"


class TranslateResponse(BaseModel):
    translated_text: str
    source_language: str
    target_language: str
    provider: str


class TranslateDictRequest(BaseModel):
    dictionary: Dict[str, str]
    target_language: str
    source_language: Optional[str] = "en-IN"


@router.post("", response_model=TranslateResponse)
async def translate_text(payload: TranslateRequest):
    """
    Translates text to the specified target language using Sarvam AI Translation API
    with automatic fallback to OpenAI GPT-6 Luna.
    """
    service = SarvamTranslationService()
    try:
        res = await service.translate(
            text=payload.text,
            target_lang=payload.target_language,
            source_lang=payload.source_language or "en-IN",
            mode=payload.mode or "formal",
        )
        return TranslateResponse(
            translated_text=res,
            source_language=payload.source_language or "en-IN",
            target_language=payload.target_language,
            provider="sarvam" if service.api_key else "gpt-6-luna",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")


@router.post("/dictionary")
async def translate_dictionary(payload: TranslateDictRequest):
    """
    Translates a key-value dictionary of UI strings into the doctor's chosen language.
    """
    service = SarvamTranslationService()
    try:
        translated = await service.translate_ui_dictionary(
            ui_dict=payload.dictionary,
            target_lang=payload.target_language,
        )
        return {"translations": translated, "target_language": payload.target_language}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dictionary translation failed: {str(e)}")

