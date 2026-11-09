import httpx
from typing import Tuple
from app.core.config import settings
from app.core.logger import logger, log_sanitized_event
from app.services.speech.base import STTProvider


class GnaniSTTService(STTProvider):
    """
    Gnani Prisma v2.5 Speech-to-Text REST adapter.
    Uses official REST endpoint with GNANI_API_KEY authentication.
    """

    def __init__(self, api_key: str = None, base_url: str = "https://api.gnani.ai/v1/stt"):
        self.api_key = api_key or settings.GNANI_API_KEY
        self.base_url = base_url
        self.model = settings.GNANI_STT_MODEL

    async def transcribe(self, audio_bytes: bytes, language: str, filename: str = "turn.wav") -> Tuple[str, dict]:
        if not self.api_key:
            raise ValueError("GNANI_API_KEY is not configured")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "x-model": self.model,
        }

        # Gnani language format mapping: hi-IN, mr-IN, en-IN
        gnani_lang = language.strip()
        files = {
            "audio": (filename, audio_bytes, "audio/wav"),
        }
        data = {
            "language": gnani_lang,
            "model": self.model,
            "encoding": "wav",
        }

        log_sanitized_event("gnani_stt_request_initiated", language=language, audio_size_bytes=len(audio_bytes))

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/transcribe",
                    headers=headers,
                    data=data,
                    files=files,
                )
                response.raise_for_status()
                payload = response.json()
                
                # Extract transcript based on Gnani response format
                transcript = payload.get("transcript") or payload.get("text") or ""
                metadata = {
                    "provider": "gnani_prisma",
                    "model": self.model,
                    "confidence": payload.get("confidence", 0.95),
                    "detected_language": payload.get("detected_language", language),
                }
                log_sanitized_event("gnani_stt_completed", confidence=metadata["confidence"])
                return transcript.strip(), metadata
            except httpx.HTTPStatusError as e:
                logger.error(f"Gnani STT API error status={e.response.status_code}")
                raise RuntimeError(f"Gnani STT service error: {e.response.status_code}")
            except Exception as e:
                logger.error(f"Gnani STT request failed: {str(e)}")
                raise RuntimeError(f"Gnani STT network or connection error: {str(e)}")
