import io
import math
import struct
import wave
from typing import Tuple, Optional
from app.core.logger import logger, log_sanitized_event
from app.services.speech.base import STTProvider, TTSProvider


class MockSTTService(STTProvider):
    """
    Mock STT adapter for testing and offline development.
    Produces deterministic transcripts for hackathon demonstration scenarios.
    """

    def __init__(self):
        logger.info("Initializing MockSTTService [OFFLINE/MOCK MODE]")

    async def transcribe(self, audio_bytes: bytes, language: str, filename: str = "audio.wav") -> Tuple[str, dict]:
        log_sanitized_event("mock_stt_transcription", audio_size=len(audio_bytes), language=language)

        # Standard demonstration scripted utterances
        lang = language.strip().lower()
        if "hi" in lang:
            transcript = "Mujhe three days se fever hai aur headache bhi hai."
        elif "mr" in lang:
            transcript = "Mala teen divasapasun taap aani dukhane ahe."
        else:
            transcript = "Take this paracetamol 500mg twice daily after meals."

        metadata = {
            "provider": "mock_stt",
            "confidence": 0.98,
            "detected_language": language,
            "is_mock": True,
        }
        return transcript, metadata


class MockTTSService(TTSProvider):
    """
    Mock TTS adapter for testing and offline development.
    Generates a valid playable WAV audio file with a gentle audio tone
    so that mobile audio playback (just_audio) functions authentically without errors.
    """

    def __init__(self):
        logger.info("Initializing MockTTSService [OFFLINE/MOCK MODE]")

    async def synthesize(self, text: str, language: str, voice: Optional[str] = None) -> bytes:
        log_sanitized_event("mock_tts_synthesis", text_length=len(text), language=language)
        
        # Generate 0.5s of gentle audio tone in PCM WAV format
        sample_rate = 16000
        duration = 0.5
        num_samples = int(sample_rate * duration)
        frequency = 440.0  # 440 Hz tone
        
        buffer = io.BytesIO()
        with wave.open(buffer, "wb") as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)  # 16-bit
            wav_file.setframerate(sample_rate)
            
            raw_frames = bytearray()
            for i in range(num_samples):
                t = float(i) / sample_rate
                # Sine wave with smooth envelope
                envelope = math.sin(math.pi * i / num_samples)
                sample = int(32767 * 0.2 * envelope * math.sin(2 * math.pi * frequency * t))
                raw_frames.extend(struct.pack("<h", sample))
                
            wav_file.writeframes(raw_frames)
            
        return buffer.getvalue()
