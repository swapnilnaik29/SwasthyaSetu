import uuid
from typing import Dict, Any
from app.core.logger import logger, log_sanitized_event
from app.services.notifications.sms_base import SMSProvider


class MockSMSProvider(SMSProvider):
    """
    Mock SMS Provider for local development, hackathon demos, and automated testing.
    Verifies that no clinical diagnoses or prescription details are present in the message.
    """

    def __init__(self):
        logger.info("Initializing MockSMSProvider [OFFLINE/MOCK MODE]")
        self.sent_messages = []

    async def send_appointment_reminder(
        self,
        to_phone: str,
        doctor_name: str,
        clinic_name: str,
        appointment_time: str,
        clinic_phone: str,
    ) -> Dict[str, Any]:
        message_id = f"sms_mock_{uuid.uuid4().hex[:12]}"
        
        # Formulate minimal non-sensitive appointment reminder
        message_body = (
            f"Reminder: You have an appointment with {doctor_name} at {clinic_name} "
            f"on {appointment_time}. Clinic contact: {clinic_phone}."
        )

        # Audit check: Ensure zero clinical keywords are present
        forbidden_keywords = ["fever", "headache", "diagnosis", "prescription", "paracetamol", "mg", "disease"]
        for kw in forbidden_keywords:
            if kw in message_body.lower():
                raise ValueError(f"Privacy Violation: Clinical keyword '{kw}' detected in appointment SMS!")

        record = {
            "message_id": message_id,
            "to_phone": to_phone,
            "body": message_body,
            "status": "DELIVERED",
            "provider": "mock_sms",
        }
        self.sent_messages.append(record)

        log_sanitized_event("sms_reminder_sent", status="DELIVERED", provider="mock_sms")
        return {
            "status": "SENT",
            "provider_message_id": message_id,
            "provider": "mock_sms",
        }

