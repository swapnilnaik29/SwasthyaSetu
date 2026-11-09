import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.db.session import get_db
from app.models.patient import Patient
from app.models.consultation import Consultation
from app.schemas.patient import PatientCreate, PatientUpdate, PatientOut, PatientIntakeSubmission
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
