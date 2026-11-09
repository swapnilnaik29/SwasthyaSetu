from abc import ABC, abstractmethod
from typing import Tuple, Optional


class STTProvider(ABC):
    @abstractmethod
    async def transcribe(self, audio_bytes: bytes, language: str, filename: str = "audio.wav") -> Tuple[str, dict]:
        """
        Transcribes speech audio bytes to text in the given language.
        Returns: (transcribed_text, metadata_dict)
        """
        pass


class TTSProvider(ABC):
    @abstractmethod
    async def synthesize(self, text: str, language: str, voice: Optional[str] = None) -> bytes:
        """
        Synthesizes text to speech audio bytes in the given language.
        Returns: audio bytes (WAV or MP3)
        """
        pass
