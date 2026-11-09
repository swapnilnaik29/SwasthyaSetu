import httpx
from typing import Optional
from app.core.config import settings
from app.core.logger import logger, log_sanitized_event
from app.services.speech.base import TTSProvider

# Shared connection pool for ultra-low latency keep-alive requests
_tts_http_client: Optional[httpx.AsyncClient] = None


def get_tts_client() -> httpx.AsyncClient:
    global _tts_http_client
    if _tts_http_client is None or _tts_http_client.is_closed:
        _tts_http_client = httpx.AsyncClient(
            timeout=15.0,
            limits=httpx.Limits(max_keepalive_connections=10, max_connections=20),
        )
    return _tts_http_client


class GnaniTTSService(TTSProvider):
    """
    Gnani Timbre v2.5 Text-to-Speech REST adapter.
    Uses official REST endpoint with GNANI_API_KEY authentication.
    Both doctor and patient default voice -> MALE.
    """

    def __init__(self, api_key: str = None, base_url: str = "https://api.gnani.ai/v1/tts"):
        self.api_key = api_key or settings.GNANI_API_KEY
        self.base_url = base_url
        self.model = settings.GNANI_TTS_MODEL

    def _get_voice_for_language(self, language: str) -> str:
        lang = language.strip().lower()
        if "hi" in lang:
            return settings.GNANI_DEFAULT_VOICE_HI or "hi_male_1"
        elif "mr" in lang:
            return settings.GNANI_DEFAULT_VOICE_MR or "mr_male_1"
        else:
            return settings.GNANI_DEFAULT_VOICE_EN or "en_male_1"

    async def synthesize(self, text: str, language: str, voice: Optional[str] = None) -> bytes:
        if not self.api_key:
            raise ValueError("GNANI_API_KEY is not configured")

        selected_voice = voice or self._get_voice_for_language(language)
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "text": text,
            "language": language,
            "voice": selected_voice,
            "model": self.model,
            "audio_format": "wav",
        }

        log_sanitized_event("gnani_tts_request_initiated", language=language, voice=selected_voice)

        client = get_tts_client()
        try:
            response = await client.post(
                f"{self.base_url}/synthesize",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            audio_bytes = response.content
            log_sanitized_event("gnani_tts_completed", audio_size_bytes=len(audio_bytes))
            return audio_bytes
        except httpx.HTTPStatusError as e:
            logger.error(f"Gnani TTS API error status={e.response.status_code}")
            raise RuntimeError(f"Gnani TTS service error: {e.response.status_code}")
        except Exception as e:
            logger.error(f"Gnani TTS request failed: {str(e)}")
            raise RuntimeError(f"Gnani TTS network or connection error: {str(e)}")
