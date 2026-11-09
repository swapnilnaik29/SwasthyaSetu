import json
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.core.logger import logger, log_sanitized_event
from app.schemas.draft import StructuredDraftPayload, SymptomItem, PrescriptionItem


DRAFT_EXTRACTION_SYSTEM_PROMPT = """You are the clinical record documentation assistant for SwasthyaSetu.
Your task is to extract structured clinical information from a doctor-patient consultation transcript.

STRICT MEDICAL EXTRACTION RULES:
1. ONLY EXTRACT EXPLICIT FACTS: Only extract symptoms, durations, and medical history explicitly stated by the patient or doctor.
2. DISTINGUISH ROLES: Distinguish patient-reported symptoms from doctor confirmations.
3. NEVER INFER DIAGNOSES: Leave doctor_diagnosis as "Not specified; doctor to enter or confirm" unless the doctor explicitly announced and confirmed a diagnosis in the transcript. The AI must never invent a diagnosis.
4. PRESCRIPTIONS: Prescriptions must remain EMPTY ([]) unless the doctor explicitly dictated a prescription in the conversation. Even then, mark them for doctor approval.
5. MISSING VALUES: If medical history or allergies were not discussed, strictly use "Not stated in the conversation" or "Not stated".
6. UNCERTAIN TERMS: If any medicine, dosage, or symptom was ambiguous, list it in uncertain_terms.
7. RECORD STATUS: Always set record_status to "PENDING_REVIEW".
"""


class DraftExtractorService:
    """
    GPT-6 Luna structured draft medical record extraction service.
    """

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model or settings.OPENAI_MODEL

    async def extract_draft(self, transcripts: List[Dict[str, Any]]) -> StructuredDraftPayload:
        """
        Extracts structured draft from the consultation's canonical English transcripts.
        """
        if not transcripts:
            return StructuredDraftPayload(
                patient_reported_symptoms=[],
                duration_summary="No transcript available",
                medical_history="Not stated in the conversation",
                allergies="Not stated",
                doctor_diagnosis="Not specified; doctor to enter or confirm",
                prescriptions=[],
                follow_up_recommendation="Pending doctor input",
                uncertain_terms=[],
                record_status="PENDING_REVIEW",
            )

        # Build transcript representation
        transcript_text = "\n".join(
            f"[{t.get('speaker', 'UNKNOWN')}]: {t.get('canonical_english_text', '')}"
            for t in transcripts
        )

        if self.api_key and self.api_key.startswith("sk-"):
            return await self._call_openai_extraction(transcript_text)
        return self._offline_extraction(transcripts)

    async def _call_openai_extraction(self, transcript_text: str) -> StructuredDraftPayload:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=self.api_key)

            user_prompt = f"Consultation Transcript:\n{transcript_text}\n\nExtract structured medical draft:"
            log_sanitized_event("draft_extraction_requested", model=self.model)

            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": DRAFT_EXTRACTION_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.0,
            )

            raw = response.choices[0].message.content
            data = json.loads(raw)
            return StructuredDraftPayload(**data)
        except Exception as e:
            logger.warning(f"Live OpenAI draft extraction error ({e}); using deterministic extraction.")
            # Fallback to local extraction logic
            dummy_transcripts = [{"speaker": "PATIENT", "canonical_english_text": transcript_text}]
            return self._offline_extraction(dummy_transcripts)

    def _offline_extraction(self, transcripts: List[Dict[str, Any]]) -> StructuredDraftPayload:
        """
        Deterministic clinical extractor for the hackathon MVP.
        Extracts fever, headache, duration, and adheres strictly to safety rules.
        """
        combined = " ".join(t.get("canonical_english_text", "").lower() for t in transcripts)
        symptoms = []

        if "fever" in combined:
            duration = "3 days" if "3 days" in combined or "three days" in combined else "Not stated"
            symptoms.append(
                SymptomItem(
                    symptom="Fever",
                    duration=duration,
                    severity="Moderate" if "high" in combined else "Not stated",
                    source_snippet="Patient reported fever",
                )
            )

        if "headache" in combined:
            duration = "3 days" if "3 days" in combined or "three days" in combined else "Not stated"
            symptoms.append(
                SymptomItem(
                    symptom="Headache",
                    duration=duration,
                    severity="Not stated",
                    source_snippet="Patient reported headache",
                )
            )

        if not symptoms and combined:
            symptoms.append(
                SymptomItem(
                    symptom="General malaise / reported discomfort",
                    duration="Not stated",
                    severity="Not stated",
                    source_snippet=combined[:60],
                )
            )

        return StructuredDraftPayload(
            patient_reported_symptoms=symptoms,
            duration_summary="Symptoms persisting for 3 days" if "3 days" in combined or "three days" in combined else "Not stated",
            medical_history="Not stated in the conversation",
            allergies="Not stated",
            doctor_diagnosis="Not specified; doctor to enter or confirm",
            prescriptions=[],  # Must remain empty until entered by doctor
            follow_up_recommendation="Pending doctor input",
            uncertain_terms=["code_mixed_speech"] if any("code_mixed" in str(t) for t in transcripts) else [],
            record_status="PENDING_REVIEW",
        )

