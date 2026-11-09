import io
import pytest
from app.services.speech.mock_speech import MockTTSService


@pytest.mark.asyncio
async def test_conversational_intake_creates_patient(client):
    """Test conversational AI intake endpoint creates patient with English clinical brief."""
    intake_data = {
        "name": "Suresh Pawar",
        "age": 48,
        "gender": "Male",
        "mobile_number": "9822334455",
        "preferred_language": "mr-IN",
        "chief_complaint": "Mala teen divasapasun taap aani dukhane ahe",
        "symptoms_duration": "3 divas (3 days)",
        "past_medical_history": "Hypertension (BP) ahe",
        "known_allergies": "Kahi nahi (No known allergies)",
        "current_medications": "Amlodipine 5mg",
    }

    res = await client.post("/api/v1/patients/intake", json=intake_data)
    assert res.status_code == 201
    patient = res.json()
    assert patient["name"] == "Suresh Pawar"
    assert patient["preferred_language"] == "mr-IN"
    assert patient["gender"] == "Male"
    assert patient["age"] == 48
    assert patient["intake_summary_english"] is not None
    assert len(patient["intake_summary_english"]) > 0


@pytest.mark.asyncio
async def test_audio_direct_synthesize_endpoint(client):
    """Test direct TTS synthesis endpoint returns audio_url with transient audio ID."""
    res = await client.post(
        "/api/v1/audio/synthesize",
        json={"text": "Namaste, aapka shubh naam kya hai?", "language": "hi-IN"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "audio_url" in data
    assert "audio_id" in data
    assert data["audio_url"].startswith("/api/v1/audio/")

    # Fetch the transient audio wav
    audio_res = await client.get(data["audio_url"])
    assert audio_res.status_code == 200
    assert audio_res.headers["content-type"] == "audio/wav"
    assert len(audio_res.content) > 44  # Valid WAV header + PCM


@pytest.mark.asyncio
async def test_audio_direct_transcribe_endpoint(client):
    """Test direct STT transcription endpoint."""
    dummy_wav = await MockTTSService().synthesize("Mala taap ahe", "mr-IN")
    files = {"audio": ("intake.wav", io.BytesIO(dummy_wav), "audio/wav")}
    res = await client.post(
        "/api/v1/audio/transcribe",
        files=files,
        data={"language": "mr-IN"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "transcript" in data
    assert len(data["transcript"]) > 0


@pytest.mark.asyncio
async def test_ambient_background_consultation_skips_tts(client):
    """Test that AMBIENT_BACKGROUND mode logs transcripts to canonical English without generating TTS audio."""
    # 1. Create Patient
    pat_res = await client.post(
        "/api/v1/patients",
        json={
            "name": "Sunita Kadam",
            "age": 39,
            "mobile_number": "9899887766",
            "preferred_language": "mr-IN",
        },
    )
    patient_id = pat_res.json()["id"]

    # 2. Create Consultation with mode="AMBIENT_BACKGROUND"
    cons_res = await client.post(
        "/api/v1/consultations",
        json={
            "patient_id": patient_id,
            "doctor_language": "mr-IN",
            "patient_language": "mr-IN",
            "mode": "AMBIENT_BACKGROUND",
        },
    )
    assert cons_res.status_code == 201
    cons = cons_res.json()
    assert cons["mode"] == "AMBIENT_BACKGROUND"
    cons_id = cons["id"]

    # 3. Process turn in ambient mode
    turn_res = await client.post(
        f"/api/v1/consultations/{cons_id}/turns",
        data={
            "speaker": "PATIENT",
            "source_language": "mr-IN",
            "target_language": "mr-IN",
            "text": "Mala kal pasun potat khup dukhatahe",
        },
    )
    assert turn_res.status_code == 200
    turn = turn_res.json()
    assert turn["canonical_english"] is not None
    # TTS audio generation MUST be skipped in ambient background scribe mode!
    assert turn["audio_url"] is None
