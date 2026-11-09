from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class DoctorSettings(BaseModel):
    name: str = "Dr. Priya Sharma"
    credentials: str = "MBBS, MD (General Medicine)"
    preferred_language: str = Field(default="en-IN", pattern="^(en-IN|hi-IN|mr-IN)$")


class DoctorUpdate(BaseModel):
    name: Optional[str] = None
    credentials: Optional[str] = None
    preferred_language: Optional[str] = Field(None, pattern="^(en-IN|hi-IN|mr-IN)$")


class DoctorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    credentials: str
    preferred_language: str
    created_at: datetime
    updated_at: datetime
