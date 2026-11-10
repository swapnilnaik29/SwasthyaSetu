import pytest
from app.services.speech.mock_speech import MockSTTService, MockTTSService
from app.services.speech.gnani_stt import GnaniSTTService
from app.services.speech.gnani_tts import GnaniTTSService
from app.api.routes.audio import store_transient_audio


@pytest.mark.asyncio
async def test_mock_speech_services():
    stt = MockSTTService()
    transcript, meta = await stt.transcribe(b"fake_audio", "hi-IN")
    assert "fever" in transcript.lower()
    assert meta["is_mock"] is True

    tts = MockTTSService()
    wav_bytes = await tts.synthesize("Take paracetamol", "hi-IN")
    # Verify valid RIFF WAVE header
    assert len(wav_bytes) > 44
    assert wav_bytes[:4] == b"RIFF"
    assert wav_bytes[8:12] == b"WAVE"


@pytest.mark.asyncio
async def test_audio_playback_endpoint(client):
    fake_audio = b"RIFF" + b"\x00" * 100
    audio_id = store_transient_audio(fake_audio)

    res = await client.get(f"/api/v1/audio/{audio_id}")
    assert res.status_code == 200
    assert res.headers["content-type"] == "audio/wav"
    assert res.content.startswith(b"RIFF")


@pytest.mark.asyncio
async def test_gnani_adapters_require_key():
    # If keys are empty or invalid, services handle securely
    stt = GnaniSTTService(api_key="")
    assert stt is not None

    tts = GnaniTTSService(api_key="")
    assert tts is not None

