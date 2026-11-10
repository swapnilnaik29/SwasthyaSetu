import asyncio
import httpx
from typing import Optional, Dict, List
from openai import AsyncOpenAI
from app.core.config import settings
from app.core.logger import logger

# Map app language codes to Sarvam language codes
_SARVAM_LANG_MAP = {
    "en-IN": "en-IN",
    "en": "en-IN",
    "hi-IN": "hi-IN",
    "hi": "hi-IN",
    "mr-IN": "mr-IN",
    "mr": "mr-IN",
    "gu-IN": "gu-IN",
    "gu": "gu-IN",
    "ta-IN": "ta-IN",
    "ta": "ta-IN",
    "te-IN": "te-IN",
    "te": "te-IN",
    "kn-IN": "kn-IN",
    "kn": "kn-IN",
    "bn-IN": "bn-IN",
    "bn": "bn-IN",
}

_sarvam_client: Optional[httpx.AsyncClient] = None
_sarvam_loop: Optional[asyncio.AbstractEventLoop] = None


def get_sarvam_http_client() -> httpx.AsyncClient:
    global _sarvam_client, _sarvam_loop
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if _sarvam_client is None or _sarvam_client.is_closed or _sarvam_loop != loop:
        _sarvam_client = httpx.AsyncClient(timeout=15.0)
        _sarvam_loop = loop
    return _sarvam_client


class SarvamTranslationService:
    """
    Translates UI strings, clinical notes, and patient fields using Sarvam AI Translation API
    (POST https://api.sarvam.ai/translate) with robust fallback to OpenAI GPT-6 Luna.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key if api_key is not None else settings.SARVAM_API_KEY
        self.endpoint = settings.SARVAM_TRANSLATE_URL or "https://api.sarvam.ai/translate"
        self._openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None

    async def translate(
        self,
        text: str,
        target_lang: str,
        source_lang: str = "en-IN",
        mode: str = "formal",
    ) -> str:
        clean_text = text.strip()
        if not clean_text:
            return ""

        sarvam_src = _SARVAM_LANG_MAP.get(source_lang, "en-IN")
        sarvam_tgt = _SARVAM_LANG_MAP.get(target_lang, "hi-IN")

        # If source and target are the same, return as-is
        if sarvam_src == sarvam_tgt:
            return clean_text

        # 1. Attempt Sarvam Translation API if API key is configured
        if self.api_key:
            try:
                client = get_sarvam_http_client()
                headers = {
                    "Content-Type": "application/json",
                    "api-subscription-key": self.api_key,
                }
                payload = {
                    "input": clean_text[:2000],
                    "source_language_code": sarvam_src,
                    "target_language_code": sarvam_tgt,
                    "mode": mode,
                }
                response = await client.post(self.endpoint, headers=headers, json=payload)
                if response.status_code == 200:
                    res_json = response.json()
                    translated = res_json.get("translated_text", "")
                    if translated.strip():
                        return translated.strip()
                logger.warning(
                    f"Sarvam translation API returned status {response.status_code}: {response.text}. Falling back to Luna."
                )
            except Exception as e:
                logger.warning(f"Sarvam translation exception: {e}. Falling back to Luna.")

        # 2. Seamless fallback to OpenAI GPT-6 Luna
        if self._openai_client:
            try:
                lang_names = {
                    "hi-IN": "Hindi (हिंदी)",
                    "mr-IN": "Marathi (मराठी)",
                    "en-IN": "Indian English",
                    "gu-IN": "Gujarati (ગુજરાતી)",
                }
                target_name = lang_names.get(sarvam_tgt, sarvam_tgt)
                source_name = lang_names.get(sarvam_src, sarvam_src)

                sys_prompt = (
                    "You are a medical translator for an Indian clinical healthcare portal. "
                    f"Translate the following text accurately from {source_name} to {target_name}. "
                    "Preserve all clinical entities, dosages, numbers, names, and professional healthcare context. "
                    "Output ONLY the translated text without extra conversational filler or quotes."
                )
                res = await self._openai_client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": sys_prompt},
                        {"role": "user", "content": clean_text},
                    ],
                )
                ans = res.choices[0].message.content or ""
                return ans.strip().strip('"').strip("'")
            except Exception as e:
                logger.error(f"OpenAI fallback translation failed: {e}")

        return clean_text

    async def translate_batch(
        self,
        texts: List[str],
        target_lang: str,
        source_lang: str = "en-IN",
    ) -> List[str]:
        tasks = [self.translate(t, target_lang=target_lang, source_lang=source_lang) for t in texts]
        return await asyncio.gather(*tasks)

    async def translate_ui_dictionary(
        self,
        ui_dict: Dict[str, str],
        target_lang: str,
    ) -> Dict[str, str]:
        keys = list(ui_dict.keys())
        values = [ui_dict[k] for k in keys]
        translated_values = await self.translate_batch(values, target_lang=target_lang, source_lang="en-IN")
        return {k: v for k, v in zip(keys, translated_values)}
