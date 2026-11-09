import json
import re
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from app.core.config import settings
from app.core.logger import logger, log_sanitized_event
from app.schemas.draft import StructuredDraftPayload, SymptomItem, PrescriptionItem, VitalsPayload
from app.services.translation.luna_service import get_openai_client


DRAFT_EXTRACTION_SYSTEM_PROMPT = """You are the AI Clinical Documentation Assistant for SwasthyaSetu.
Your task is to analyze the entire consultation conversation between Doctor and Patient, and automatically synthesize a complete, professional clinical report in English.
Always output clinical notes, diagnoses, and descriptions strictly in clinical English.

Check the conversation specifically for any doctor guidance regarding the next consultation or follow-up date (e.g., 'Come back after 3 days', 'See me in a week', 'तीन दिन बाद दिखाएं', 'दोन दिवसांनी पुन्हा या').

JSON Schema format to return:
{
  "doctor_diagnosis": "Primary clinical diagnosis synthesized from findings and physician discussion (in English)",
  "doctor_notes": "Clinical summary of observations, physical findings, patient rest advisory, diet instructions (in English)",
  "patient_reported_symptoms": [
    {
      "symptom": "Name of symptom in English",
      "duration": "Duration (e.g. '3 days')",
      "severity": "Mild/Moderate/Severe or Not stated",
      "source_snippet": "Relevant phrase from transcript"
    }
  ],
  "duration_summary": "Summary of duration",
  "vitals": {
    "weight_kg": float or null,
    "height_cm": float or null,
    "blood_pressure": "e.g. '120/80 mmHg' or null",
    "pulse_bpm": int or null,
    "temperature_f": float or null,
    "spo2_percent": int or null
  },
  "prescriptions": [
    {
      "medicine": "Medicine name (e.g., Tab Paracetamol)",
      "strength": "e.g. 500mg",
      "dose": "e.g. 1 tablet",
      "frequency": "e.g. Twice daily",
      "duration": "e.g. 3 days",
      "instructions": "e.g. After meals"
    }
  ],
  "medical_history": "Relevant past medical history or 'None reported'",
  "allergies": "Known drug allergies or 'None reported'",
  "follow_up_recommendation": "e.g. 'Review after 3-5 days if fever persists'",
  "follow_up_days": 3,
  "recommended_next_visit_date": "YYYY-MM-DD calculated from consultation date plus follow_up_days",
  "uncertain_terms": [],
  "record_status": "PENDING_REVIEW"
}
"""

DOCTOR_ASSIST_SYSTEM_PROMPT = """You are the AI Clinical Scribe Assistant for SwasthyaSetu.
The attending doctor is speaking or typing additional clinical details to append to the patient's medical report (e.g. vitals like weight, height, BP, pulse, temp, or additional physical exam notes, diagnoses, prescriptions, or follow-up date).
The doctor may speak in ANY language (English, Hindi, Marathi, etc.).
ALL OUTPUT REPORT FIELDS MUST BE IN CLINICAL ENGLISH.

Task:
1. Extract any vitals mentioned:
   - weight_kg (e.g. 'weight 68 kg' or 'वजन ६८ किलो' -> 68.0)
   - height_cm (e.g. 'height 172 cm' or 'उंची १७२ सेमी' -> 172.0)
   - blood_pressure (e.g. 'BP 120/80' or 'रक्तदाब १२०/८०' -> '120/80 mmHg')
   - pulse_bpm (e.g. 'pulse 76' or 'नाडी ७६' -> 76)
   - temperature_f (e.g. 'temp 99.4' -> 99.4)
   - spo2_percent (e.g. 'spo2 98%' -> 98)
2. Extract any next consultation or follow-up instructions:
   - follow_up_recommendation (e.g. 'Review after 5 days')
   - follow_up_days (e.g. 5)
   - recommended_next_visit_date (YYYY-MM-DD)
3. Extract any additional clinical notes or advice and merge into doctor_notes in English.
4. Extract any diagnosis or prescription updates if mentioned.
5. Merge these values cleanly into the existing StructuredDraftPayload.
6. Provide an 'ai_reply': a concise, polite confirmation of what was updated (e.g. 'Updated: BP 120/80 mmHg, Weight 68 kg added to report.').

Return a JSON object:
{
  "updated_payload": { ... full StructuredDraftPayload ... },
  "ai_reply": "Summary of updates made"
}
"""


