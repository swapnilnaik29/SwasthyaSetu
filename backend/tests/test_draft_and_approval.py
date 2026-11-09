import pytest


@pytest.mark.asyncio
async def test_draft_generation_edit_and_approval(client):
    # Setup patient and consultation
    pat_res = await client.post(
        "/api/v1/patients",
        json={"name": "Kavita Rao", "age": 28, "mobile_number": "9765432100", "preferred_language": "hi-IN"},
    )
    patient_id = pat_res.json()["id"]

    cons_res = await client.post(
        "/api/v1/consultations",
        json={"patient_id": patient_id, "doctor_language": "en-IN", "patient_language": "hi-IN"},
    )
    consultation_id = cons_res.json()["id"]

    # Add consultation turn
    await client.post(
        f"/api/v1/consultations/{consultation_id}/turns",
        data={
            "speaker": "PATIENT",
            "source_language": "hi-IN",
            "target_language": "en-IN",
            "text": "Mujhe three days se fever hai aur headache bhi hai.",
        },
    )

    # 1. Generate Draft
    draft_res = await client.post(f"/api/v1/consultations/{consultation_id}/draft")
    assert draft_res.status_code == 200
    draft = draft_res.json()
    assert draft["status"] == "PENDING_REVIEW"
    payload = draft["structured_payload"]

    # Verify clinical extraction safety rules
    assert len(payload["patient_reported_symptoms"]) >= 1
    assert payload["doctor_diagnosis"] is not None
    assert "allergies" in payload

    # 2. Doctor edits draft to add diagnosis and prescription
    updated_payload = payload.copy()
    updated_payload["doctor_diagnosis"] = "Viral Pyrexia with Tension Headache"
    updated_payload["prescriptions"] = [
        {
            "medicine": "Tab Paracetamol",
            "strength": "500mg",
            "dose": "1 tablet",
            "frequency": "Twice daily",
            "duration": "3 days",
            "instructions": "After meals",
        }
    ]
    updated_payload["follow_up_recommendation"] = "Follow up after 3 days if fever persists"

    patch_res = await client.patch(
        f"/api/v1/consultations/{consultation_id}/draft",
        json={"structured_payload": updated_payload},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["structured_payload"]["doctor_diagnosis"] == "Viral Pyrexia with Tension Headache"

    # 3. Doctor Approves Draft -> Creates official clinical record
    approve_res = await client.post(f"/api/v1/consultations/{consultation_id}/approve")
    assert approve_res.status_code == 200
    rec = approve_res.json()
    assert rec["approved_by"] is not None
    assert rec["approved_at"] is not None
    assert rec["approved_payload"]["doctor_diagnosis"] == "Viral Pyrexia with Tension Headache"

    # Verify consultation is now COMPLETED
    cons_after = await client.get(f"/api/v1/consultations/{consultation_id}")
    assert cons_after.json()["status"] == "COMPLETED"

    # 4. Verify patient reports retrieval endpoint fetches official approved record
    reports_res = await client.get(f"/api/v1/patients/{patient_id}/reports")
    assert reports_res.status_code == 200
    reports = reports_res.json()
    assert len(reports) >= 1
    assert reports[0]["doctor_diagnosis"] == "Viral Pyrexia with Tension Headache"
    assert reports[0]["status"] == "APPROVED"


@pytest.mark.asyncio
async def test_doctor_ai_assist_vitals_dictation(client):
    pat_res = await client.post(
        "/api/v1/patients",
        json={"name": "Rohit Verma", "age": 42, "mobile_number": "9123456780", "preferred_language": "mr-IN"},
    )
    patient_id = pat_res.json()["id"]

    cons_res = await client.post(
        "/api/v1/consultations",
        json={"patient_id": patient_id, "doctor_language": "en-IN", "patient_language": "mr-IN"},
    )
    consultation_id = cons_res.json()["id"]

    # Initial draft
    await client.post(f"/api/v1/consultations/{consultation_id}/draft")

    # Doctor speaks/types vitals
    assist_res = await client.post(
        f"/api/v1/consultations/{consultation_id}/ai-assist",
        json={
            "message": "Patient weight is 72 kg, height is 175 cm, blood pressure 125/82, pulse 76, temperature 99.1",
            "language": "en-IN",
        },
    )
    assert assist_res.status_code == 200
    res_data = assist_res.json()
    assert res_data["ai_reply"] is not None
    vitals = res_data["updated_payload"]["vitals"]
    assert vitals["weight_kg"] == 72.0
    assert vitals["height_cm"] == 175.0
    assert "125/82" in vitals["blood_pressure"]
    assert vitals["pulse_bpm"] == 76
    assert vitals["temperature_f"] == 99.1


@pytest.mark.asyncio
async def test_draft_rejection(client):
    pat_res = await client.post(
        "/api/v1/patients",
        json={"name": "Alok Nath", "age": 55, "mobile_number": "9822334455", "preferred_language": "hi-IN"},
    )
    cons_res = await client.post(
        "/api/v1/consultations",
        json={"patient_id": pat_res.json()["id"]},
    )
    consultation_id = cons_res.json()["id"]

    await client.post(f"/api/v1/consultations/{consultation_id}/draft")
    reject_res = await client.post(f"/api/v1/consultations/{consultation_id}/reject")
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "REJECTED"

