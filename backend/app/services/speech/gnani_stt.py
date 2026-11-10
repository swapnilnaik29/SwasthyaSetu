import asyncio
import httpx
from typing import Tuple, Optional
from app.core.config import settings
from app.core.logger import logger, log_sanitized_event
from app.services.speech.base import STTProvider
from app.services.speech.mock_speech import MockSTTService

# Shared connection pool for low latency (event-loop aware)
_stt_http_client: Optional[httpx.AsyncClient] = None
_stt_client_loop: Optional[asyncio.AbstractEventLoop] = None


def get_stt_client() -> httpx.AsyncClient:
    global _stt_http_client, _stt_client_loop
    try:
        current_loop = asyncio.get_running_loop()
    except RuntimeError:
        current_loop = None

    if _stt_http_client is None or _stt_http_client.is_closed or _stt_client_loop != current_loop:
        _stt_http_client = httpx.AsyncClient(
            timeout=20.0,
            limits=httpx.Limits(max_keepalive_connections=10, max_connections=20),
        )
        _stt_client_loop = current_loop
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

    async def _fallback_whisper(self, audio_bytes: bytes, language: str, filename: str) -> Tuple[str, dict]:
        """High-accuracy fallback to OpenAI Whisper-1 when Gnani STT returns empty or encounters network/format issues."""
        if not settings.OPENAI_API_KEY:
            return "", {"provider": "none", "confidence": 0.0, "detected_language": language}
        try:
            import io
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

            # Map language code to ISO-639-1
            whisper_lang = language.split("-")[0].lower() if "-" in language else language.lower()
            if whisper_lang not in ["hi", "mr", "en", "gu", "ta", "te", "kn", "bn", "pa"]:
                whisper_lang = None

            fname = filename if filename.endswith((".wav", ".m4a", ".aac", ".mp3", ".ogg")) else "turn.wav"
            audio_file = io.BytesIO(audio_bytes)
            audio_file.name = fname

            kwargs = {
                "model": "whisper-1",
                "file": audio_file,
            }
            if whisper_lang:
                kwargs["language"] = whisper_lang

            res = await client.audio.transcriptions.create(**kwargs)
            text = (res.text or "").strip()
            # Filter out hallucinations on pure silence like "you" or "thank you for watching"
            silence_artifacts = ["you", "thank you", "subtitles by", "amara.org", "subscribe"]
            if text.lower() in silence_artifacts:
                text = ""

            if text:
                logger.info(f"OpenAI Whisper fallback STT succeeded ({len(text)} chars): '{text}'")
                return text, {
                    "provider": "openai_whisper",
                    "model": "whisper-1",
                    "confidence": 0.98,
                    "detected_language": language,
                }
        except Exception as e:
            logger.warning(f"Whisper STT fallback error: {e}")
        return "", {"provider": "fallback_failed", "confidence": 0.0, "detected_language": language}

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

            # If empty from ambient silence or non-speech audio, try Whisper fallback
            if not transcript.strip():
                w_text, w_meta = await self._fallback_whisper(audio_bytes, language, filename)
                if w_text.strip():
                    return w_text, w_meta
                logger.info("Empty transcript from live STT (silence or unintelligible audio).")
                return "", {
                    "provider": "gnani_prisma",
                    "model": self.model,
                    "confidence": 0.0,
                    "detected_language": language,
                }

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
            w_text, w_meta = await self._fallback_whisper(audio_bytes, language, filename)
            if w_text.strip():
                return w_text, w_meta
            if e.response.status_code >= 500:
                return "", {
                    "provider": "gnani_prisma",
                    "model": self.model,
                    "confidence": 0.0,
                    "detected_language": language,
                    "upstream_error": e.response.status_code,
                }
            raise RuntimeError(f"Gnani STT API error ({e.response.status_code}): {e.response.text}")
        except Exception as e:
            logger.error(f"Gnani STT API call failed: {e}. Attempting Whisper fallback.")
            w_text, w_meta = await self._fallback_whisper(audio_bytes, language, filename)
            if w_text.strip():
                return w_text, w_meta
            raise
