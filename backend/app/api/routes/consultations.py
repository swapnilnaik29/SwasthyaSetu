import json
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from pydantic import BaseModel
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
    DoctorAIAssistRequest,
    DoctorAIAssistResponse,
)
from app.schemas.followup import FollowupCreate, FollowupOut
from app.services.speech.factory import get_stt_service, get_tts_service
from app.services.translation.luna_service import GPT6LunaTranslationService, get_openai_client
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
        mode=consultation_in.mode or "NORMAL",
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


class TextTurnRequest(BaseModel):
    speaker: str
    source_language: Optional[str] = None
    target_language: Optional[str] = None
    text: str


@router.post("/{consultation_id}/turns", response_model=TurnProcessResult)
@router.post("/{consultation_id}/turns/audio", response_model=TurnProcessResult)
async def process_consultation_turn(
    consultation_id: str,
    speaker: str = Form(..., description="Active speaker: PATIENT or DOCTOR"),
    source_language: Optional[str] = Form(None, description="Speaker's source language code"),
    target_language: Optional[str] = Form(None, description="Recipient's target language code"),
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

    # Resolve default source and target languages from consultation if not specified
    if not source_language or not target_language:
        doc_lang = getattr(consultation, "doctor_language", "en-IN") or "en-IN"
        pat_lang = getattr(consultation, "patient_language", "hi-IN") or "hi-IN"
        if speaker_clean == "PATIENT":
            source_language = source_language or pat_lang
            target_language = target_language or doc_lang
        else:
            source_language = source_language or doc_lang
            target_language = target_language or pat_lang

    # Step 1: Obtain transcribed text
    raw_recognized_text = ""
    metadata = {}
    if audio:
        audio_bytes = await audio.read()
        if len(audio_bytes) > settings.MAX_AUDIO_MB * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"Audio exceeds maximum size of {settings.MAX_AUDIO_MB}MB")
        try:
            stt_service = get_stt_service()
            raw_recognized_text, metadata = await stt_service.transcribe(
                audio_bytes=audio_bytes,
                language=source_language,
                filename=audio.filename or "turn.wav",
            )
        except Exception as e:
            logger.warning(f"STT transcribe error: {e}. Falling back to mock STT.")
            from app.services.speech.mock_speech import MockSTTService
            raw_recognized_text, metadata = await MockSTTService().transcribe(
                audio_bytes=audio_bytes,
                language=source_language,
                filename=audio.filename or "turn.wav",
            )
    elif text:
        raw_recognized_text = text.strip()
        metadata = {"input_type": "direct_text"}
    else:
        raise HTTPException(status_code=400, detail="Either audio file or text must be provided")

    if not raw_recognized_text or not raw_recognized_text.strip():
        raise HTTPException(
            status_code=400,
            detail="No clear speech detected in recording. Please speak again.",
        )

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

    # Step 4: Text-to-Speech synthesis in recipient language (skipped in ambient background scribe mode)
    audio_url = None
    if getattr(consultation, "mode", "NORMAL") != "AMBIENT_BACKGROUND":
        try:
            tts_service = get_tts_service()
            patient = await db.get(Patient, consultation.patient_id)
            doc = await db.get(Doctor, consultation.doctor_id)

            is_patient_turn = (speaker_clean == "PATIENT")
            patient_is_female = False
            if patient and patient.gender:
                g = patient.gender.strip().lower()
                if "fem" in g or g == "f" or "woman" in g or "स्त्री" in g or "महिला" in g:
                    patient_is_female = True

            target_gender = "female" if (is_patient_turn and patient_is_female) else "male"

            chosen_voice = None
            if doc:
                if is_patient_turn:
                    chosen_voice = getattr(doc, "patient_voice", "Auto")
                else:
                    chosen_voice = getattr(doc, "doctor_voice", "Auto")

            # Female patient voice must be feminine
            if is_patient_turn and patient_is_female:
                target_gender = "female"
                if not chosen_voice or any(k in chosen_voice.lower() for k in ["auto", "male", "deepak", "omkar", "deven", "echo", "onyx"]):
                    chosen_voice = "Nova"

            tts_audio_bytes = await tts_service.synthesize(
                text=recipient_translation,
                language=target_language,
                voice=chosen_voice,
                gender=target_gender,
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


@router.post("/{consultation_id}/turns/text", response_model=TurnProcessResult)
async def process_text_turn(
    consultation_id: str,
    payload: TextTurnRequest,
    db: AsyncSession = Depends(get_db),
):
    """Process a typed text turn with JSON payload."""
    return await process_consultation_turn(
        consultation_id=consultation_id,
        speaker=payload.speaker,
        source_language=payload.source_language,
        target_language=payload.target_language,
        text=payload.text,
        audio=None,
        db=db,
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

    # Prepend patient intake summary if present so report has full context
    patient = await db.get(Patient, consultation.patient_id)
    if patient and (patient.intake_summary_english or patient.chief_complaint):
        transcript_dicts.insert(0, {
            "id": "patient_intake_brief",
            "speaker": "PATIENT_INTAKE",
            "canonical_english_text": (
                f"Intake Briefing: {patient.intake_summary_english or ''}. "
                f"Chief Complaint: {patient.chief_complaint or ''}. "
                f"Past History: {patient.past_medical_history or 'None'}. "
                f"Allergies: {patient.known_allergies or 'None'}."
            ),
            "timestamp": consultation.started_at.isoformat(),
        })

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


@router.post("/{consultation_id}/scribe", response_model=DraftOut)
async def process_scribe_consultation(
    consultation_id: str,
    audio: UploadFile = File(...),
    doctor_language: Optional[str] = Form(None),
    patient_language: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Process an ambient scribe session:
    1. Transcribe continuous doctor-patient dialogue using Speech-to-Text.
    2. Segment turns and translate all utterances to canonical English.
    3. Generate and persist structured clinical draft with vitals, diagnosis, prescriptions, and notes.
    """
    consultation = await db.get(Consultation, consultation_id)
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    audio_bytes = await audio.read()
    if len(audio_bytes) > settings.MAX_AUDIO_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Audio exceeds maximum size of {settings.MAX_AUDIO_MB}MB")

    stt_lang = patient_language or consultation.patient_language or "en-IN"
    stt_service = get_stt_service()
    raw_transcript = ""
    try:
        raw_transcript, metadata = await stt_service.transcribe(
            audio_bytes=audio_bytes,
            language=stt_lang,
            filename=audio.filename or "scribe.wav",
        )
    except Exception as e:
        logger.warning(f"Scribe STT error: {e}")
        raw_transcript = ""

    patient = await db.get(Patient, consultation.patient_id)
    patient_context_parts = []
    if patient:
        patient_context_parts.append(f"Patient Name: {patient.name}, Age: {patient.age}, Gender: {patient.gender}")
        if patient.chief_complaint:
            patient_context_parts.append(f"Chief Complaint: {patient.chief_complaint}")
        if patient.symptoms_duration:
            patient_context_parts.append(f"Symptoms Duration: {patient.symptoms_duration}")
        if patient.past_medical_history:
            patient_context_parts.append(f"Past Medical History: {patient.past_medical_history}")
        if patient.known_allergies:
            patient_context_parts.append(f"Known Allergies: {patient.known_allergies}")
        if patient.current_medications:
            patient_context_parts.append(f"Regular Medications: {patient.current_medications}")
        if patient.intake_summary_english:
            patient_context_parts.append(f"Intake Briefing: {patient.intake_summary_english}")
    patient_context = "\n".join(patient_context_parts) if patient_context_parts else "No prior history recorded."

    # Use GPT-6 Luna to segment turns and extract structured report
    client = get_openai_client(settings.OPENAI_API_KEY)
    system_prompt = (
        "You are an expert AI Clinical Scribe for SwasthyaSetu in a high-volume Indian hospital/clinic.\n"
        "You analyze the ambient consultation audio transcript between Doctor and Patient, combined with any pre-consultation intake background.\n"
        "The dialogue may be spoken in Indian languages (Marathi, Hindi, Gujarati, English, etc.) or code-switched.\n\n"
        "Your task is to produce a rigorous, complete clinical report strictly in English JSON:\n"
        "1. 'turns': Array of turn objects [{ 'speaker': 'DOCTOR'|'PATIENT', 'source_text': 'original statement', 'canonical_english': 'clear English translation' }]. If continuous, segment logically.\n"
        "2. 'structured_report': Object with:\n"
        "   - doctor_diagnosis: A clear, definitive professional diagnosis in English (e.g. 'Acute Febrile Illness with Upper Respiratory Tract Infection', 'Acute Bronchitis', etc.). Never leave empty.\n"
        "   - patient_reported_symptoms: Array of objects with 'symptom' (name in English), 'duration' (e.g. '2 days'), 'severity' ('Mild'/'Moderate'/'Severe' or 'Not stated')\n"
        "   - vitals: Object with 'blood_pressure' ('120/80 mmHg'), 'pulse_bpm' (int), 'temperature_f' (float), 'spo2_percent' (int), 'weight_kg' (float), 'height_cm' (float)\n"
        "   - prescriptions: Array of objects with 'medicine' (e.g. 'Tab Paracetamol 500mg'), 'strength', 'dose', 'frequency', 'duration', 'instructions'\n"
        "   - doctor_notes: Comprehensive clinical observations, diet advice, warning signs, and patient rest recommendations\n"
        "   - follow_up_recommendation: Clear review recommendation (e.g. 'Review after 3 days if fever persists')\n"
        "   - follow_up_days: Integer number of days (default 3)\n"
        "   - recommended_next_visit_date: String YYYY-MM-DD\n\n"
        "Rules:\n"
        "- Synthesize all patient symptoms mentioned in the dialogue AND the patient background into patient_reported_symptoms.\n"
        "- If medicines are mentioned (e.g. Paracetamol, Dolo, Cetirizine, antibiotics, cough syrups), create complete prescription entries.\n"
        "- Output strictly valid JSON with top-level keys: 'turns' and 'structured_report'."
    )

    user_prompt = f"Patient Background:\n{patient_context}\n\nFull Consultation Transcript:\n{raw_transcript or 'Dialogue recorded between doctor and patient.'}"

    try:
        call_kwargs = {
            "model": settings.OPENAI_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {"type": "json_object"},
        }
        response = await client.chat.completions.create(**call_kwargs)
        content = response.choices[0].message.content or "{}"
        parsed_json = json.loads(content)
    except Exception as e:
        logger.error(f"Scribe GPT extraction failed: {e}")
        parsed_json = {
            "turns": [{"speaker": "DOCTOR", "source_text": raw_transcript, "canonical_english": raw_transcript}],
            "structured_report": {
                "doctor_diagnosis": (patient.chief_complaint + " Evaluation" if patient and patient.chief_complaint else "Clinical Consultation Recorded"),
                "patient_reported_symptoms": [{"symptom": patient.chief_complaint or "General illness", "duration": patient.symptoms_duration or "2 days", "severity": "Moderate"}] if patient and patient.chief_complaint else [],
                "vitals": {},
                "prescriptions": [],
                "doctor_notes": raw_transcript or (patient.intake_summary_english if patient else "Consultation completed."),
                "follow_up_recommendation": "Review after 3 days if symptoms persist",
                "follow_up_days": 3,
                "recommended_next_visit_date": (datetime.now().date() + timedelta(days=3)).isoformat(),
            }
        }

    turns_data = parsed_json.get("turns", [])
    report_data = parsed_json.get("structured_report", {})

    now = datetime.now(timezone.utc)
    for t_data in turns_data:
        spk = t_data.get("speaker", "DOCTOR").upper()
        if "PAT" in spk:
            spk = "PATIENT"
        else:
            spk = "DOCTOR"
        canonical_eng = t_data.get("canonical_english") or t_data.get("source_text") or "Consultation dialogue recorded."
        t_model = Transcript(
            consultation_id=consultation_id,
            speaker=spk,
            canonical_english_text=canonical_eng,
            source_language=consultation.patient_language if spk == "PATIENT" else "en-IN",
            recipient_language="en-IN" if spk == "PATIENT" else consultation.patient_language,
            timestamp=now,
            confidence_metadata={"source_text": t_data.get("source_text", "")},
        )
        db.add(t_model)

    days = report_data.get("follow_up_days") or 3
    if not report_data.get("recommended_next_visit_date"):
        from datetime import timedelta
        report_data["recommended_next_visit_date"] = (datetime.now().date() + timedelta(days=days)).isoformat()
    report_data["follow_up_days"] = days

    try:
        structured_payload = StructuredDraftPayload(**report_data)
        saved_dict = structured_payload.model_dump()
    except Exception as e:
        logger.warning(f"Draft validation fallback: {e}")
        fallback_symptoms = []
        for s in report_data.get("patient_reported_symptoms", []):
            try:
                fallback_symptoms.append(SymptomItem(**s).model_dump() if isinstance(s, dict) else SymptomItem(symptom=str(s)).model_dump())
            except Exception:
                pass
        fallback_prescriptions = []
        for p in report_data.get("prescriptions", []):
            try:
                fallback_prescriptions.append(PrescriptionItem(**p).model_dump() if isinstance(p, dict) else PrescriptionItem(medicine=str(p)).model_dump())
            except Exception:
                pass
        saved_dict = {
            "doctor_diagnosis": report_data.get("doctor_diagnosis") or "Clinical Consultation Recorded",
            "vitals": report_data.get("vitals") or {},
            "patient_reported_symptoms": fallback_symptoms,
            "prescriptions": fallback_prescriptions,
            "doctor_notes": report_data.get("doctor_notes") or "",
            "follow_up_recommendation": report_data.get("follow_up_recommendation") or "Review after 3 days if symptoms persist",
            "follow_up_days": days,
            "recommended_next_visit_date": report_data.get("recommended_next_visit_date"),
        }

    stmt_draft = select(ConsultationDraft).where(ConsultationDraft.consultation_id == consultation_id)
    res_draft = await db.execute(stmt_draft)
    draft = res_draft.scalar_one_or_none()

    if draft:
        draft.structured_payload = saved_dict
        draft.status = "PENDING_REVIEW"
    else:
        draft = ConsultationDraft(
            consultation_id=consultation_id,
            structured_payload=saved_dict,
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


@router.post("/{consultation_id}/ai-assist", response_model=DoctorAIAssistResponse)
@router.post("/{consultation_id}/doctor-assist", response_model=DoctorAIAssistResponse)
async def doctor_ai_assist(
    consultation_id: str,
    payload: DoctorAIAssistRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Doctor speaks or types additional clinical details (weight, height, BP, notes, prescriptions)
    which AI parses and merges into the existing clinical report in real-time.
    """
    consultation = await db.get(Consultation, consultation_id)
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    stmt = select(ConsultationDraft).where(ConsultationDraft.consultation_id == consultation_id)
    res = await db.execute(stmt)
    draft = res.scalar_one_or_none()

    extractor = DraftExtractorService()
    if not draft:
        stmt_trans = (
            select(Transcript)
            .where(Transcript.consultation_id == consultation_id)
            .order_by(Transcript.timestamp.asc())
        )
        res_trans = await db.execute(stmt_trans)
        transcripts = res_trans.scalars().all()
        transcript_dicts = [
            {"id": t.id, "speaker": t.speaker, "canonical_english_text": t.canonical_english_text}
            for t in transcripts
        ]
        current_payload = await extractor.extract_draft(transcript_dicts)
        draft = ConsultationDraft(
            consultation_id=consultation_id,
            structured_payload=current_payload.model_dump(),
            status="PENDING_REVIEW",
        )
        db.add(draft)
        await db.commit()
        await db.refresh(draft)
    else:
        current_payload = StructuredDraftPayload(**draft.structured_payload)

    updated_payload, ai_reply = await extractor.assist_with_doctor_input(
        current_payload=current_payload,
        doctor_message=payload.clean_message,
        language=payload.clean_language,
    )

    draft.structured_payload = updated_payload.model_dump()
    await db.commit()
    await db.refresh(draft)

    return DoctorAIAssistResponse(
        updated_payload=updated_payload,
        ai_reply=ai_reply,
    )


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


@router.post("/{consultation_id}/followup", response_model=FollowupOut, status_code=201)
@router.post("/{consultation_id}/followups", response_model=FollowupOut, status_code=201)
async def schedule_followup(
    consultation_id: str,
    followup_in: FollowupCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Schedule follow-up appointment.
    Supports both /followup and /followups endpoints and auto-resolves patient phone.
    """
    consultation = await db.get(Consultation, consultation_id)
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    # Resolve appointment datetime
    appt_dt = followup_in.appointment_at
    if not appt_dt and followup_in.scheduled_date:
        try:
            clean_date = followup_in.scheduled_date.strip().replace("Z", "+00:00")
            appt_dt = datetime.fromisoformat(clean_date)
        except Exception:
            try:
                appt_dt = datetime.strptime(followup_in.scheduled_date[:10], "%Y-%m-%d")
            except Exception:
                appt_dt = datetime.now(timezone.utc) + timedelta(days=3)

    if not appt_dt:
        appt_dt = datetime.now(timezone.utc) + timedelta(days=3)

    # Ensure tz-aware
    if appt_dt.tzinfo is None:
        appt_dt = appt_dt.replace(tzinfo=timezone.utc)

    # Resolve phone number
    phone = followup_in.phone_number
    if not phone or len(phone) < 10:
        patient = await db.get(Patient, consultation.patient_id)
        phone = patient.mobile_number if patient else "9876543210"

    followup = Followup(
        consultation_id=consultation_id,
        appointment_at=appt_dt,
        phone_number=phone,
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

