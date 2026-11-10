from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class FollowupCreate(BaseModel):
    appointment_at: Optional[datetime] = None
    scheduled_date: Optional[str] = None
    phone_number: Optional[str] = None
    patient_id: Optional[str] = None
    instructions: Optional[str] = None


class FollowupOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    consultation_id: str
    appointment_at: datetime
    phone_number: str
    sms_status: str
    provider_message_id: Optional[str] = None
    created_at: datetime
