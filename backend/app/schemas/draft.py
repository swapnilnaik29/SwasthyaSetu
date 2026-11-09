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


class StructuredDraftPayload(BaseModel):
    patient_reported_symptoms: List[SymptomItem] = []
    duration_summary: Optional[str] = None
    medical_history: Optional[str] = "Not stated in the conversation"
    allergies: Optional[str] = "Not stated"
    doctor_diagnosis: Optional[str] = "Not specified; doctor to enter or confirm"
    prescriptions: List[PrescriptionItem] = []
    follow_up_recommendation: Optional[str] = "Pending doctor input"
    uncertain_terms: List[str] = []
    record_status: str = "PENDING_REVIEW"


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
