from datetime import datetime, timezone, timedelta
import pytest
from app.services.notifications.mock_sms import MockSMSProvider


@pytest.mark.asyncio
async def test_followup_scheduling_and_sms(client):
    pat_res = await client.post(
        "/api/v1/patients",
        json={"name": "Meera Joshi", "age": 30, "mobile_number": "9819819810", "preferred_language": "mr-IN"},
    )
    patient_id = pat_res.json()["id"]

    cons_res = await client.post(
        "/api/v1/consultations",
        json={"patient_id": patient_id},
    )
    consultation_id = cons_res.json()["id"]

    # Schedule Followup
    appointment_time = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
    followup_res = await client.post(
        f"/api/v1/consultations/{consultation_id}/followups",
        json={
            "appointment_at": appointment_time,
            "phone_number": "9819819810",
        },
    )
    assert followup_res.status_code == 201
    followup = followup_res.json()
    assert followup["sms_status"] in ["SENT", "DELIVERED"]
    assert followup["provider_message_id"] is not None

    # List followups
    list_res = await client.get(f"/api/v1/consultations/{consultation_id}/followups")
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1


@pytest.mark.asyncio
async def test_mock_sms_privacy_check():
    provider = MockSMSProvider()
    res = await provider.send_appointment_reminder(
        to_phone="9819819810",
        doctor_name="Dr. Priya Sharma",
        clinic_name="SwasthyaSetu Clinic",
        appointment_time="15-Nov-2026 10:00 AM",
        clinic_phone="+919876543210",
    )
    assert res["status"] == "SENT"
    assert len(provider.sent_messages) == 1
    sent_body = provider.sent_messages[0]["body"]
    
    # Assert medical details are strictly absent
    for sensitive_word in ["fever", "headache", "paracetamol", "diagnosis", "disease", "treatment"]:
        assert sensitive_word not in sent_body.lower()
