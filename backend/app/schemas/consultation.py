from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class ConsultationCreate(BaseModel):
    patient_id: str
    doctor_id: Optional[str] = None
    doctor_language: Optional[str] = Field("en-IN", pattern="^(en-IN|hi-IN|mr-IN)$")
    patient_language: Optional[str] = Field("hi-IN", pattern="^(en-IN|hi-IN|mr-IN)$")


class ConsultationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    patient_id: str
    doctor_id: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    doctor_language: str
    patient_language: str
    status: str
    created_at: datetime


class TranscriptOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    consultation_id: str
    speaker: str
    canonical_english_text: str
    source_language: str
    recipient_language: str
    timestamp: datetime
    confidence_metadata: Optional[Dict[str, Any]] = None


class TranscriptUpdate(BaseModel):
    canonical_english_text: str


class TurnProcessResult(BaseModel):
    """
    Result returned for a single turn in the consultation.
    Original recognized speech is shown transiently in the UI for doctor review,
    while canonical English text is safely persisted in the database.
    """
    transcript_id: str
    speaker: str
    source_language: str
    recipient_language: str
    recognized_source_text: str  # Transient for doctor audit
    recipient_translation: str
    canonical_english: str
    audio_url: Optional[str] = None  # URL for TTS synthesis playback
    cache_hit: bool = False
    uncertainty_flags: List[str] = []
    needs_human_review: bool = False
