from datetime import datetime, timezone, timedelta
import pytest


@pytest.mark.asyncio
async def test_followup_scheduling_and_retrieval(client):
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
    assert "SAVED_LOCAL" in followup["sms_status"]

    # List followups
    list_res = await client.get(f"/api/v1/consultations/{consultation_id}/followups")
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1
