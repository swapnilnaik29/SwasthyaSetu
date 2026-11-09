import asyncio
import io
import wave
import httpx
from typing import Optional
from app.core.config import settings
from app.core.logger import logger, log_sanitized_event
from app.services.speech.base import TTSProvider
from app.services.speech.mock_speech import MockTTSService

# Shared connection pool for ultra-low latency keep-alive requests (event-loop aware)
_tts_http_client: Optional[httpx.AsyncClient] = None
_tts_client_loop: Optional[asyncio.AbstractEventLoop] = None


def get_tts_client() -> httpx.AsyncClient:
    global _tts_http_client, _tts_client_loop
    try:
        current_loop = asyncio.get_running_loop()
    except RuntimeError:
        current_loop = None

    if _tts_http_client is None or _tts_http_client.is_closed or _tts_client_loop != current_loop:
        _tts_http_client = httpx.AsyncClient(
            timeout=15.0,
            limits=httpx.Limits(max_keepalive_connections=10, max_connections=20),
        )
        _tts_client_loop = current_loop
    return _tts_http_client


def pcm_to_wav(pcm_bytes: bytes, sample_rate: int = 16000, channels: int = 1, sampwidth: int = 2) -> bytes:
    """Wraps raw 16-bit mono PCM bytes in a standard RIFF/WAVE header for browser playback."""
    if pcm_bytes.startswith(b"RIFF"):
        return pcm_bytes
    wav_io = io.BytesIO()
    with wave.open(wav_io, "wb") as wav_file:
        wav_file.setnchannels(channels)
        wav_file.setsampwidth(sampwidth)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(pcm_bytes)
    return wav_io.getvalue()


class GnaniTTSService(TTSProvider):
    """
    Gnani Timbre v2.5 / Vachana Text-to-Speech REST adapter.
    Uses official REST endpoint with GNANI_API_KEY authentication.
    Both doctor and patient default voice -> MALE (Deepak, Omkar, Deven).
    """

    SUPPORTED_MALE_VOICES = {
        "hi": "Deepak",
        "mr": "Omkar",
        "en": "Deven",
    }

    SUPPORTED_FEMALE_VOICES = {
        "hi": "Nalini",
        "mr": "Kaveri",
        "en": "Devika",
    }

    def __init__(self, api_key: Optional[str] = None, base_url: str = "https://api.vachana.ai"):
        self.api_key = api_key if api_key is not None else settings.GNANI_API_KEY
        self.base_url = base_url.rstrip("/")
        self.model = settings.GNANI_TTS_MODEL or "timbre-v2.5"

    def _get_voice_for_language(
        self,
        language: str,
        requested_voice: Optional[str] = None,
        gender: str = "male",
    ) -> str:
        lang = language.strip().lower()
        if requested_voice and requested_voice not in ["hi_male_1", "mr_male_1", "en_male_1", ""]:
            return requested_voice
        
        # Female voice selection (for conversational intake form assistant)
        if gender and gender.strip().lower() == "female":
            if "hi" in lang:
                return self.SUPPORTED_FEMALE_VOICES["hi"]
            elif "mr" in lang:
                return self.SUPPORTED_FEMALE_VOICES["mr"]
            else:
                return self.SUPPORTED_FEMALE_VOICES["en"]

        # Default male voice selection (for doctor and patient consultation turns)
        if "hi" in lang:
            return self.SUPPORTED_MALE_VOICES["hi"]
        elif "mr" in lang:
            return self.SUPPORTED_MALE_VOICES["mr"]
        else:
            return self.SUPPORTED_MALE_VOICES["en"]

    async def synthesize(
        self,
        text: str,
        language: str,
        voice: Optional[str] = None,
        gender: str = "male",
    ) -> bytes:
        if not self.api_key:
            raise ValueError("GNANI_API_KEY is not configured")

        selected_voice = self._get_voice_for_language(language, voice, gender=gender)
        headers = {
            "X-API-Key-ID": self.api_key,
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "text": text,
            "language": language,
            "voice": selected_voice,
            "model": self.model,
            "speed": 1.0,
            "audio_config": {
                "sample_rate": 16000,
                "num_channels": 1,
                "encoding": "linear_pcm",
                "container": "wav",
            },
        }

        log_sanitized_event("gnani_tts_request_initiated", language=language, voice=selected_voice)

        client = get_tts_client()
        try:
            response = await client.post(
                f"{self.base_url}/api/v1/tts/inference",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            wav_audio = response.content
            if not wav_audio.startswith(b"RIFF"):
                wav_audio = pcm_to_wav(wav_audio)
            log_sanitized_event("gnani_tts_completed", audio_size_bytes=len(wav_audio))
            return wav_audio
        except httpx.HTTPStatusError as e:
            logger.error(f"Gnani TTS API error status={e.response.status_code}: {e.response.text}")
            raise RuntimeError(f"Gnani TTS API error ({e.response.status_code}): {e.response.text}")
        except Exception as e:
            logger.error(f"Gnani TTS API call failed: {e}")
            raise
