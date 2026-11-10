import json
import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.db.session import get_db
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.consultation import Consultation
from app.models.clinical_record import ClinicalRecord
from app.models.consultation_draft import ConsultationDraft
from app.api.routes.doctor import get_or_create_default_doctor
from app.schemas.patient import (
    PatientCreate,
    PatientUpdate,
    PatientOut,
    PatientIntakeSubmission,
    IntakeValidationRequest,
    IntakeValidationResponse,
)
from app.schemas.consultation import ConsultationOut
from app.schemas.draft import MedicalReportOut, StructuredDraftPayload
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
            "chief_complaint_english": complaint_raw or "",
            "past_medical_history_english": history_raw or "",
            "known_allergies_english": allergies_raw or "",
            "current_medications_english": meds_raw or "",
            "intake_summary_english": f"Patient presents with: {complaint_raw or 'symptoms reported during intake'}. Ready for doctor consultation.",
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
    """
    Register a new patient and canonicalize all clinical intake fields to English
    for consistent database persistence and international healthcare reporting.
    """
    from app.services.translation.sarvam_service import SarvamTranslationService
    complaint_en = patient_in.chief_complaint or ""
    history_en = patient_in.past_medical_history or ""
    allergies_en = patient_in.known_allergies or "None"
    meds_en = patient_in.current_medications or "None"
    summary_en = patient_in.intake_summary_english or ""
    name_en = patient_in.name

    # If intake was spoken/typed in Marathi, Hindi, or contains non-ASCII characters, canonicalize to English
    if (patient_in.preferred_language and patient_in.preferred_language != "en-IN") or any(ord(c) > 127 for c in (patient_in.name + (patient_in.chief_complaint or ""))):
        try:
            intake_sub = PatientIntakeSubmission(
                patient_name=patient_in.name,
                preferred_language=patient_in.preferred_language or "hi-IN",
                chief_complaint=patient_in.chief_complaint,
                symptoms_duration=patient_in.symptoms_duration,
                past_medical_history=patient_in.past_medical_history,
                known_allergies=patient_in.known_allergies,
                current_medications=patient_in.current_medications,
            )
            trans_data = await translate_and_summarize_intake(intake_sub)
            complaint_en = trans_data.get("chief_complaint_english") or complaint_en
            history_en = trans_data.get("past_medical_history_english") or history_en
            allergies_en = trans_data.get("known_allergies_english") or allergies_en
            meds_en = trans_data.get("current_medications_english") or meds_en
            summary_en = trans_data.get("intake_summary_english") or summary_en

            if any(ord(c) > 127 for c in patient_in.name):
                sarvam = SarvamTranslationService()
                name_trans = await sarvam.translate(patient_in.name, target_lang="en-IN", source_lang=patient_in.preferred_language or "hi-IN")
                if name_trans.strip():
                    name_en = name_trans.strip()
        except Exception as e:
            logger.warning(f"Error canonicalizing intake to English: {e}")

    patient = Patient(
        name=name_en,
        age=patient_in.age,
        gender=patient_in.gender,
        date_of_birth=patient_in.date_of_birth,
        mobile_number=patient_in.mobile_number,
        preferred_language=patient_in.preferred_language,
        chief_complaint=complaint_en,
        symptoms_duration=patient_in.symptoms_duration,
        known_allergies=allergies_en,
        current_medications=meds_en,
        past_medical_history=history_en,
        intake_summary_english=summary_en or f"Patient presents with: {complaint_en}. Ready for doctor consultation.",
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

    # Low-latency fast-path for pure 10-digit numbers (only if already clean digits)
    if req.step_id == "phone":
        raw_digits = re.sub(r"\D", "", clean_text)
        if len(raw_digits) == 10 and (clean_text.isdigit() or raw_digits == clean_text):
            return IntakeValidationResponse(
                is_valid=True,
                extracted_value=raw_digits,
                parsed_fields={"mobile_number": raw_digits, "phone": raw_digits},
            )

    # Convert Devanagari numerals if present for age extraction
    devanagari_digits = "०१२३४५६७८९"
    normalized_text = clean_text
    for i, d in enumerate(devanagari_digits):
        normalized_text = normalized_text.replace(d, str(i))

    # Fast-path for age & gender in any sequence (e.g. "स्त्री २८", "२८ वर्षे स्त्री", "Male 42", "42 yrs Male")
    if req.step_id == "age_gender":
        age_match = re.search(r"\b([1-9]\d?|1[01]\d)\b", normalized_text)
        is_female = re.search(r"(female|woman|girl|स्त्री|महिला|बाई|लड़की|aurat|fem)", normalized_text, re.IGNORECASE)
        is_male = re.search(r"(?:^|[^\w])(male|man|boy)(?:[^\w]|$)|(?:पुरुष|माणूस|लड़का|aadmi)", normalized_text, re.IGNORECASE)

        gender_val = "Female" if is_female else ("Male" if is_male else None)
        age_val = int(age_match.group(1)) if age_match else None

        if age_val is not None and gender_val is not None:
            return IntakeValidationResponse(
                is_valid=True,
                extracted_value=f"{age_val} yrs • {gender_val}",
                parsed_fields={"age": age_val, "gender": gender_val},
            )

    # Fast heuristic for 'name': detect if patient answered with symptoms/illness
    symptom_markers = [
        "taap", "ताप", "doke", "डोके", "dukh", "दुख", "pain", "fever", "headache",
        "bukhar", "बुखार", "dard", "दर्द", "khansi", "खांसी", "khokla", "खोकला",
        "sardi", "सर्दी", "pot", "पोट", "vomit", "उलटी", "divas", "दिवस", "days",
        "pasun", "पासून", "kal", "काल", "yesterday", "since", "tras", "त्रास",
        "trass", "angdukhi", "kamre", "कमर", "chakkar", "चक्कर", "bimar", "बीमार",
        "taklif", "तकलीफ", "cough", "cold", "chhati", "छाती", "ultee", "kamjori",
        "kamzori", "ashaktapana", "कमजोरी", "mala", "मला", "mujhe", "मुझे",
        "teen", "तीन", "chaar", "चार", "don", "दोन", "ek", "एक", "mahina", "महिना"
    ]
    sentence_markers = ["ahe", "aahe", "आहे", "hai", "है", "hoto", "hoti", "hote", "tha", "thi", "suffering", "having"]
    lower_u = clean_text.lower()
    if req.step_id == "name":
        is_symptom = any(m in lower_u for m in symptom_markers)
        is_sentence = len(clean_text.split()) >= 4 and any(sm in lower_u for sm in sentence_markers)
        if is_symptom or is_sentence:
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
        "You are Aarogya Mitra, an expert medical intake conversational AI for clinics and hospitals across India.\n"
        "Your task: Validate whether the patient's utterance genuinely answers the requested intake question, "
        "and return either a corrected formatted response or a wrong response reprompt.\n\n"
        "Strict Guidelines by step_id:\n"
        "1. 'name':\n"
        "   - Expects patient's personal full name.\n"
        "   - Patient may include conversational filler like 'माझे नाव ... आहे', 'मेरा नाम ... है', 'I am ...'.\n"
        "   - Extract ONLY the clean, properly capitalized person's name.\n"
        "   - If the patient speaks medical symptoms, illness, complaints, pain, or non-name talk: is_valid=false with a reprompt in patient's language asking for their name first.\n\n"
        "2. 'age_gender':\n"
        "   - Expects age and gender in ANY sequence (e.g. 'स्त्री २८', '२८ वर्षे स्त्री', 'Male 42', '42 yrs Male', 'female 30').\n"
        "   - Age can be in digits or spoken in words in ANY language (e.g. 'twenty eight', 'अठ्ठावीस', 'सत्ताईस', 'पचास').\n"
        "   - Gender MUST strictly be 'Male' or 'Female' ONLY (never 'Other', never 'Unknown').\n"
        "   - If BOTH age and gender are present: is_valid=true, extracted_value='<age> yrs • <Gender>', parsed_fields={'age': int, 'gender': 'Male'|'Female'}.\n"
        "   - If ONLY age or ONLY gender or neither is present: is_valid=false, extracted_value=null, and provide a polite reprompt_native in patient's language asking for the missing detail.\n\n"
        "3. 'phone':\n"
        "   - Expects a 10-digit mobile number.\n"
        "   - CRITICAL: The patient can speak the phone number in English words (e.g. 'nine eight two two zero one two three four five', 'double nine...'), in Marathi words ('नऊ आठ दोन दोन...'), in Hindi words ('नौ आठ सात छह...'), in digits ('9822012345', '९८२२०१२३४५'), or in mixed conversational phrases ('माझा नंबर आहे nine eight...', 'phone number 9876543210').\n"
        "   - Convert all spoken number words in any language into standard Arabic digits (0-9).\n"
        "   - If exactly 10 digits are extracted: is_valid=true, extracted_value='<10 digits>', parsed_fields={'mobile_number': '<10 digits>', 'phone': '<10 digits>'}.\n"
        "   - If not 10 digits or irrelevant utterance: is_valid=false, extracted_value=null, and provide a polite reprompt_native in the patient's language asking them to speak their 10-digit mobile number.\n\n"
        "4. 'complaint':\n"
        "   - Expects health problem, symptoms, and duration.\n"
        "   - If describing a medical problem: is_valid=true, extracted_value='clean summary', parsed_fields={'chief_complaint': '...', 'symptoms_duration': '...'}.\n"
        "   - If irrelevant: is_valid=false with reprompt.\n\n"
        "5. 'history_allergies':\n"
        "   - Expects chronic conditions (BP, Diabetes, Asthma, etc.) and/or allergies.\n"
        "   - If patient says none/no (e.g. 'काही नाही', 'नहीं', 'none'): is_valid=true, extracted_value='No chronic illness • No allergies', parsed_fields={'past_medical_history': 'None reported', 'known_allergies': 'None'}.\n"
        "   - If conditions or allergies stated: is_valid=true, extracted_value='<summary>', parsed_fields={'past_medical_history': '...', 'known_allergies': '...'}.\n\n"
        "6. DO NOT invent or fabricate default mock values under any circumstances.\n\n"
        "Return a JSON object with keys:\n"
        "- is_valid: boolean\n"
        "- extracted_value: string or null (the clean corrected format response to put into the clinic form)\n"
        "- parsed_fields: dict (the extracted structured fields)\n"
        "- reprompt_native: string or null (polite re-ask sentence in patient's language if is_valid is false)\n"
        "- reprompt_english: string or null (English translation of reprompt_native)"
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
        parsed_fields = data.get("parsed_fields") or {}
        extracted_val = data.get("extracted_value")

        if req.step_id == "phone":
            if "phone" in parsed_fields and "mobile_number" not in parsed_fields:
                parsed_fields["mobile_number"] = parsed_fields["phone"]
            if extracted_val and "mobile_number" not in parsed_fields:
                digits_only = re.sub(r"\D", "", str(extracted_val))
                if len(digits_only) >= 10:
                    parsed_fields["mobile_number"] = digits_only[-10:]

        if req.step_id == "name":
            val_str = str(extracted_val or "").lower()
            if any(m in val_str for m in symptom_markers) or len(val_str.split()) > 3:
                is_mr = "mr" in req.language.lower()
                return IntakeValidationResponse(
                    is_valid=False,
                    extracted_value=None,
                    parsed_fields={},
                    reprompt_native=data.get("reprompt_native") or ("हे आपले लक्षण वाटते. कृपया आधी आपले पूर्ण नाव सांगा." if is_mr else "यह आपकी तकलीफ़ लग रही है। कृपया पहले अपना शुभ नाम बताएं।"),
                    reprompt_english=data.get("reprompt_english") or "This seems like a symptom. Please tell me your full name first.",
                )

        return IntakeValidationResponse(
            is_valid=data.get("is_valid", True),
            extracted_value=extracted_val,
            parsed_fields=parsed_fields,
            reprompt_native=data.get("reprompt_native"),
            reprompt_english=data.get("reprompt_english"),
        )
    except Exception as e:
        logger.warning(f"Intake validation fallback ({e})")
        is_mr = "mr" in req.language.lower()
        if req.step_id == "name":
            # Guard against symptom speech or non-name phrases during fallback
            if any(m in lower_u for m in symptom_markers) or len(clean_text.split()) > 4:
                return IntakeValidationResponse(
                    is_valid=False,
                    extracted_value=None,
                    parsed_fields={},
                    reprompt_native="हे आपले लक्षण वाटते. कृपया आधी आपले पूर्ण नाव सांगा." if is_mr else "यह आपकी तकलीफ़ लग रही है। कृपया पहले अपना शुभ नाम बताएं।",
                    reprompt_english="This seems like a symptom. Please tell me your full name first.",
                )
            # Clean common conversational filler
            name_clean = re.sub(r"^(?:माझे नाव|माझं नाव|मेरा नाम|नाम|i am|my name is)\s*", "", clean_text, flags=re.IGNORECASE)
            name_clean = re.sub(r"\s*(?:आहे|है|boltoy|bolte|speaking)$", "", name_clean, flags=re.IGNORECASE).strip()
            return IntakeValidationResponse(
                is_valid=True,
                extracted_value=name_clean or clean_text,
                parsed_fields={"name": name_clean or clean_text},
            )
        if req.step_id == "age_gender":
            return IntakeValidationResponse(
                is_valid=False,
                extracted_value=None,
                parsed_fields={},
                reprompt_native="कृपया आपले वय आणि लिंग पुन्हा सांगा." if is_mr else "कृपया अपनी उम्र और लिंग दोबारा बताएं।",
                reprompt_english="Please repeat your age and gender.",
            )
        if req.step_id == "phone":
            digits = re.sub(r"\D", "", clean_text)
            if len(digits) >= 10:
                p10 = digits[-10:]
                return IntakeValidationResponse(
                    is_valid=True,
                    extracted_value=p10,
                    parsed_fields={"mobile_number": p10, "phone": p10},
                )
            return IntakeValidationResponse(
                is_valid=False,
                extracted_value=None,
                parsed_fields={},
                reprompt_native="कृपया १० अंकी मोबाईल नंबर सांगा." if is_mr else "कृपया 10 अंकों का मोबाइल नंबर बताएं।",
                reprompt_english="Please provide a valid 10-digit mobile number.",
            )
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


@router.get("/{patient_id}/reports", response_model=List[MedicalReportOut])
async def get_patient_reports(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch all medical reports for a patient:
    Includes approved clinical records and pending consultation drafts with vitals,
    diagnoses, clinical notes, and prescriptions.
    """
    patient = await db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    stmt = (
        select(Consultation)
        .where(Consultation.patient_id == patient_id)
        .order_by(Consultation.started_at.desc())
    )
    result = await db.execute(stmt)
    consultations = result.scalars().all()

    reports = []
    for c in consultations:
        stmt_rec = select(ClinicalRecord).where(ClinicalRecord.consultation_id == c.id)
        res_rec = await db.execute(stmt_rec)
        rec = res_rec.scalar_one_or_none()

        stmt_draft = select(ConsultationDraft).where(ConsultationDraft.consultation_id == c.id)
        res_draft = await db.execute(stmt_draft)
        draft = res_draft.scalar_one_or_none()

        payload = None
        status = "DRAFT"
        if rec and rec.approved_payload:
            payload = rec.approved_payload
            status = "APPROVED"
        elif draft and draft.structured_payload:
            payload = draft.structured_payload
            status = draft.status or "DRAFT"

        if payload:
            try:
                structured = StructuredDraftPayload(**payload)
                # Look up doctor matching settings/consultation
                doc = None
                if rec and rec.approved_by:
                    doc = await db.get(Doctor, rec.approved_by)
                if not doc and c.doctor_id:
                    doc = await db.get(Doctor, c.doctor_id)
                if not doc:
                    doc = await get_or_create_default_doctor(db)
                actual_doctor_name = doc.name if doc else "Dr. Priya Sharma"

                reports.append(
                    MedicalReportOut(
                        consultation_id=c.id,
                        patient_id=patient.id,
                        patient_name=patient.name,
                        date=c.started_at,
                        doctor_name=actual_doctor_name,
                        status=status,
                        doctor_diagnosis=structured.doctor_diagnosis,
                        doctor_notes=structured.doctor_notes,
                        vitals=structured.vitals,
                        symptoms=structured.patient_reported_symptoms,
                        prescriptions=structured.prescriptions,
                        follow_up_recommendation=structured.follow_up_recommendation,
                        follow_up_days=structured.follow_up_days,
                        recommended_next_visit_date=structured.recommended_next_visit_date,
                        medical_history=structured.medical_history,
                        allergies=structured.allergies,
                    )
                )
            except Exception as e:
                logger.warning(f"Failed to serialize report for consultation {c.id}: {e}")

    return reports