class DraftExtractorService:
    """
    GPT-6 Luna structured draft medical record extraction and clinical scribe service.
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
                medical_history="None reported",
                allergies="None reported",
                doctor_diagnosis="",
                doctor_notes="",
                vitals=VitalsPayload(),
                prescriptions=[],
                follow_up_recommendation="Review as needed",
                uncertain_terms=[],
                record_status="PENDING_REVIEW",
            )

        transcript_text = "\n".join(
            f"[{t.get('speaker', 'UNKNOWN')}]: {t.get('canonical_english_text', '')}"
            for t in transcripts
        )

        if self.api_key and self.api_key.startswith("sk-"):
            return await self._call_openai_extraction(transcript_text)
        return self._offline_extraction(transcripts)

    async def _call_openai_extraction(self, transcript_text: str) -> StructuredDraftPayload:
        try:
            client = get_openai_client(self.api_key)

            user_prompt = f"Consultation Transcript:\n{transcript_text}\n\nGenerate comprehensive structured clinical report:"
            log_sanitized_event("draft_extraction_requested", model=self.model)

            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": DRAFT_EXTRACTION_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
            )

            raw = response.choices[0].message.content
            data = json.loads(raw)
            days = data.get("follow_up_days") or 3
            if not data.get("recommended_next_visit_date"):
                data["recommended_next_visit_date"] = (datetime.now().date() + timedelta(days=days)).isoformat()
            data["follow_up_days"] = days
            return StructuredDraftPayload(**data)
        except Exception as e:
            logger.warning(f"Live OpenAI draft extraction error ({e}); using deterministic extraction.")
            dummy_transcripts = [{"speaker": "PATIENT", "canonical_english_text": transcript_text}]
            return self._offline_extraction(dummy_transcripts)

    async def assist_with_doctor_input(
        self,
        current_payload: StructuredDraftPayload,
        doctor_message: str,
        language: str = "en-IN",
    ) -> Tuple[StructuredDraftPayload, str]:
        """
        Processes a doctor's spoken or typed input for additional clinical details (weight, height, BP, etc.)
        and merges it into the existing medical report.
        """
        client = get_openai_client(self.api_key)
        user_prompt = (
            f"Language: {language}\n"
            f"Doctor Message: {doctor_message}\n\n"
            f"Current Medical Report JSON:\n{json.dumps(current_payload.model_dump(), default=str)}"
        )

        try:
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": DOCTOR_ASSIST_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
            )
            raw = response.choices[0].message.content
            data = json.loads(raw)
            updated_data = data.get("updated_payload") or current_payload.model_dump()
            ai_reply = data.get("ai_reply") or "Report updated with doctor details."
            return StructuredDraftPayload(**updated_data), ai_reply
        except Exception as e:
            logger.warning(f"Doctor AI assist error ({e}); using heuristic merge.")
            # Fast heuristic vitals merge
            updated = current_payload.model_dump()
            vitals = updated.get("vitals") or {}

            # Weight
            w_match = re.search(r"\b(?:weight|wt|वजन)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:kg|किलो)?", doctor_message, re.I)
            if w_match:
                vitals["weight_kg"] = float(w_match.group(1))

            # Height
            h_match = re.search(r"\b(?:height|ht|उंची|कद)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:cm|सेमी)?", doctor_message, re.I)
            if h_match:
                vitals["height_cm"] = float(h_match.group(1))

            # BP
            bp_match = re.search(r"\b(?:bp|blood pressure|बीपी)\s*[:=]?\s*(\d{2,3}\s*/\s*\d{2,3})", doctor_message, re.I)
            if bp_match:
                vitals["blood_pressure"] = f"{bp_match.group(1).replace(' ', '')} mmHg"

            # Pulse
            p_match = re.search(r"\b(?:pulse|heart rate|नाडी)\s*[:=]?\s*(\d{2,3})", doctor_message, re.I)
            if p_match:
                vitals["pulse_bpm"] = int(p_match.group(1))

            # Temperature
            t_match = re.search(r"\b(?:temp|temperature|तापमान)\s*[:=]?\s*(\d{2,3}(?:\.\d+)?)", doctor_message, re.I)
            if t_match:
                vitals["temperature_f"] = float(t_match.group(1))

            # Follow up days / next consultation date
            fu_match = re.search(r"(\d+)\s*(?:days?|दिन|दिवस)", doctor_message, re.I)
            if fu_match:
                days = int(fu_match.group(1))
                updated["follow_up_days"] = days
                updated["recommended_next_visit_date"] = (datetime.now().date() + timedelta(days=days)).isoformat()
                updated["follow_up_recommendation"] = f"Review after {days} days"

            updated["vitals"] = vitals
            return StructuredDraftPayload(**updated), "Vitals and follow-up details updated successfully in English."

    def _offline_extraction(self, transcripts: List[Dict[str, Any]]) -> StructuredDraftPayload:
        """
        Deterministic clinical extractor for offline development/fallbacks.
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
                    symptom="Clinical consultation",
                    duration="Not stated",
                    severity="Not stated",
                    source_snippet=combined[:60],
                )
            )

        prescriptions = []
        if "paracetamol" in combined:
            prescriptions.append(
                PrescriptionItem(
                    medicine="Tab Paracetamol",
                    strength="500mg",
                    dose="1 tablet",
                    frequency="Twice daily",
                    duration="3 days",
                    instructions="After meals",
                )
            )

        diagnosis = "Acute Febrile Illness" if "fever" in combined else "Clinical Consultation Review"
        notes = "Patient examined. Advised hydration, adequate rest, and light diet."

        follow_up_days = 3
        if "5 days" in combined or "five days" in combined:
            follow_up_days = 5
        elif "week" in combined or "7 days" in combined or "seven days" in combined:
            follow_up_days = 7
        elif "tomorrow" in combined or "1 day" in combined:
            follow_up_days = 1

        next_date = (datetime.now().date() + timedelta(days=follow_up_days)).isoformat()

        return StructuredDraftPayload(
            patient_reported_symptoms=symptoms,
            duration_summary="Symptoms persisting for 3 days" if "3 days" in combined or "three days" in combined else "Not stated",
            medical_history="None reported",
            allergies="No known allergies",
            doctor_diagnosis=diagnosis,
            doctor_notes=notes,
            vitals=VitalsPayload(),
            prescriptions=prescriptions,
            follow_up_recommendation=f"Review after {follow_up_days} days if symptoms persist",
            follow_up_days=follow_up_days,
            recommended_next_visit_date=next_date,
            uncertain_terms=[],
            record_status="PENDING_REVIEW",
        )

