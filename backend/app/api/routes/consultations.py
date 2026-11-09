import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.core.config import settings
from app.core.logger import logger, log_sanitized_event
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.consultation import Consultation
from app.models.transcript import Transcript
from app.models.consultation_draft import ConsultationDraft
from app.models.clinical_record import ClinicalRecord
from app.models.followup import Followup
from app.schemas.consultation import (
    ConsultationCreate,
    ConsultationOut,
    TranscriptOut,
    TurnProcessResult,
)
from app.schemas.draft import (
    DraftOut,
    DraftUpdate,
    ClinicalRecordOut,
    StructuredDraftPayload,
)
from app.schemas.followup import FollowupCreate, FollowupOut
from app.services.speech.factory import get_stt_service, get_tts_service
from app.services.translation.luna_service import GPT6LunaTranslationService
from app.services.records.draft_extractor import DraftExtractorService
from app.api.routes.doctor import get_or_create_default_doctor
from app.api.routes.audio import store_transient_audio

router = APIRouter(prefix="/consultations", tags=["Consultations"])


@router.post("", response_model=ConsultationOut, status_code=201)
async def create_consultation(
    consultation_in: ConsultationCreate,
    db: AsyncSession = Depends(get_db),
):
    """Start a new consultation between a patient and the doctor."""
    patient = await db.get(Patient, consultation_in.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    doctor = None
    if consultation_in.doctor_id:
        doctor = await db.get(Doctor, consultation_in.doctor_id)
    if not doctor:
        doctor = await get_or_create_default_doctor(db)

    consultation = Consultation(
        patient_id=patient.id,
        doctor_id=doctor.id,
        doctor_language=consultation_in.doctor_language or doctor.preferred_language or "en-IN",
        patient_language=consultation_in.patient_language or patient.preferred_language or "hi-IN",
        status="ACTIVE",
    )
    db.add(consultation)
    await db.commit()
    await db.refresh(consultation)
    return consultation


@router.get("/{consultation_id}", response_model=ConsultationOut)
async def get_consultation(
    consultation_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve consultation details."""
    consultation = await db.get(Consultation, consultation_id)
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return consultation


@router.post("/{consultation_id}/turns", response_model=TurnProcessResult)
async def process_consultation_turn(
    consultation_id: str,
    speaker: str = Form(..., description="Active speaker: PATIENT or DOCTOR"),
    source_language: str = Form(..., description="Speaker's source language code"),
    target_language: str = Form(..., description="Recipient's target language code"),
    text: Optional[str] = Form(None, description="Direct text input fallback"),
    audio: Optional[UploadFile] = File(None, description="Audio file of the speech turn"),
    db: AsyncSession = Depends(get_db),
):
    """
    Process a single speech turn:
    1. Speech-to-text (Gnani Prisma STT).
    2. Bidirectional translation & English canonicalization (OpenAI GPT-6 Luna + Persistent Encrypted Cache).
    3. Persist canonical English text to DB.
    4. Text-to-speech synthesis (Gnani Timbre TTS).
    """
    consultation = await db.get(Consultation, consultation_id)
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    speaker_clean = speaker.strip().upper()
    if speaker_clean not in ["PATIENT", "DOCTOR"]:
        raise HTTPException(status_code=400, detail="Speaker must be PATIENT or DOCTOR")

    # Step 1: Obtain transcribed text
    raw_recognized_text = ""
    metadata = {}
    if audio:
        audio_bytes = await audio.read()
        if len(audio_bytes) > settings.MAX_AUDIO_MB * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"Audio exceeds maximum size of {settings.MAX_AUDIO_MB}MB")
        stt_service = get_stt_service()
        raw_recognized_text, metadata = await stt_service.transcribe(
            audio_bytes=audio_bytes,
            language=source_language,
            filename=audio.filename or "turn.wav",
        )
    elif text:
        raw_recognized_text = text.strip()
        metadata = {"input_type": "direct_text"}
    else:
        raise HTTPException(status_code=400, detail="Either audio file or text must be provided")

    if not raw_recognized_text:
        raise HTTPException(status_code=400, detail="No speech could be recognized in the provided turn")

    # Step 2: Bidirectional translation & English canonicalization via GPT-6 Luna
    translation_service = GPT6LunaTranslationService(db)
    trans_result = await translation_service.translate_turn(
        text=raw_recognized_text,
        speaker=speaker_clean,
        source_lang=source_language,
        recipient_lang=target_language,
    )

    canonical_english = trans_result["canonical_english"]
    recipient_translation = trans_result["recipient_translation"]

    # Step 3: Persist canonical English record in transcripts table
    # CRITICAL: Only canonical English is stored in the clinical record table!
    transcript = Transcript(
        consultation_id=consultation.id,
        speaker=speaker_clean,
        canonical_english_text=canonical_english,
        source_language=source_language,
        recipient_language=target_language,
        confidence_metadata=metadata,
    )
    db.add(transcript)
    await db.commit()
    await db.refresh(transcript)

    # Step 4: Text-to-Speech synthesis in recipient language
    audio_url = None
    try:
        tts_service = get_tts_service()
        tts_audio_bytes = await tts_service.synthesize(
            text=recipient_translation,
            language=target_language,
        )
        audio_id = store_transient_audio(tts_audio_bytes)
        audio_url = f"{settings.API_V1_PREFIX}/audio/{audio_id}"
    except Exception as e:
        logger.error(f"TTS synthesis error for turn {transcript.id}: {str(e)}")

    return TurnProcessResult(
        transcript_id=transcript.id,
        speaker=speaker_clean,
        source_language=source_language,
        recipient_language=target_language,
        recognized_source_text=raw_recognized_text,
        recipient_translation=recipient_translation,
        canonical_english=canonical_english,
        audio_url=audio_url,
        cache_hit=trans_result.get("cache_hit", False),
        uncertainty_flags=trans_result.get("uncertainty_flags", []),
        needs_human_review=trans_result.get("needs_human_review", False),
    )


@router.get("/{consultation_id}/transcripts", response_model=List[TranscriptOut])
async def list_transcripts(
    consultation_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all persisted canonical English transcripts for a consultation."""
    stmt = (
        select(Transcript)
        .where(Transcript.consultation_id == consultation_id)
        .order_by(Transcript.timestamp.asc())
    )
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("/{consultation_id}/draft", response_model=DraftOut)
async def generate_draft(
    consultation_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Generate structured medical draft from canonical English transcripts using GPT-6 Luna."""
    consultation = await db.get(Consultation, consultation_id)
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    # Fetch transcripts
    stmt = (
        select(Transcript)
        .where(Transcript.consultation_id == consultation_id)
        .order_by(Transcript.timestamp.asc())
    )
    res = await db.execute(stmt)
    transcripts = res.scalars().all()

    transcript_dicts = [
        {
            "id": t.id,
            "speaker": t.speaker,
            "canonical_english_text": t.canonical_english_text,
            "timestamp": t.timestamp.isoformat(),
        }
        for t in transcripts
    ]

    extractor = DraftExtractorService()
    extracted_payload = await extractor.extract_draft(transcript_dicts)

    # Check if a draft already exists to update or create
    stmt_draft = select(ConsultationDraft).where(ConsultationDraft.consultation_id == consultation_id)
    res_draft = await db.execute(stmt_draft)
    draft = res_draft.scalar_one_or_none()

    if draft:
        draft.structured_payload = extracted_payload.model_dump()
        draft.status = "PENDING_REVIEW"
    else:
        draft = ConsultationDraft(
            consultation_id=consultation_id,
            structured_payload=extracted_payload.model_dump(),
            status="PENDING_REVIEW",
        )
        db.add(draft)

    await db.commit()
    await db.refresh(draft)
    return draft


@router.get("/{consultation_id}/draft", response_model=DraftOut)
async def get_draft(
    consultation_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve existing consultation draft."""
    stmt = select(ConsultationDraft).where(ConsultationDraft.consultation_id == consultation_id)
    res = await db.execute(stmt)
    draft = res.scalar_one_or_none()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found for this consultation")
    return draft


@router.patch("/{consultation_id}/draft", response_model=DraftOut)
async def update_draft(
    consultation_id: str,
    draft_in: DraftUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Allow doctor to edit any field in the generated draft."""
    stmt = select(ConsultationDraft).where(ConsultationDraft.consultation_id == consultation_id)
    res = await db.execute(stmt)
    draft = res.scalar_one_or_none()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    draft.structured_payload = draft_in.structured_payload.model_dump()
    await db.commit()
    await db.refresh(draft)
    return draft


@router.post("/{consultation_id}/approve", response_model=ClinicalRecordOut)
async def approve_draft(
    consultation_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Doctor approves the clinical draft.
    Only doctor-approved information is committed as the official clinical record.
    """
    consultation = await db.get(Consultation, consultation_id)
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    stmt = select(ConsultationDraft).where(ConsultationDraft.consultation_id == consultation_id)
    res = await db.execute(stmt)
    draft = res.scalar_one_or_none()
    if not draft:
        raise HTTPException(status_code=400, detail="Cannot approve without a generated draft")

    # Update draft status
    draft.status = "APPROVED"
    consultation.status = "COMPLETED"
    consultation.ended_at = datetime.now(timezone.utc)

    # Check if clinical record exists
    stmt_rec = select(ClinicalRecord).where(ClinicalRecord.consultation_id == consultation_id)
    res_rec = await db.execute(stmt_rec)
    rec = res_rec.scalar_one_or_none()

    if rec:
        rec.approved_payload = draft.structured_payload
        rec.approved_by = consultation.doctor_id
        rec.approved_at = datetime.now(timezone.utc)
    else:
        rec = ClinicalRecord(
            consultation_id=consultation.id,
            approved_payload=draft.structured_payload,
            approved_by=consultation.doctor_id,
            approved_at=datetime.now(timezone.utc),
        )
        db.add(rec)

    await db.commit()
    await db.refresh(rec)
    log_sanitized_event("clinical_record_approved", consultation_id=consultation_id, doctor_id=consultation.doctor_id)
    return rec


@router.post("/{consultation_id}/reject", response_model=DraftOut)
async def reject_draft(
    consultation_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Doctor rejects the draft."""
    stmt = select(ConsultationDraft).where(ConsultationDraft.consultation_id == consultation_id)
    res = await db.execute(stmt)
    draft = res.scalar_one_or_none()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    draft.status = "REJECTED"
    await db.commit()
    await db.refresh(draft)
    return draft


@router.post("/{consultation_id}/followups", response_model=FollowupOut, status_code=201)
async def schedule_followup(
    consultation_id: str,
    followup_in: FollowupCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Schedule follow-up appointment.
    SMS dispatch is reserved for future app settings integration.
    """
    consultation = await db.get(Consultation, consultation_id)
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    followup = Followup(
        consultation_id=consultation_id,
        appointment_at=followup_in.appointment_at,
        phone_number=followup_in.phone_number,
        sms_status="SAVED_LOCAL (SMS reserved for future integration)",
        provider_message_id=None,
    )
    db.add(followup)
    await db.commit()
    await db.refresh(followup)
    return followup


@router.get("/{consultation_id}/followups", response_model=List[FollowupOut])
async def list_followups(
    consultation_id: str,
    db: AsyncSession = Depends(get_db),
):
    """List scheduled follow-ups for a consultation."""
    stmt = select(Followup).where(Followup.consultation_id == consultation_id).order_by(Followup.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

