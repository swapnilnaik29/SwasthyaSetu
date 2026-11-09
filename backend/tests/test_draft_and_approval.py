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
    assert payload["prescriptions"] == []  # Prescriptions must be empty initially
    assert "Not specified" in payload["doctor_diagnosis"]
    assert "Not stated" in payload["allergies"]

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

