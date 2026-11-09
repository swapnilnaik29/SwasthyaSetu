from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class SymptomItem(BaseModel):
    symptom: str
    duration: str = "Not stated"
    severity: Optional[str] = None
    source_snippet: Optional[str] = None


class PrescriptionItem(BaseModel):
    medicine: str
    strength: Optional[str] = None
    dose: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    instructions: Optional[str] = None


class VitalsPayload(BaseModel):
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    blood_pressure: Optional[str] = None  # e.g. "120/80 mmHg"
    pulse_bpm: Optional[int] = None
    temperature_f: Optional[float] = None
    spo2_percent: Optional[int] = None


class StructuredDraftPayload(BaseModel):
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


class DoctorAIAssistRequest(BaseModel):
    message: str  # Dictated or typed message from doctor with vitals or notes
    language: Optional[str] = "en-IN"


class DoctorAIAssistResponse(BaseModel):
    updated_payload: StructuredDraftPayload
    ai_reply: str


class MedicalReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    consultation_id: str
    patient_id: str
    patient_name: str
    date: datetime
    doctor_name: Optional[str] = "Dr. Priya Sharma"
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
