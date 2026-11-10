import time
import uuid
from typing import Dict, Tuple, Optional
from fastapi import APIRouter, HTTPException, Response, UploadFile, File, Form
from pydantic import BaseModel
from app.services.speech.factory import get_stt_service, get_tts_service
from app.services.speech.gnani_tts import sanitize_wav_header

router = APIRouter(prefix="/audio", tags=["Audio"])

# In-memory transient audio store with TTL (expires after 15 minutes)
_AUDIO_STORE: Dict[str, Tuple[bytes, float]] = {}


def store_transient_audio(audio_bytes: bytes, ttl_seconds: int = 900) -> str:
    # Ensure WAV chunk headers are valid before storing
    sanitized_bytes = sanitize_wav_header(audio_bytes) if audio_bytes.startswith(b"RIFF") else audio_bytes
    audio_id = uuid.uuid4().hex
    expiry = time.time() + ttl_seconds
    _AUDIO_STORE[audio_id] = (sanitized_bytes, expiry)
    
    # Clean up old expired entries
    now = time.time()
    expired_keys = [k for k, (_, exp) in _AUDIO_STORE.items() if exp < now]
    for k in expired_keys:
        _AUDIO_STORE.pop(k, None)

    return audio_id


class SynthesizeRequest(BaseModel):
    text: str
    language: str = "hi-IN"
    voice: Optional[str] = None
    gender: Optional[str] = "female"
    voice_gender: Optional[str] = None


@router.post("/synthesize")
async def synthesize_text(payload: SynthesizeRequest):
    """Direct TTS synthesis for conversational intake assistant."""
    tts = get_tts_service()
    try:
        target_gender = payload.voice_gender or payload.gender or "female"
        wav_bytes = await tts.synthesize(
            payload.text,
            payload.language,
            payload.voice,
            gender=target_gender,
        )
        audio_id = store_transient_audio(wav_bytes)
        return {"audio_id": audio_id, "audio_url": f"/api/v1/audio/{audio_id}"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"TTS synthesis failed: {str(e)}")


@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: str = Form("hi-IN"),
):
    """Direct STT transcription for conversational intake assistant."""
    stt = get_stt_service()
    try:
        audio_bytes = await audio.read()
        transcript, metadata = await stt.transcribe(
            audio_bytes=audio_bytes,
            language=language,
            filename=audio.filename or "intake.wav",
        )
        return {"transcript": transcript, "metadata": metadata}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"STT transcription failed: {str(e)}")


@router.get("/{audio_id}")
async def get_audio_playback(audio_id: str):
    """Serve synthesized TTS audio for mobile and browser playback with proper stream headers."""
    entry = _AUDIO_STORE.get(audio_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Audio resource expired or not found")

    audio_bytes, expiry = entry
    if time.time() > expiry:
        _AUDIO_STORE.pop(audio_id, None)
        raise HTTPException(status_code=404, detail="Audio resource expired")

    return Response(
        content=audio_bytes,
        media_type="audio/wav",
        headers={
            "Content-Length": str(len(audio_bytes)),
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=3600",
        },
    )
