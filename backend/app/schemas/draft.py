from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, model_validator


class SymptomItem(BaseModel):
    model_config = ConfigDict(extra="allow")

    symptom: str
    duration: str = "Not stated"
    severity: Optional[str] = None
    source_snippet: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_symptom(cls, data: Any) -> Any:
        if isinstance(data, str):
            return {"symptom": data, "duration": "Not stated"}
        if not isinstance(data, dict):
            return data
        d = dict(data)
        symptom_val = (
            d.get("symptom")
            or d.get("name")
            or d.get("symptom_name")
            or d.get("complaint")
            or d.get("description")
        )
        if not symptom_val:
            symptom_val = "Unspecified symptom"
        d["symptom"] = str(symptom_val)
        if not d.get("duration"):
            d["duration"] = "Not stated"
        return d


class PrescriptionItem(BaseModel):
    model_config = ConfigDict(extra="allow")

    medicine: str
    strength: Optional[str] = None
    dose: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    instructions: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_prescription(cls, data: Any) -> Any:
        if isinstance(data, str):
            return {"medicine": data}
        if not isinstance(data, dict):
            return data
        d = dict(data)
        med_val = (
            d.get("medicine")
            or d.get("medication")
            or d.get("name")
            or d.get("drug")
            or d.get("medicine_name")
            or d.get("item")
        )
        if not med_val:
            med_val = "Prescribed Medication"
        d["medicine"] = str(med_val)
        if not d.get("dose") and d.get("dosage"):
            d["dose"] = str(d["dosage"])
        if not d.get("instructions") and d.get("route"):
            d["instructions"] = f"Route: {d['route']}"
        return d


class VitalsPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    weight_kg: Optional[float] = None
    weight: Optional[Any] = None
    height_cm: Optional[float] = None
    height: Optional[Any] = None
    blood_pressure: Optional[str] = None  # e.g. "120/80 mmHg"
    bp: Optional[str] = None
    pulse_bpm: Optional[int] = None
    pulse: Optional[Any] = None
    temperature_f: Optional[float] = None
    temperature: Optional[Any] = None
    temp: Optional[Any] = None
    spo2_percent: Optional[int] = None
    spo2: Optional[Any] = None
    bmi: Optional[Any] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_vitals(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        d = dict(data)
        import re

        # Blood pressure
        bp_val = d.get("blood_pressure") or d.get("bp")
        if bp_val is not None:
            clean_bp = str(bp_val).strip()
            d["blood_pressure"] = clean_bp
            d["bp"] = clean_bp

        # Pulse / Heart rate
        p_val = d.get("pulse_bpm") or d.get("pulse") or d.get("heart_rate")
        if p_val is not None:
            digits = re.findall(r"\d+", str(p_val))
            if digits:
                d["pulse_bpm"] = int(digits[0])
                d["pulse"] = f"{digits[0]} bpm"

        # Temperature
        t_val = d.get("temperature_f") or d.get("temperature") or d.get("temp")
        if t_val is not None:
            nums = re.findall(r"\d+(?:\.\d+)?", str(t_val))
            if nums:
                d["temperature_f"] = float(nums[0])
                d["temperature"] = f"{nums[0]} °F"

        # Weight
        w_val = d.get("weight_kg") or d.get("weight") or d.get("wt")
        if w_val is not None:
            nums = re.findall(r"\d+(?:\.\d+)?", str(w_val))
            if nums:
                d["weight_kg"] = float(nums[0])
                d["weight"] = f"{nums[0]} kg"

        # Height
        h_val = d.get("height_cm") or d.get("height") or d.get("ht")
        if h_val is not None:
            nums = re.findall(r"\d+(?:\.\d+)?", str(h_val))
            if nums:
                d["height_cm"] = float(nums[0])
                d["height"] = f"{nums[0]} cm"

        # SpO2
        s_val = d.get("spo2_percent") or d.get("spo2")
        if s_val is not None:
            digits = re.findall(r"\d+", str(s_val))
            if digits:
                d["spo2_percent"] = int(digits[0])
                d["spo2"] = f"{digits[0]}%"

        # BMI
        if not d.get("bmi") and d.get("weight_kg") and d.get("height_cm"):
            try:
                w = float(d["weight_kg"])
                h = float(d["height_cm"]) / 100.0
                if h > 0:
                    d["bmi"] = f"{round(w / (h * h), 1)}"
            except Exception:
                pass

        return d


class StructuredDraftPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    patient_reported_symptoms: List[SymptomItem] = []
    duration_summary: Optional[str] = None
    medical_history: Optional[str] = None
    allergies: Optional[str] = None
    doctor_diagnosis: Optional[str] = None
    doctor_notes: Optional[str] = None
    vitals: Optional[VitalsPayload] = None
    prescriptions: List[PrescriptionItem] = []
    follow_up_recommendation: Optional[str] = None
    follow_up_days: Optional[int] = 3
    recommended_next_visit_date: Optional[str] = None
    uncertain_terms: List[str] = []
    record_status: str = "PENDING_REVIEW"

    @model_validator(mode="before")
    @classmethod
    def normalize_payload(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        d = dict(data)
        if not d.get("patient_reported_symptoms") and d.get("symptoms"):
            d["patient_reported_symptoms"] = d["symptoms"]
        return d


class DoctorAIAssistRequest(BaseModel):
    message: Optional[str] = None
    doctor_utterance: Optional[str] = None
    language: Optional[str] = "en-IN"
    doctor_language: Optional[str] = None

    @property
    def clean_message(self) -> str:
        return (self.message or self.doctor_utterance or "").strip()

    @property
    def clean_language(self) -> str:
        return (self.language or self.doctor_language or "en-IN").strip()


class DoctorAIAssistResponse(BaseModel):
    updated_payload: StructuredDraftPayload
    ai_reply: str


class MedicalReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    consultation_id: str
    patient_id: str
    patient_name: str
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    patient_phone: Optional[str] = None
    patient_language: Optional[str] = None
    chief_complaint: Optional[str] = None
    past_medical_history: Optional[str] = None
    known_allergies: Optional[str] = None
    date: datetime
    doctor_name: Optional[str] = "Dr. Priya Sharma"
    doctor_credentials: Optional[str] = "MBBS, MD"
    status: str  # "APPROVED" or "DRAFT"
    doctor_diagnosis: Optional[str] = None
    doctor_notes: Optional[str] = None
    vitals: Optional[VitalsPayload] = None
    symptoms: List[SymptomItem] = []
    prescriptions: List[PrescriptionItem] = []
    follow_up_recommendation: Optional[str] = None
    follow_up_days: Optional[int] = None
    recommended_next_visit_date: Optional[str] = None
    medical_history: Optional[str] = None
    allergies: Optional[str] = None


class DraftOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    consultation_id: str
    structured_payload: StructuredDraftPayload
    status: str
    created_at: datetime
    updated_at: datetime


class DraftUpdate(BaseModel):
    structured_payload: StructuredDraftPayload


class ClinicalRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    consultation_id: str
    approved_payload: StructuredDraftPayload
    approved_by: str
    approved_at: datetime
    created_at: datetime
