from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict
import re


class PatientCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    age: Optional[int] = Field(None, ge=0, le=130)
    date_of_birth: Optional[str] = None
    mobile_number: str = Field(..., min_length=10, max_length=15)
    preferred_language: str = Field(default="hi-IN", pattern="^(en-IN|hi-IN|mr-IN)$")

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
    date_of_birth: Optional[str] = None
    mobile_number: Optional[str] = None
    preferred_language: Optional[str] = Field(None, pattern="^(en-IN|hi-IN|mr-IN)$")


class PatientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    age: Optional[int] = None
    date_of_birth: Optional[str] = None
    mobile_number: str
    preferred_language: str
    created_at: datetime
    updated_at: datetime
