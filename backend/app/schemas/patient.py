from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict
import re


class PatientCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    age: Optional[int] = Field(None, ge=0, le=130)
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    mobile_number: str = Field(..., min_length=10, max_length=15)
    preferred_language: str = Field(default="hi-IN")
    chief_complaint: Optional[str] = None
    symptoms_duration: Optional[str] = None
    known_allergies: Optional[str] = None
    current_medications: Optional[str] = None
    past_medical_history: Optional[str] = None
    intake_summary_english: Optional[str] = None

    @field_validator("mobile_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        clean = re.sub(r"[\s\-\(\)]", "", v)
        if not re.match(r"^(\+91|91)?[6-9]\d{9}$", clean):
            # allow standard format for demo if 10 digits
            if not (len(clean) >= 10 and clean[-10:].isdigit()):
                raise ValueError("Invalid Indian mobile number format")
        return clean


class PatientUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    age: Optional[int] = Field(None, ge=0, le=130)
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    mobile_number: Optional[str] = None
    preferred_language: Optional[str] = None
    chief_complaint: Optional[str] = None
    symptoms_duration: Optional[str] = None
    known_allergies: Optional[str] = None
    current_medications: Optional[str] = None
    past_medical_history: Optional[str] = None
    intake_summary_english: Optional[str] = None


class PatientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    mobile_number: str
    preferred_language: str
    chief_complaint: Optional[str] = None
    symptoms_duration: Optional[str] = None
    known_allergies: Optional[str] = None
    current_medications: Optional[str] = None
    past_medical_history: Optional[str] = None
    intake_summary_english: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class PatientIntakeSubmission(BaseModel):
    name: str = Field(..., min_length=2)
    age: Optional[int] = None
    gender: Optional[str] = None
    mobile_number: str = Field(..., min_length=10)
    preferred_language: str = Field(default="hi-IN")
    chief_complaint: Optional[str] = None
    symptoms_duration: Optional[str] = None
    past_medical_history: Optional[str] = None
    known_allergies: Optional[str] = None
    current_medications: Optional[str] = None
    raw_responses: Optional[Dict[str, Any]] = None


class IntakeValidationRequest(BaseModel):
    step_id: str  # "name", "age_gender", "phone", "complaint", "history_allergies"
    question_text: str
    user_utterance: str
    language: str = "hi-IN"


class IntakeValidationResponse(BaseModel):
    is_valid: bool
    extracted_value: Optional[str] = None
    parsed_fields: Dict[str, Any] = Field(default_factory=dict)
    reprompt_native: Optional[str] = None
    reprompt_english: Optional[str] = None
