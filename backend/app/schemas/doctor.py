from datetime import datetime
from typing import Optional, List, Union
from pydantic import BaseModel, Field, ConfigDict, field_validator


class DoctorSettings(BaseModel):
    name: str = "Dr. Priya Sharma"
    credentials: str = "MBBS, MD (General Medicine)"
    preferred_language: str = Field(default="en-IN")
    spoken_languages: Union[str, List[str]] = Field(default="en-IN,mr-IN")

    @field_validator("spoken_languages", mode="before")
    @classmethod
    def serialize_spoken(cls, v):
        if isinstance(v, list):
            return ",".join(v)
        return v


class DoctorUpdate(BaseModel):
    name: Optional[str] = None
    credentials: Optional[str] = None
    preferred_language: Optional[str] = None
    spoken_languages: Optional[Union[str, List[str]]] = None

    @field_validator("spoken_languages", mode="before")
    @classmethod
    def serialize_spoken(cls, v):
        if isinstance(v, list):
            return ",".join(v)
        return v


class DoctorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    credentials: str
    preferred_language: str
    spoken_languages: Optional[str] = "en-IN,mr-IN"
    created_at: datetime
    updated_at: datetime
