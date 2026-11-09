import time
import uuid
from typing import Dict, Tuple
from fastapi import APIRouter, HTTPException, Response

router = APIRouter(prefix="/audio", tags=["Audio"])

# In-memory transient audio store with TTL (expires after 15 minutes)
_AUDIO_STORE: Dict[str, Tuple[bytes, float]] = {}


def store_transient_audio(audio_bytes: bytes, ttl_seconds: int = 900) -> str:
    audio_id = uuid.uuid4().hex
    expiry = time.time() + ttl_seconds
    _AUDIO_STORE[audio_id] = (audio_bytes, expiry)
    
    # Clean up old expired entries
    now = time.time()
    expired_keys = [k for k, (_, exp) in _AUDIO_STORE.items() if exp < now]
    for k in expired_keys:
        _AUDIO_STORE.pop(k, None)

    return audio_id


@router.get("/{audio_id}")
async def get_audio_playback(audio_id: str):
    """Serve synthesized TTS audio for Flutter mobile playback."""
    entry = _AUDIO_STORE.get(audio_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Audio resource expired or not found")

    audio_bytes, expiry = entry
    if time.time() > expiry:
        _AUDIO_STORE.pop(audio_id, None)
        raise HTTPException(status_code=404, detail="Audio resource expired")

    return Response(content=audio_bytes, media_type="audio/wav")

