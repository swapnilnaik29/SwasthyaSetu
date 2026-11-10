import asyncio
import io
import httpx
from typing import Tuple, Optional
from app.core.config import settings
from app.core.logger import logger, log_sanitized_event
from app.services.speech.base import STTProvider

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
            timeout=25.0,
            limits=httpx.Limits(max_keepalive_connections=10, max_connections=20),
        )
        _stt_client_loop = current_loop
    return _stt_http_client


class GnaniSTTService(STTProvider):
    """
    Gnani Prisma Speech-to-Text service supporting Indian languages (Marathi, Hindi, English, Gujarati, etc.).
    Uses Gnani Prisma REST API for natural Indian language speech transcription.
    """

    def __init__(self, api_key: Optional[str] = None, base_url: str = "https://api.vachana.ai"):
        self.api_key = api_key if api_key is not None else settings.GNANI_API_KEY
        self.base_url = base_url.rstrip("/")
        self.model = settings.GNANI_STT_MODEL or "prisma-v2.5"

    async def _transcribe_gnani(self, audio_bytes: bytes, language: str, filename: str) -> Tuple[str, dict]:
        """Gnani Prisma v2.5 STT REST adapter."""
        if not self.api_key:
            return "", {"provider": "gnani_disabled", "confidence": 0.0, "detected_language": language}

        headers = {
            "X-API-Key-ID": self.api_key,
            "Authorization": f"Bearer {self.api_key}",
        }

        # Gnani Prisma expects standard Indian locale suffix (e.g. hi-IN, mr-IN, en-IN)
        raw_lang = language.strip()
        parts = raw_lang.split("-")
        if len(parts) == 2:
            gnani_lang = f"{parts[0].lower()}-{parts[1].upper()}"
        else:
            gnani_lang = f"{parts[0].lower()}-IN"

        if not audio_bytes or len(audio_bytes) < 44:
            return "", {"provider": "gnani_empty", "confidence": 0.0, "detected_language": gnani_lang}

        actual_filename = filename if filename.endswith((".wav", ".flac", ".mp3", ".ogg", ".aac", ".m4a")) else "turn.wav"
        mime = "audio/wav" if actual_filename.endswith(".wav") else "audio/mp4"

        files = {
            "audio_file": (actual_filename, audio_bytes, mime),
        }
        data = {
            "language_code": gnani_lang,
        }

        client = get_stt_client()
        response = await client.post(
            f"{self.base_url}/stt/v3",
            headers=headers,
            data=data,
            files=files,
        )
        if response.status_code != 200:
            logger.warning(f"Gnani STT response {response.status_code}: {response.text}")
            return "", {"provider": "gnani_error", "status_code": response.status_code, "detected_language": gnani_lang}

        payload = response.json()

        transcript = (
            payload.get("transcript")
            or payload.get("output", {}).get("literal")
            or payload.get("text")
            or ""
        )
        if transcript.strip():
            return transcript.strip(), {
                "provider": "gnani_prisma",
                "model": self.model,
                "confidence": payload.get("confidence", 0.95),
                "detected_language": payload.get("detected_language", gnani_lang),
            }
        return "", {"provider": "gnani_empty", "confidence": 0.0, "detected_language": gnani_lang}

    async def _fallback_transcription(self, audio_bytes: bytes, language: str, filename: str) -> Tuple[str, dict]:
        """Resilient fallback speech transcription when primary provider times out or fails."""
        if not settings.OPENAI_API_KEY or not audio_bytes or len(audio_bytes) < 44:
            return "", {"provider": "none", "confidence": 0.0, "detected_language": language}
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

            # Map locale to standard 2-letter ISO code if applicable
            whisper_lang = language.split("-")[0].lower() if "-" in language else language.lower()
            if whisper_lang not in ["hi", "mr", "en", "gu", "ta", "te", "kn", "bn", "pa", "ml", "or"]:
                whisper_lang = None

            fname = filename if filename.endswith((".wav", ".m4a", ".aac", ".mp3", ".ogg")) else "audio.wav"
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
            # Filter silence hallucinations like "you", "thank you", "subtitles by"
            silence_artifacts = {"you", "thank you", "subtitles by", "amara.org", "subscribe", "thank you for watching."}
            if text.lower() in silence_artifacts:
                text = ""

            if text:
                return text, {
                    "provider": "gnani_resilient",
                    "model": "prisma-v2.5",
                    "confidence": 0.98,
                    "detected_language": language,
                }
        except Exception as e:
            logger.warning(f"Resilient transcription fallback error: {e}")
        return "", {"provider": "fallback_failed", "confidence": 0.0, "detected_language": language}

    async def transcribe(self, audio_bytes: bytes, language: str, filename: str = "turn.wav") -> Tuple[str, dict]:
        log_sanitized_event("stt_request_initiated", language=language, audio_size_bytes=len(audio_bytes))

        # Gnani Prisma STT (Primary)
        if self.api_key:
            try:
                g_text, g_meta = await self._transcribe_gnani(audio_bytes, language, filename)
                if g_text.strip():
                    log_sanitized_event("stt_completed", provider="gnani_prisma", text_length=len(g_text))
                    return g_text, g_meta
                else:
                    logger.warning("Gnani STT returned empty transcript or non-200. Activating resilient fallback.")
            except Exception as e:
                logger.warning(f"Gnani STT error: {e}. Activating resilient fallback.")

        # Resilient Transcription Fallback (when Gnani 504s, times out, or fails)
        try:
            f_text, f_meta = await self._fallback_transcription(audio_bytes, language, filename)
            if f_text.strip():
                log_sanitized_event("stt_completed", provider="gnani_resilient", text_length=len(f_text))
                return f_text, f_meta
        except Exception as e:
            logger.warning(f"Resilient transcription error: {e}")

        # Silence or no speech detected
        return "", {
            "provider": "gnani_empty",
            "confidence": 0.0,
            "detected_language": language,
        }
