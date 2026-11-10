import asyncio
import io
import wave
import struct
import httpx
from typing import Optional
from app.core.config import settings
from app.core.logger import logger, log_sanitized_event
from app.services.speech.base import TTSProvider
from app.services.speech.mock_speech import MockTTSService

def sanitize_wav_header(wav_bytes: bytes) -> bytes:
    """Fixes streaming 0xFFFFFFFF placeholder sizes in RIFF WAV header for Android MediaPlayer compatibility."""
    if len(wav_bytes) >= 44 and wav_bytes.startswith(b"RIFF"):
        b = bytearray(wav_bytes)
        struct.pack_into("<I", b, 4, len(wav_bytes) - 8)
        data_pos = b.find(b"data")
        if data_pos != -1 and len(b) >= data_pos + 8:
            struct.pack_into("<I", b, data_pos + 4, len(wav_bytes) - (data_pos + 8))
        return bytes(b)
    return wav_bytes

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
        "gu": "Nirav",
        "bn": "Tanmay",
        "ta": "Saravanan",
        "te": "Chaitanya",
        "kn": "Gopal",
        "ml": "Manoj",
        "pa": "Amrit",
        "or": "Subhas",
    }

    SUPPORTED_FEMALE_VOICES = {
        "hi": "Nalini",
        "mr": "Kaveri",
        "en": "Devika",
        "gu": "Dhwani",
        "bn": "Mithu",
        "ta": "Kavitha",
        "te": "Sandhya",
        "kn": "Shweta",
        "ml": "Arya",
        "pa": "Kaur",
        "or": "Ananya",
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

        is_female = bool(gender and gender.strip().lower() == "female")
        voices_map = self.SUPPORTED_FEMALE_VOICES if is_female else self.SUPPORTED_MALE_VOICES
        fallback_voice = "Devika" if is_female else "Deven"

        for code in ["mr", "hi", "gu", "bn", "ta", "te", "kn", "ml", "pa", "or", "en"]:
            if code in lang:
                return voices_map.get(code, fallback_voice)

        return fallback_voice

    async def synthesize_openai(self, text: str, voice: str = "nova") -> bytes:
        """High-clarity universal speech synthesis using OpenAI TTS-1."""
        client = get_tts_client()
        clean_voice = voice.lower()
        if "fem" in clean_voice or "nova" in clean_voice or "nalini" in clean_voice or "kaveri" in clean_voice or "devika" in clean_voice:
            target_voice = "nova"
        elif "shimmer" in clean_voice:
            target_voice = "shimmer"
        elif "onyx" in clean_voice or "deep" in clean_voice:
            target_voice = "onyx"
        elif "echo" in clean_voice or "male" in clean_voice:
            target_voice = "echo"
        elif "alloy" in clean_voice:
            target_voice = "alloy"
        else:
            target_voice = "nova" if "female" in clean_voice else "echo"

        res = await client.post(
            "https://api.openai.com/v1/audio/speech",
            headers={
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "tts-1",
                "input": text,
                "voice": target_voice,
                "response_format": "wav",
            },
            timeout=20.0,
        )
        res.raise_for_status()
        return sanitize_wav_header(res.content)

    async def synthesize(
        self,
        text: str,
        language: str,
        voice: Optional[str] = None,
        gender: str = "male",
    ) -> bytes:
        v_lower = (voice or "").lower()
        openai_voices = ["nova", "shimmer", "echo", "onyx", "alloy", "fable"]
        if any(ov in v_lower for ov in openai_voices) and settings.OPENAI_API_KEY:
            try:
                target_v = voice or ("nova" if gender == "female" else "echo")
                return await self.synthesize_openai(text, voice=target_v)
            except Exception as e:
                logger.error(f"OpenAI TTS direct synthesis failed: {e}")

        # Attempt Gnani TTS if configured and language supported
        lang_short = language.split("-")[0].lower()
        if self.api_key and lang_short in ["hi", "mr", "en", "gu", "bn", "ta", "te", "kn", "ml", "pa", "or"]:
            try:
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
                response = await client.post(
                    f"{self.base_url}/api/v1/tts/inference",
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
                wav_audio = response.content
                if not wav_audio.startswith(b"RIFF"):
                    wav_audio = pcm_to_wav(wav_audio)
                else:
                    wav_audio = sanitize_wav_header(wav_audio)
                log_sanitized_event("gnani_tts_completed", audio_size_bytes=len(wav_audio))
                return wav_audio
            except Exception as e:
                logger.warning(f"Gnani TTS failed ({e}), falling back to OpenAI TTS...")

        # Robust OpenAI TTS Fallback
        if settings.OPENAI_API_KEY:
            fallback_voice = "nova" if (gender == "female" or "fem" in v_lower) else "echo"
            return await self.synthesize_openai(text, voice=fallback_voice)

        raise RuntimeError("No TTS provider available to synthesize speech")
