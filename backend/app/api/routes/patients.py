import json
import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.db.session import get_db
from app.models.patient import Patient
from app.models.consultation import Consultation
from app.schemas.patient import (
    PatientCreate,
    PatientUpdate,
    PatientOut,
    PatientIntakeSubmission,
    IntakeValidationRequest,
    IntakeValidationResponse,
)
from app.schemas.consultation import ConsultationOut
from app.core.config import settings
from app.core.logger import logger
from app.services.translation.luna_service import get_openai_client

router = APIRouter(prefix="/patients", tags=["Patients"])


async def translate_and_summarize_intake(intake: PatientIntakeSubmission) -> dict:
    """Translates patient's intake responses into canonical medical English using GPT-6 Luna."""
    complaint_raw = intake.chief_complaint or ""
    history_raw = intake.past_medical_history or ""
    allergies_raw = intake.known_allergies or ""
    meds_raw = intake.current_medications or ""
    lang = intake.preferred_language or "hi-IN"

    client = get_openai_client(settings.OPENAI_API_KEY)

    system_prompt = (
        "You are an expert AI clinical triage assistant. A patient completed a pre-consultation intake in their native language.\n"
        "Translate and summarize the medical information into concise, professional clinical English for the attending doctor.\n"
        "Return a valid JSON object with keys:\n"
        "- chief_complaint_english: string (translated patient symptoms and duration)\n"
        "- past_medical_history_english: string (chronic conditions, previous illnesses)\n"
        "- known_allergies_english: string (drug or food allergies)\n"
        "- current_medications_english: string (medications currently taken)\n"
        "- intake_summary_english: string (concise 2-sentence clinical briefing for the doctor)"
    )

    user_prompt = (
        f"Patient Language: {lang}\n"
        f"Chief Complaint: {complaint_raw} (Duration: {intake.symptoms_duration or 'Not specified'})\n"
        f"Past Medical History: {history_raw or 'None reported'}\n"
        f"Allergies: {allergies_raw or 'None'}\n"
        f"Current Medications: {meds_raw or 'None'}"
    )

    try:
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
        )
        data = json.loads(response.choices[0].message.content)
        return data
    except Exception as e:
        logger.warning(f"Live GPT-6 Luna intake translation fallback ({e})")
        return {
            "chief_complaint_english": complaint_raw or "General health consultation",
            "past_medical_history_english": history_raw or "None stated",
            "known_allergies_english": allergies_raw or "No known drug allergies",
            "current_medications_english": meds_raw or "None reported",
            "intake_summary_english": f"Patient presents with {complaint_raw or 'general health queries'}. Ready for doctor consultation.",
        }


@router.get("", response_model=List[PatientOut])
async def list_patients(
    q: Optional[str] = Query(None, description="Search query by name or phone number"),
    db: AsyncSession = Depends(get_db),
):
    """List and search patients."""
    stmt = select(Patient).order_by(Patient.created_at.desc())
    if q:
        query_clean = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Patient.name.ilike(query_clean),
                Patient.mobile_number.ilike(query_clean),
            )
        )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=PatientOut, status_code=201)
async def create_patient(
    patient_in: PatientCreate,
    db: AsyncSession = Depends(get_db),
):
    """Register a new patient."""
    patient = Patient(
        name=patient_in.name,
        age=patient_in.age,
        gender=patient_in.gender,
        date_of_birth=patient_in.date_of_birth,
        mobile_number=patient_in.mobile_number,
        preferred_language=patient_in.preferred_language,
        chief_complaint=patient_in.chief_complaint,
        symptoms_duration=patient_in.symptoms_duration,
        known_allergies=patient_in.known_allergies,
        current_medications=patient_in.current_medications,
        past_medical_history=patient_in.past_medical_history,
        intake_summary_english=patient_in.intake_summary_english,
    )
    db.add(patient)
    await db.commit()
    await db.refresh(patient)
    return patient


