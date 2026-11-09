# SwasthyaSetu — External API Integration Technical Notes

This document details the exact integration patterns, schemas, endpoints, and credentials required for Gnani AI, OpenAI GPT-6 Luna, and SMS notifications.

---

## 1. Gnani AI Integration

### 1.1 Speech-to-Text (STT) — Gnani Prisma v2.5
- **Model Identifier**: `prisma-v2.5`
- **Supported Languages**: `hi-IN` (Hindi), `mr-IN` (Marathi), `en-IN` (Indian English), with code-mixed Hindi-English and Marathi-English capabilities.
- **Official Documentation**:
  - Introduction: [https://docs.gnani.ai/api/introduction/introduction](https://docs.gnani.ai/api/introduction/introduction)
  - STT REST: [https://docs.gnani.ai/api/STT/speech-to-text](https://docs.gnani.ai/api/STT/speech-to-text)
- **Authentication Scheme**:
  - Current API uses a single `GNANI_API_KEY` passed as an HTTP Bearer token:
    `Authorization: Bearer <GNANI_API_KEY>`
  - Legacy Gnani accounts that previously required separate `token`, `access_key`, and SSL certificate bundles are supported via environment flags (`GNANI_LEGACY_TOKEN`, etc.).
- **Request Format**:
  - Multipart form upload with:
    - `audio`: WAV file (16kHz, 16-bit mono PCM).
    - `language`: Target language code (`hi-IN`, `mr-IN`, `en-IN`).
    - `model`: `prisma-v2.5`.
    - `encoding`: `wav`.
- **Response Format**:
  ```json
  {
    "transcript": "Mujhe three days se fever hai aur headache bhi hai.",
    "confidence": 0.96,
    "detected_language": "hi-IN"
  }
  ```

### 1.2 Text-to-Speech (TTS) — Gnani Timbre v2.5
- **Model Identifier**: `timbre-v2.5`
- **Official Documentation**: [https://docs.gnani.ai/api/TTS/tts-inference](https://docs.gnani.ai/api/TTS/tts-inference)
- **Supported Voices**:
  - Hindi: `hi_female_1` (default), `hi_male_1`
  - Marathi: `mr_female_1` (default), `mr_male_1`
  - English: `en_female_1` (default), `en_male_1`
- **Request Format**:
  - HTTP POST `https://api.gnani.ai/v1/tts/synthesize`
  - JSON Body:
    ```json
    {
      "text": "पैरासिटामोल 500 मिलीग्राम खाने के बाद दिन में दो बार लें।",
      "language": "hi-IN",
      "voice": "hi_female_1",
      "model": "timbre-v2.5",
      "audio_format": "wav"
    }
    ```
- **Mock Fallback**:
  - When `GNANI_API_KEY` is not present, `MockSTTService` returns deterministic, scripted hackathon utterances and `MockTTSService` synthesizes a valid 16kHz PCM audio waveform so Flutter's `just_audio` player operates without error.

---

## 2. OpenAI GPT-6 Luna (`gpt-6-luna`)

### 2.1 Model Identity & Role
- **Model Identifier**: `gpt-6-luna`
- **API Mode**: OpenAI Responses API / Chat Completions with Structured Outputs (`strict: true`).
- **Processing Scope**: Text translation, English canonicalization, and structured clinical extraction.
- **Audio Handling**: GPT-6 Luna is strictly a text model in this architecture. All audio is transcribed via Gnani STT before text is sent to Luna.

### 2.2 Reusable Fixed Prefix / Prompt Caching
To leverage OpenAI prompt caching and minimize token consumption:
- The system instruction prefix is immutable across all translation requests.
- The fixed prefix enforces:
  1. Strict clinical entity preservation (dosages, numbers, units, negation).
  2. Flagging uncertain colloquialisms or code-mixed phrases.
  3. Generating canonical English text alongside recipient translation in a single request.
- Variable per-turn content (speaker, source language, target language, utterance) is appended as user input.

### 2.3 Structured Output Schema for Translation
```json
{
  "recipient_translation": "string",
  "recipient_language": "string",
  "canonical_english": "string",
  "source_language": "string",
  "uncertainty_flags": ["string"],
  "needs_human_review": false
}
```

### 2.4 Structured Consultation Draft Extraction
- Endpoint: `POST /api/v1/consultations/{consultation_id}/draft`
- Inputs: Canonical English transcripts of the entire consultation.
- Output Schema:
  ```json
  {
    "patient_reported_symptoms": [
      {
        "symptom": "Fever",
        "duration": "3 days",
        "severity": "Moderate",
        "source_snippet": "Patient reported fever"
      }
    ],
    "duration_summary": "Symptoms persisting for 3 days",
    "medical_history": "Not stated in the conversation",
    "allergies": "Not stated",
    "doctor_diagnosis": "Not specified; doctor to enter or confirm",
    "prescriptions": [],
    "follow_up_recommendation": "Pending doctor input",
    "uncertain_terms": [],
    "record_status": "PENDING_REVIEW"
  }
  ```
- **Integrity Rule**: `doctor_diagnosis` and `prescriptions` must never be autonomously approved by the AI. They remain unconfirmed until explicitly entered or approved by the physician.

---

## 3. Persistent Encrypted Translation Cache

- **Table**: `translation_cache`
- **Key Hash**: `HMAC-SHA256(TRANSLATION_CACHE_HMAC_KEY, normalized_source + '|' + source_lang + '|' + target_lang + '|' + model_id + '|' + prompt_version)`
- **Encryption Algorithm**: AES-256-GCM authenticated encryption with 96-bit random nonce per entry.
- **Normalization Strategy**: Safe whitespace collapse and Unicode NFC normalization. Numerical quantities, dosage separators, units, and negation words are strictly preserved.
- **Default TTL**: 90 days (`TRANSLATION_CACHE_TTL_DAYS=90`).

---

## 4. SMS Provider Integration

- **Provider**: Mock SMS Gateway for local development and hackathon demonstrations (`SMS_PROVIDER=mock`).
- **Template**:
  `"Reminder: You have an appointment with {doctor_name} at {clinic_name} on {appointment_time}. Clinic contact: {clinic_phone}."`
- **Privacy Enforcement**:
  Automated privacy audits in `test_followup_and_sms.py` verify that medical diagnoses, drug names, and clinical history are barred from outbound SMS payloads.

