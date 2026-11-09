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
    """Test direct STT transcription endpoint with real synthesized speech."""
    from app.services.speech.factory import get_tts_service
    speech_wav = await get_tts_service().synthesize("नमस्ते, आपले नाव काय आहे?", "mr-IN")
    files = {"audio": ("intake.wav", io.BytesIO(speech_wav), "audio/wav")}
    res = await client.post(
        "/api/v1/audio/transcribe",
        files=files,
        data={"language": "mr-IN"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "transcript" in data
    assert isinstance(data["transcript"], str)


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


@pytest.mark.asyncio
async def test_ai_validation_rejects_symptoms_when_asking_name(client):
    """Test AI detects fever complaint when asking for name and reprompts patient."""
    val_req = {
        "step_id": "name",
        "question_text": "नमस्कार! आपले पूर्ण नाव काय आहे?",
        "user_utterance": "Mala teen divasapasun taap aani dukhane ahe.",
        "language": "mr-IN",
    }
    res = await client.post("/api/v1/patients/intake/validate", json=val_req)
    assert res.status_code == 200
    data = res.json()
    assert data["is_valid"] is False
    assert data["reprompt_native"] is not None
    assert len(data["reprompt_native"]) > 0


@pytest.mark.asyncio
async def test_ai_validation_accepts_and_extracts_clean_name(client):
    """Test AI accepts name even inside a conversational sentence and extracts clean name."""
    val_req = {
        "step_id": "name",
        "question_text": "नमस्कार! आपले पूर्ण नाव काय आहे?",
        "user_utterance": "Mi Suresh Pawar boltoy.",
        "language": "mr-IN",
    }
    res = await client.post("/api/v1/patients/intake/validate", json=val_req)
    assert res.status_code == 200
    data = res.json()
    assert data["is_valid"] is True
    assert "Suresh Pawar" in data["extracted_value"]


@pytest.mark.asyncio
async def test_ai_validation_fast_path_phone(client):
    """Test fast-path validation for 10-digit mobile number."""
    val_req = {
        "step_id": "phone",
        "question_text": "कृपया आपला १० अंकी मोबाईल नंबर सांगा.",
        "user_utterance": "9822012345",
        "language": "mr-IN",
    }
    res = await client.post("/api/v1/patients/intake/validate", json=val_req)
    assert res.status_code == 200
    data = res.json()
    assert data["is_valid"] is True
    assert data["extracted_value"] == "9822012345"


@pytest.mark.asyncio
async def test_ai_validation_spoken_phone_in_words_english_and_marathi(client):
    """Test AI converts spoken number words in English and Marathi to 10-digit numbers."""
    # 1. English words: 'nine eight two two zero one two three four five'
    res_en = await client.post(
        "/api/v1/patients/intake/validate",
        json={
            "step_id": "phone",
            "question_text": "Please tell me your 10-digit phone number.",
            "user_utterance": "nine eight two two zero one two three four five",
            "language": "en-IN",
        },
    )
    assert res_en.status_code == 200
    d_en = res_en.json()
    assert d_en["is_valid"] is True
    assert d_en["extracted_value"] == "9822012345"
    assert d_en["parsed_fields"]["mobile_number"] == "9822012345"

    # 2. Marathi words: 'माझा नंबर आहे नऊ आठ दोन दोन शून्य एक दोन तीन चार पाच'
    res_mr = await client.post(
        "/api/v1/patients/intake/validate",
        json={
            "step_id": "phone",
            "question_text": "कृपया आपला १० अंकी मोबाईल नंबर सांगा.",
            "user_utterance": "माझा नंबर आहे नऊ आठ दोन दोन शून्य एक दोन तीन चार पाच",
            "language": "mr-IN",
        },
    )
    assert res_mr.status_code == 200
    d_mr = res_mr.json()
    assert d_mr["is_valid"] is True
    assert d_mr["extracted_value"] == "9822012345"

    # 3. Wrong answer for phone (symptoms spoken instead of number)
    res_wrong = await client.post(
        "/api/v1/patients/intake/validate",
        json={
            "step_id": "phone",
            "question_text": "कृपया आपला १० अंकी मोबाईल नंबर सांगा.",
            "user_utterance": "Mala teen divasapasun potat khup dukhatahe",
            "language": "mr-IN",
        },
    )
    assert res_wrong.status_code == 200
    d_wrong = res_wrong.json()
    assert d_wrong["is_valid"] is False
    assert d_wrong["reprompt_native"] is not None


@pytest.mark.asyncio
async def test_ai_validation_age_gender_arbitrary_sequence(client):
    """Test AI validates and extracts age and gender in ANY sequence (e.g. gender first, age first)."""
    # 1. Gender first (Marathi: "स्त्री वय २८")
    res1 = await client.post(
        "/api/v1/patients/intake/validate",
        json={
            "step_id": "age_gender",
            "question_text": "तुमचे वय किती आहे आणि लिंग काय आहे?",
            "user_utterance": "स्त्री वय २८",
            "language": "mr-IN",
        },
    )
    assert res1.status_code == 200
    d1 = res1.json()
    assert d1["is_valid"] is True
    assert d1["parsed_fields"]["age"] == 28
    assert d1["parsed_fields"]["gender"] == "Female"

    # 2. Gender first (English: "Male 42")
    res2 = await client.post(
        "/api/v1/patients/intake/validate",
        json={
            "step_id": "age_gender",
            "question_text": "What is your age and gender?",
            "user_utterance": "Male 42",
            "language": "en-IN",
        },
    )
    assert res2.status_code == 200
    d2 = res2.json()
    assert d2["is_valid"] is True
    assert d2["parsed_fields"]["age"] == 42
    assert d2["parsed_fields"]["gender"] == "Male"

    # 3. Only age provided -> should be rejected with reprompt
    res3 = await client.post(
        "/api/v1/patients/intake/validate",
        json={
            "step_id": "age_gender",
            "question_text": "What is your age and gender?",
            "user_utterance": "35 years old",
            "language": "en-IN",
        },
    )
    assert res3.status_code == 200
    d3 = res3.json()
    assert d3["is_valid"] is False
    assert d3["reprompt_native"] is not None


@pytest.mark.asyncio
async def test_female_voice_synthesis_intake(client):
    """Test female voice synthesis for conversational intake."""
    res = await client.post(
        "/api/v1/audio/synthesize",
        json={
            "text": "नमस्कार! आपले पूर्ण नाव काय आहे?",
            "language": "mr-IN",
            "gender": "female",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert "audio_url" in data


