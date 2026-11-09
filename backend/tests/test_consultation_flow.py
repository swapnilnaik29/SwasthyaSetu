import io
import pytest


@pytest.mark.asyncio
async def test_full_consultation_turn_lifecycle(client):
    # 1. Create Patient
    pat_res = await client.post(
        "/api/v1/patients",
        json={
            "name": "Rajendra Verma",
            "age": 42,
            "mobile_number": "9811223344",
            "preferred_language": "hi-IN",
        },
    )
    patient_id = pat_res.json()["id"]

    # 2. Create Consultation
    cons_res = await client.post(
        "/api/v1/consultations",
        json={
            "patient_id": patient_id,
            "doctor_language": "en-IN",
            "patient_language": "hi-IN",
        },
    )
    assert cons_res.status_code == 201
    consultation = cons_res.json()
    consultation_id = consultation["id"]
    assert consultation["status"] == "ACTIVE"

    # 3. Patient Turn (using text fallback)
    patient_turn_data = {
        "speaker": "PATIENT",
        "source_language": "hi-IN",
        "target_language": "en-IN",
        "text": "Mujhe three days se fever hai aur headache bhi hai.",
    }
    p_turn_res = await client.post(
        f"/api/v1/consultations/{consultation_id}/turns",
        data=patient_turn_data,
    )
    assert p_turn_res.status_code == 200
    p_turn = p_turn_res.json()
    assert p_turn["speaker"] == "PATIENT"
    assert "fever" in p_turn["canonical_english"].lower()
    assert p_turn["audio_url"] is not None

    # 4. Patient Turn using Mock Audio upload
    from app.services.speech.mock_speech import MockTTSService
    dummy_wav = await MockTTSService().synthesize("Mujhe fever hai", "hi-IN")
    files = {"audio": ("turn1.wav", io.BytesIO(dummy_wav), "audio/wav")}
    audio_turn_data = {
        "speaker": "PATIENT",
        "source_language": "hi-IN",
        "target_language": "en-IN",
    }
    audio_res = await client.post(
        f"/api/v1/consultations/{consultation_id}/turns",
        data=audio_turn_data,
        files=files,
    )
    assert audio_res.status_code == 200
    assert audio_res.json()["canonical_english"] is not None

    # 5. Doctor Turn
    doc_turn_data = {
        "speaker": "DOCTOR",
        "source_language": "en-IN",
        "target_language": "hi-IN",
        "text": "Take paracetamol 500mg twice daily after meals for three days.",
    }
    d_turn_res = await client.post(
        f"/api/v1/consultations/{consultation_id}/turns",
        data=doc_turn_data,
    )
    assert d_turn_res.status_code == 200
    d_turn = d_turn_res.json()
    assert d_turn["speaker"] == "DOCTOR"
    assert any(w in d_turn["recipient_translation"] for w in ["पैरासिटामोल", "पेरासिटामोल", "500"]) or "paracetamol" in d_turn["recipient_translation"].lower()

    # 6. Verify Transcripts list: ONLY English canonical text stored
    trans_res = await client.get(f"/api/v1/consultations/{consultation_id}/transcripts")
    assert trans_res.status_code == 200
    transcripts = trans_res.json()
    assert len(transcripts) == 3
    for t in transcripts:
        assert isinstance(t["canonical_english_text"], str)
        assert len(t["canonical_english_text"]) > 0

    # 7. Doctor manual transcript edit
    first_trans_id = transcripts[0]["id"]
    patch_res = await client.patch(
        f"/api/v1/transcripts/{first_trans_id}",
        json={"canonical_english_text": "I have had fever and severe headache for three days."},
    )
    assert patch_res.status_code == 200
    assert "severe headache" in patch_res.json()["canonical_english_text"]

