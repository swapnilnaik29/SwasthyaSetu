from abc import ABC, abstractmethod
from typing import Dict, Any


class SMSProvider(ABC):
    @abstractmethod
    async def send_appointment_reminder(
        self,
        to_phone: str,
        doctor_name: str,
        clinic_name: str,
        appointment_time: str,
        clinic_phone: str,
    ) -> Dict[str, Any]:
        """
        Sends an appointment reminder SMS.
        STRICT PRIVACY REQUIREMENT: The reminder must ONLY contain clinic/doctor name,
        date/time, and contact information. Never include medical diagnoses,
        prescriptions, or medical history.
        """
        pass
