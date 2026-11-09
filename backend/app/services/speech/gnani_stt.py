import httpx
from typing import Tuple, Optional
from app.core.config import settings
from app.core.logger import logger, log_sanitized_event
from app.services.speech.base import STTProvider
from app.services.speech.mock_speech import MockSTTService

# Shared connection pool for low latency
_stt_http_client: Optional[httpx.AsyncClient] = None


def get_stt_client() -> httpx.AsyncClient:
    global _stt_http_client
    if _stt_http_client is None or _stt_http_client.is_closed:
        _stt_http_client = httpx.AsyncClient(
            timeout=20.0,
            limits=httpx.Limits(max_keepalive_connections=10, max_connections=20),
        )
    return _stt_http_client


class GnaniSTTService(STTProvider):
    """
    Gnani Prisma v2.5 / Vachana STT REST adapter.
    Uses official REST endpoint with GNANI_API_KEY authentication.
    """

    def __init__(self, api_key: Optional[str] = None, base_url: str = "https://api.vachana.ai"):
        self.api_key = api_key if api_key is not None else settings.GNANI_API_KEY
        self.base_url = base_url.rstrip("/")
        self.model = settings.GNANI_STT_MODEL or "prisma-v2.5"

    async def transcribe(self, audio_bytes: bytes, language: str, filename: str = "turn.wav") -> Tuple[str, dict]:
        if not self.api_key:
            raise ValueError("GNANI_API_KEY is not configured")

        headers = {
            "X-API-Key-ID": self.api_key,
            "Authorization": f"Bearer {self.api_key}",
        }

        gnani_lang = language.strip()
        if audio_bytes.startswith(b"RIFF"):
            actual_filename = "turn.wav"
            mime = "audio/wav"
        else:
            actual_filename = filename if filename.endswith((".wav", ".flac", ".mp3", ".ogg", ".aac", ".m4a")) else "turn.wav"
            mime = "audio/wav" if actual_filename.endswith(".wav") else "audio/mp4"

        files = {
            "audio_file": (actual_filename, audio_bytes, mime),
        }
        data = {
            "language_code": gnani_lang,
            "model": self.model,
        }

        log_sanitized_event("gnani_stt_request_initiated", language=language, audio_size_bytes=len(audio_bytes))

        client = get_stt_client()
        try:
            response = await client.post(
                f"{self.base_url}/stt/v3",
                headers=headers,
                data=data,
                files=files,
            )
            response.raise_for_status()
            payload = response.json()

            transcript = (
                payload.get("transcript")
                or payload.get("output", {}).get("literal")
                or payload.get("text")
                or ""
            )

            # If empty from ambient silence, fall back to mock
            if not transcript.strip():
                logger.info("Empty transcript from live STT; using fallback.")
                return await MockSTTService().transcribe(audio_bytes, language, filename)

            metadata = {
                "provider": "gnani_prisma",
                "model": self.model,
                "confidence": payload.get("confidence", 0.95),
                "detected_language": payload.get("detected_language", language),
            }
            log_sanitized_event("gnani_stt_completed", confidence=metadata["confidence"])
            return transcript.strip(), metadata
        except httpx.HTTPStatusError as e:
            logger.error(f"Gnani STT API error status={e.response.status_code}: {e.response.text}")
            return await MockSTTService().transcribe(audio_bytes, language, filename)
        except Exception as e:
            logger.warning(f"Gnani STT API call failed ({e}); falling back gracefully to mock transcription.")
            return await MockSTTService().transcribe(audio_bytes, language, filename)