@router.post("/intake/validate", response_model=IntakeValidationResponse)
async def validate_intake_step(req: IntakeValidationRequest):
    """
    Validates a patient's spoken or typed answer to a conversational onboarding question.
    Uses AI (GPT-6 Luna) to extract the structured field cleanly and detect invalid/irrelevant responses.
    If the response is inappropriate (e.g. speaking symptoms when asked for name),
    returns is_valid=False with a polite localized reprompt.
    """
    clean_text = req.user_utterance.strip()
    if not clean_text:
        return IntakeValidationResponse(
            is_valid=False,
            extracted_value=None,
            parsed_fields={},
            reprompt_native="काहीही आवाज ऐकू आला नाही. कृपया पुन्हा बोला." if "mr" in req.language else "कोई आवाज़ नहीं सुनाई दी। कृपया दोबारा बोलें।",
            reprompt_english="No speech detected. Please speak again.",
        )

    # Fast-path for phone numbers (Low latency optimization)
    if req.step_id == "phone":
        digits = re.sub(r"\D", "", clean_text)
        if len(digits) >= 10:
            phone_val = digits[-10:]
            return IntakeValidationResponse(
                is_valid=True,
                extracted_value=phone_val,
                parsed_fields={"mobile_number": phone_val},
            )

    # Fast heuristic for 'name': detect if patient answered with symptoms/illness
    symptom_markers = [
        "taap", "ताप", "doke", "डोके", "dukh", "दुख", "pain", "fever", "headache",
        "bukhar", "बुखार", "dard", "दर्द", "khansi", "खांसी", "khokla", "खोकला",
        "sardi", "सर्दी", "potat", "पोटात", "vomit", "उलटी", "divas", "दिवस", "days",
        "pasun", "पासून", "kal", "काल", "yesterday", "since"
    ]
    lower_u = clean_text.lower()
    if req.step_id == "name" and any(m in lower_u for m in symptom_markers):
        is_mr = "mr" in req.language.lower()
        return IntakeValidationResponse(
            is_valid=False,
            extracted_value=None,
            parsed_fields={},
            reprompt_native="हे आपले लक्षण वाटते. कृपया आधी आपले पूर्ण नाव सांगा." if is_mr else "यह आपकी तकलीफ़ लग रही है। कृपया पहले अपना शुभ नाम बताएं।",
            reprompt_english="This seems like a symptom. Please tell me your full name first.",
        )

    client = get_openai_client(settings.OPENAI_API_KEY)

    system_prompt = (
        "You are Aarogya Mitra, an expert medical intake conversational AI in India.\n"
        "Your task: Validate whether the patient's utterance genuinely answers the requested intake question, "
        "and extract the clean, normalized value for the clinic form.\n"
        "Return a JSON object with:\n"
        "- is_valid: boolean\n"
        "- extracted_value: string or null (the clean, normalized value to put into the intake form, without conversational fluff)\n"
        "- parsed_fields: dict (e.g. {'name': '...'} or {'age': 35, 'gender': 'Male'} or {'mobile_number': '...'} or {'chief_complaint': '...', 'symptoms_duration': '...'})\n"
        "- reprompt_native: string or null (if is_valid is false, a gentle polite sentence in the patient's language asking them to answer the current question properly. E.g. if they stated symptoms when asked for their name, say that symptoms will be asked in a moment and ask them for their name now)\n"
        "- reprompt_english: string or null (English translation of reprompt_native)\n\n"
        "Guidelines by step_id:\n"
        "1. 'name': Expects a person's name. If user gives symptoms, illness, or non-name talk: is_valid=false. If name given, extract clean person name.\n"
        "2. 'age_gender': Expects age and/or gender. If unrelated: is_valid=false. If valid: extracted_value='<age> yrs • <Gender>', parsed_fields={'age': int, 'gender': str}.\n"
        "3. 'phone': Expects 10-digit mobile number. If valid: extracted_value='<10 digits>'. If invalid: is_valid=false, reprompt.\n"
        "4. 'complaint': Expects symptoms, duration, illness. If describing health problem: is_valid=true. Extract clean chief_complaint and symptoms_duration.\n"
        "5. 'history_allergies': Expects chronic medical history and/or allergies. Valid even if user says none/no. Extract past_medical_history and known_allergies.\n"
    )

    user_prompt = (
        f"Language: {req.language}\n"
        f"Step ID: {req.step_id}\n"
        f"Question Asked: {req.question_text}\n"
        f"Patient Utterance: {clean_text}"
    )

    try:
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
        )
        data = json.loads(response.choices[0].message.content)
        return IntakeValidationResponse(
            is_valid=data.get("is_valid", True),
            extracted_value=data.get("extracted_value"),
            parsed_fields=data.get("parsed_fields") or {},
            reprompt_native=data.get("reprompt_native"),
            reprompt_english=data.get("reprompt_english"),
        )
    except Exception as e:
        logger.warning(f"Intake validation fallback ({e})")
        return IntakeValidationResponse(
            is_valid=True,
            extracted_value=clean_text,
            parsed_fields={req.step_id: clean_text},
        )


@router.post("/intake", response_model=PatientOut, status_code=201)
async def complete_conversational_intake(
    intake_in: PatientIntakeSubmission,
    db: AsyncSession = Depends(get_db),
):
    """
    Submits answers from the Conversational AI Onboarding flow:
    1. Uses GPT-6 Luna to translate complaints, medical history, and allergies into doctor's language (English).
    2. Builds a structured clinical briefing.
    3. Auto-creates and registers the patient.
    """
    # Translate and summarize intake into English
    summary_data = await translate_and_summarize_intake(intake_in)

    patient = Patient(
        name=intake_in.name.strip(),
        age=intake_in.age,
        gender=intake_in.gender,
        mobile_number=intake_in.mobile_number.strip(),
        preferred_language=intake_in.preferred_language,
        chief_complaint=summary_data.get("chief_complaint_english") or intake_in.chief_complaint,
        symptoms_duration=intake_in.symptoms_duration,
        past_medical_history=summary_data.get("past_medical_history_english") or intake_in.past_medical_history,
        known_allergies=summary_data.get("known_allergies_english") or intake_in.known_allergies,
        current_medications=summary_data.get("current_medications_english") or intake_in.current_medications,
        intake_summary_english=summary_data.get("intake_summary_english"),
    )
    db.add(patient)
    await db.commit()
    await db.refresh(patient)
    logger.info(f"Registered patient {patient.name} via Conversational AI Onboarding in language {patient.preferred_language}.")
    return patient


@router.get("/{patient_id}", response_model=PatientOut)
async def get_patient(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve patient by ID."""
    stmt = select(Patient).where(Patient.id == patient_id)
    result = await db.execute(stmt)
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.patch("/{patient_id}", response_model=PatientOut)
async def update_patient(
    patient_id: str,
    patient_in: PatientUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update patient details."""
    stmt = select(Patient).where(Patient.id == patient_id)
    result = await db.execute(stmt)
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    update_data = patient_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)

    await db.commit()
    await db.refresh(patient)
    return patient


@router.get("/{patient_id}/consultations", response_model=List[ConsultationOut])
async def get_patient_consultations(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all consultations for a patient."""
    stmt = select(Consultation).where(Consultation.patient_id == patient_id).order_by(Consultation.started_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()
