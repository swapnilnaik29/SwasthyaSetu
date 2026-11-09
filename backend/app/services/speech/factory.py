from app.core.config import settings
from app.services.speech.base import STTProvider, TTSProvider
from app.services.speech.gnani_stt import GnaniSTTService
from app.services.speech.gnani_tts import GnaniTTSService
from app.services.speech.mock_speech import MockSTTService, MockTTSService


def get_stt_service() -> STTProvider:
    if settings.GNANI_API_KEY and settings.GNANI_STT_MODE.lower() != "mock":
        return GnaniSTTService()
    return MockSTTService()


def get_tts_service() -> TTSProvider:
    if settings.GNANI_API_KEY and settings.GNANI_TTS_MODE.lower() != "mock":
        return GnaniTTSService()
    return MockTTSService()
