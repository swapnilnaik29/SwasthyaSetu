# SwasthyaSetu — Antigravity Build Specification

> **Purpose:** Give this file to Antigravity as the implementation brief for the complete SwasthyaSetu hackathon MVP.
>
> **Source of truth:** `SwasthyaSetu_Project_Description.pdf` (9 pages). Preserve its agreed scope. Do not silently expand the product.

## 1. Product summary

SwasthyaSetu is a doctor-operated, single-phone multilingual healthcare communication and documentation application. A doctor manages the consultation on one phone. Patient and doctor take turns speaking; the doctor manually selects the active speaker before each turn. The application transcribes speech, translates when the configured languages differ, optionally speaks the translation, and creates a structured **draft** medical record for doctor review and approval.

### MVP scope

- One doctor account / one-doctor demonstration.
- One Flutter mobile application operated by the doctor; no separate patient app.
- Languages: Hindi (`hi-IN`), Marathi (`mr-IN`), and Indian English (`en-IN`).
- Code-mixed speech within the supported language set is in scope.
- Patient language and doctor language are configured independently for each consultation.
- Translation is bidirectional on every turn: patient speech is translated into the doctor's language; doctor speech is translated into the patient's language.
- The active speaker is manually selected before every turn. The speaker determines the translation direction.
- Automatic language switching is not required. The selected speaker's configured language is the expected source language; handle occasional code-mixing within that turn.
- Manual speaker selection: `Patient` or `Doctor` before every speech turn. Do not implement automatic diarization.
- Turn-based flow, one speech turn at a time. Build and validate the basic STT → translation-if-needed → TTS loop before attempting streaming.
- Gnani provides speech-to-text and text-to-speech.
- OpenAI **GPT-6 Luna** (`gpt-6-luna`) provides bidirectional contextual translation: patient language → doctor language and doctor language → patient language. It also creates structured consultation drafts.
- Call GPT-6 Luna through the OpenAI **Responses API** from the backend. It is a text model; it does not process audio directly. Gnani remains responsible for STT and TTS.
- English is the canonical language for persisted application and clinical data. Persist clinical records, summaries, extracted fields, doctor notes, and searchable patient/consultation data in English. Do not persist raw non-English transcripts as the canonical medical record.
- Retain a secure translation cache so previously translated phrases can be reused without another model call. The cache is a deliberate exception to the English-only canonical-record rule because it must retain the translated target-language output; protect it as sensitive health-related data, encrypt it at rest, apply retention controls, and do not expose it as the clinical record.
- PostgreSQL stores doctor, patient, consultation, transcript, draft, approval and follow-up data.
- Doctor reviews and edits the AI-generated draft. Only doctor-approved clinical information becomes the approved record.
- Doctor can schedule a follow-up and send a minimal SMS reminder. SMS must not contain diagnoses, prescriptions or detailed medical history.
- Use fictional/demo patient data for hackathon demonstrations.

### Explicitly out of scope

- Multiple doctors or multi-clinic support.
- Patient-facing app.
- Automatic language switching or automatic speaker diarization.
- Autonomous diagnosis, treatment recommendations or prescription generation.
- Offline mode and hospital integrations.
- QR-based patient access or advanced longitudinal sharing.

## 2. Required repository layout

Create this structure at the repository root:

```text
SwasthyaSetu/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   │   ├── speech/
│   │   │   ├── translation/
│   │   │   ├── records/
│   │   │   └── notifications/
│   │   └── main.py
│   ├── alembic/
│   ├── tests/
│   ├── .env.example
│   ├── requirements.txt
│   └── README.md
├── app/
│   ├── lib/
│   │   ├── core/
│   │   ├── models/
│   │   ├── services/
│   │   ├── providers/
│   │   ├── state/
│   │   ├── widgets/
│   │   └── features/
│   │       ├── onboarding/
│   │       ├── dashboard/
│   │       ├── patients/
│   │       ├── consultation/
│   │       ├── records/
│   │       └── followups/
│   ├── test/
│   └── README.md
├── docs/
│   ├── architecture.md
│   ├── api-integration-notes.md
│   └── demo-script.md
├── prompt.md
├── .gitignore
└── README.md
```

Keep the two top-level application folders exactly named `backend` and `app`. `app` is the Flutter application.

## 3. Technology choices

### Backend

- Python 3.11+
- FastAPI
- SQLAlchemy 2.x
- Alembic migrations
- PostgreSQL
- Pydantic v2 settings and request/response validation
- `httpx` for HTTP integrations where applicable
- Gnani's maintained SDK/integration where it matches the current official docs; otherwise isolate provider calls behind a service adapter.
- Current OpenAI Python SDK using the Responses API for GPT-6 Luna translation and structured extraction.
- Pin compatible dependency versions and document them.
- SMS provider behind an interface so the MVP can use a configured provider or a clearly labelled mock mode.

### Mobile

- Flutter stable / Dart
- Material 3 interface
- `record` (or another maintained recorder package) for microphone capture
- `just_audio` for TTS audio playback
- `dio` for API calls
- `flutter_secure_storage` for any app-side session token
- `permission_handler` for microphone permission
- State management: Riverpod (preferred) or another consistent solution; do not mix state-management patterns.

Do not put Gnani, OpenAI or SMS provider secrets in Flutter. All third-party credentials remain in the backend environment.

## 4. Functional requirements and screens

### 4.1 Doctor setup

- One doctor profile for the demo.
- Doctor selects default language: Hindi, Marathi or English.
- Persist the setting through the backend.
- If full authentication is not implemented for the single-doctor hackathon MVP, clearly mark the demo account as a development-only shortcut and keep the backend structured so authentication can be added. Do not expose a public production deployment without authentication.

### 4.2 Patient management

- Create patient: name, age or date of birth, mobile number, preferred language.
- Search/list patients.
- View patient profile and prior consultations.
- Generate a unique patient ID on the backend.
- Validate phone number and required fields.
- Avoid collecting unnecessary personal information.

### 4.3 Consultation

- Start consultation for a selected patient.
- Display patient language and doctor language.
- Prominent active-speaker selector with exactly two choices: Patient and Doctor.
- Record one speech turn, stop recording, upload audio to backend.
- Show recording/upload/transcription/translation/TTS states and errors.
- Display original transcript and translated transcript separately.
- Associate every segment with speaker, source language, target language and timestamp.
- Show the recognized source-language text transiently in the live consultation UI so the doctor can spot recognition errors.
- Translate every turn into the other party's configured language using GPT-6 Luna: Patient → Doctor language, Doctor → Patient language.
- If source and target languages match, skip the translation model call.
- Show the recipient-language translation and offer playback using Gnani TTS in the recipient language.
- The canonical persisted transcript and all generated clinical fields must be in English. If the turn is not English, translate it to English for persistence even when the recipient's language is another Indian language. The recipient-facing translation is a separate display/playback artifact and is not the canonical record.
- Do not store original non-English transcript text in the clinical record. Keep it only in memory for the active turn unless the secure translation-cache policy below retains it as an encrypted cache entry.
- Pause/disable recording while TTS playback is active to reduce the single-device echo problem. Resume only after playback ends or the doctor explicitly restarts capture.
- Allow retry for failed upload/STT/translation/TTS. Do not lose already completed transcript turns.
- Do not claim true simultaneous real-time translation. The MVP is turn-based.

### 4.4 Draft medical record

At the end of a consultation, generate a structured draft from the transcript. Include:

- Patient-reported symptoms
- Symptom duration
- Severity, only if explicitly stated
- Relevant medical history, only if stated
- Allergies, only if stated
- Diagnosis: blank / not specified unless explicitly entered or confirmed by the doctor
- Prescription: empty until the doctor enters and approves it
- Follow-up: pending until entered by the doctor
- Uncertain terms / items needing review
- Record status: `PENDING_REVIEW`, `APPROVED`, or `REJECTED`

Rules:
- Never infer missing clinical facts. Use `null`, “Not stated”, or “Needs review”.
- Preserve medicine names, strengths, quantities, units, dosage and frequency exactly as spoken or entered; flag uncertainty and discrepancies.
- AI must never independently create or modify a diagnosis or prescription.
- Distinguish patient-reported symptoms from doctor-confirmed diagnoses.
- Keep the canonical English transcript and English extracted fields for auditability. Do not store a non-English transcript as the canonical clinical record.
- Show a visible “AI-generated draft — pending doctor review” label.
- Doctor can edit fields, save draft, approve or reject.
- Only approved records are returned as approved clinical records. Persist the reviewer and approval timestamp.

### 4.5 Follow-up

- Doctor chooses date/time and confirms patient mobile number.
- Send a minimal SMS: clinic/doctor name, appointment date/time and contact information only.
- Never include medical details in SMS.
- Implement an SMS provider interface and a mock provider for local development.
- Store delivery status and provider response safely, without logging sensitive content.

## 5. Suggested database model

Use UUID primary keys and timezone-aware timestamps. Include created/updated timestamps where appropriate.

- `doctors`: id, name, credentials, preferred_language
- `patients`: id, name, age or date_of_birth, mobile_number, preferred_language
- `consultations`: id, patient_id, doctor_id, started_at, ended_at, doctor_language, patient_language, status
- `transcripts`: id, consultation_id, speaker, canonical_english_text, source_language, recipient_language, timestamp, confidence/uncertainty metadata if provider supplies it. Persist only the English canonical text in this table; do not persist the raw non-English recognition output here.
- `translation_cache`: id, cache_key_hash, normalized_source_hash, source_language, target_language, translated_text_encrypted, model_id, prompt_version, created_at, last_used_at, hit_count, expires_at. Store the target-language translation encrypted because it is needed for future reuse; this is a sensitive cache, not the canonical clinical record. Use a keyed HMAC/hash for lookup, never plaintext source text as a key. Cache must be tenant/doctor scoped where applicable.
- `medical_history`: id, patient_id, condition, notes, source
- `consultation_drafts`: id, consultation_id, structured_payload JSONB, status, created_at
- `clinical_records`: id, consultation_id, approved_payload JSONB, approved_by, approved_at
- `followups`: id, consultation_id, appointment_at, phone_number, sms_status, provider_message_id

Use foreign keys, indexes for patient search and consultation history, and database constraints for valid statuses/languages. Avoid duplicate patient records where practical, but do not silently merge patients based only on name.

## 6. Backend API contract

Implement documented, versioned REST endpoints under `/api/v1`. At minimum:

```text
GET    /health
GET    /api/v1/doctor/settings
PUT    /api/v1/doctor/settings

GET    /api/v1/patients
POST   /api/v1/patients
GET    /api/v1/patients/{patient_id}
PATCH  /api/v1/patients/{patient_id}
GET    /api/v1/patients/{patient_id}/consultations

POST   /api/v1/consultations
GET    /api/v1/consultations/{consultation_id}
POST   /api/v1/consultations/{consultation_id}/turns
GET    /api/v1/consultations/{consultation_id}/transcripts
PATCH  /api/v1/transcripts/{transcript_id}

POST   /api/v1/consultations/{consultation_id}/draft
GET    /api/v1/consultations/{consultation_id}/draft
PATCH  /api/v1/consultations/{consultation_id}/draft
POST   /api/v1/consultations/{consultation_id}/approve
POST   /api/v1/consultations/{consultation_id}/reject

POST   /api/v1/consultations/{consultation_id}/followups
GET    /api/v1/consultations/{consultation_id}/followups
```

For audio turns, use multipart upload with `audio`, `speaker`, `source_language`, and `target_language` fields. Validate file type, size and duration. Return a stable transcript-turn ID and clear stage status.

Use consistent error responses, request IDs, timeouts, bounded retries for transient provider errors, and structured logs. Never log API keys, raw audio, full medical transcripts or sensitive patient data.

## 7. Speech, translation and extraction pipeline

### 7.1 Gnani STT

The current public Gnani materials surfaced during research identify:
- Gnani Prisma v2.5 as STT.
- Hosted inference; the application does not download or run model weights locally.
- A single `GNANI_API_KEY` in the newer SDK integration.
- STT file/REST and realtime WebSocket modes.
- Language examples include `hi-IN`, `mr-IN`, and `en-IN`; code-mixed English-Hindi is documented. Verify Marathi-English and Hindi-Marathi mixed utterances with actual account access.
- The maintained Hugging Face integration documents `pip install gnani-vachana transformers` and `pipeline("automatic-speech-recognition", model="gnani-ai/vachana", trust_remote_code=True)`.
- Use REST/file transcription first for the MVP. Streaming is a later optimization.

Official references:
- https://docs.gnani.ai/api/introduction/introduction
- https://docs.gnani.ai/api/STT/speech-to-text
- https://docs.gnani.ai/api/STT/stt-websocket
- https://huggingface.co/gnani-ai/gnani

Older Gnani documentation may require separate token, access key and certificate and may use `asr.gnani.ai`; newer materials document a single API key. Do not mix the old and new authentication schemes. Implement against the account's current official docs and credentials. If the account uses the legacy gRPC integration, isolate token/access key/certificate and gRPC code in the provider adapter. Never guess endpoint paths or payloads.

Audio handling:
- Flutter records a supported format.
- Backend validates and converts/resamples only if required by the selected Gnani endpoint.
- Preserve a copy only as long as required; default to temporary processing and delete raw audio after successful transcription unless an explicit retention configuration is enabled.
- Keep provider errors actionable and safe.

### 7.2 Gnani TTS

Current Gnani materials identify Timbre v2.0/v2.5 and REST, SSE and WebSocket transports. Start with REST for a reliable MVP, then add streaming only if verified and useful.

- Use the documented current SDK/API, not guessed request bodies.
- Choose a voice supported for the target language from the current official voice list.
- Return audio bytes or a short-lived backend-served URL to Flutter.
- Do not expose provider credentials or permanent public audio URLs.
- Verify the actual available Marathi, Hindi and English voices with the account.

Official references:
- https://docs.gnani.ai/api/TTS/tts-inference
- https://docs.gnani.ai/api/TTS/tts-sse
- https://docs.gnani.ai/api/TTS/tts-websocket
- https://huggingface.co/gnani-ai/gnani

### 7.3 GPT-6 Luna bidirectional translation and English canonicalization

Use OpenAI GPT-6 Luna (`gpt-6-luna`) through the Responses API. The model is called only from FastAPI. It performs both directions:
- Patient → Doctor: translate the patient's selected language into the doctor's selected language.
- Doctor → Patient: translate the doctor's selected language into the patient's selected language.

The same recognized utterance must also be canonicalized into English for persistence when its source language is not English. If the recipient language is English, reuse the recipient translation as the canonical English text rather than making a second model call. If the source is already English, reuse the source text. Avoid redundant calls by requesting recipient translation and canonical English output together in one structured response when both are needed.

Return a validated structured object containing:
- `recipient_translation`
- `recipient_language`
- `canonical_english`
- `source_language`
- `uncertainty_flags`
- `needs_human_review`

Translation requirements:
- Preserve clinical meaning, negation, symptom duration, severity, quantities, medicine names, strengths, units, dosage and frequency.
- Do not guess medicine names or normalize a medicine by guessing.
- Preserve code-mixed terms when uncertain and flag them.
- Do not add advice, diagnoses or clinical facts.
- If ambiguous, flag for doctor review rather than inventing a translation.
- Do not translate proper names, identifiers or numbers unnecessarily.
- Use the speaker selection and consultation's configured language pair to determine direction; do not infer direction from the content alone.

### 7.3.1 Translation cache and API-call minimization

Implement a persistent, encrypted translation cache in PostgreSQL (or a dedicated encrypted cache store) to avoid repeat GPT-6 Luna calls.

Cache lookup key must include:
- normalized source text HMAC/hash (use a server-side secret key; do not store plaintext source in the lookup key)
- source language
- target/recipient language
- model ID (`gpt-6-luna`)
- translation prompt version
- relevant glossary/version identifier, if a clinic glossary is enabled

Cache behavior:
1. Normalize only safe whitespace/unicode variations. Do not remove clinically meaningful punctuation, decimal points, dosage separators, units or negation.
2. Compute the keyed hash and look up an exact match before calling GPT-6 Luna.
3. On a cache hit, return the stored translation and increment `hit_count`/`last_used_at`; do not call the model.
4. On a miss, call GPT-6 Luna once, validate the structured response, then store the translation securely for reuse.
5. Cache both directions independently (e.g. `hi-IN → en-IN` is not the same entry as `en-IN → hi-IN`).
6. Cache recipient-language translations and canonical English output together when possible so one request supplies both.
7. Never reuse a translation across different language pairs, model versions, prompt versions or glossary versions.
8. Add TTL/expiry and a doctor-configurable purge mechanism. Default TTL: 90 days unless a stricter deployment policy is configured.
9. Encrypt cached target-language text at rest using an application-managed encryption key from the environment or secret manager. Never log cache values.
10. Scope cache entries to the single-doctor deployment by default. If multi-doctor support is later added, decide explicitly whether sharing is permitted; do not silently share patient-specific content.
11. Do not cache full consultation transcripts or patient-specific context as a generic phrase. Prefer caching short, context-independent phrases. If context materially changes meaning, bypass cache.
12. Include cache hit/miss metrics without recording source text, translated text or patient identifiers.
13. Add tests proving exact repeated phrases hit cache and do not invoke the OpenAI client twice.

### 7.3.2 Reusable common instructions / prompt caching

Keep the stable translation system instructions, output schema and safety rules in a fixed, reusable prompt prefix. Put the variable content (speaker, source/target languages, utterance) after the stable prefix. Reuse the same prompt version and schema across calls. Where supported by the OpenAI API/model, use documented prompt caching automatically; do not invent a cache-control parameter. Prompt caching is an optimization and is separate from the application's translation-result cache.

Do not resend a long common instruction block assembled differently on every call. Centralize it in a version-controlled prompt file or Python constant and include a prompt version in cache keys. Keep per-turn context minimal: only the current utterance and the minimum relevant glossary/context needed to translate safely. Do not include the full patient history unless essential and explicitly justified.

Official OpenAI references:
- Model page: https://developers.openai.com/api/docs/models/gpt-6-luna
- Responses API: https://developers.openai.com/api/docs/guides/text
- Structured Outputs: https://developers.openai.com/api/docs/guides/structured-outputs
- Prompt caching: https://developers.openai.com/api/docs/guides/prompt-caching

### 7.4 Structured extraction

Use a strict Pydantic schema and the OpenAI API's structured output / JSON mode supported by the selected model. Ask for only facts explicitly present in the conversation. Include evidence snippets or source transcript-turn IDs for extracted facts where feasible. Use null for absent values. Validate the model response before storing it.

### 7.5 GPT-6 Luna structured extraction

Use GPT-6 Luna (`gpt-6-luna`) through the Responses API for structured consultation draft extraction. Use the currently documented Structured Outputs capability and a strict JSON schema/Pydantic validation layer. Do not rely on free-form JSON parsing alone.

Extraction constraints:
- Extract only facts explicitly present in transcript turns.
- Include source transcript-turn IDs or short evidence snippets for extracted facts where feasible.
- Distinguish patient-reported symptoms from doctor statements and doctor-confirmed diagnoses.
- Leave diagnosis and prescription empty unless explicitly entered or confirmed by the doctor.
- Use null for missing facts and a review flag for ambiguous facts.
- Reject or safely retry malformed or schema-invalid model output.
- Never let the model approve a clinical record.

Official OpenAI references:
- Model page: https://developers.openai.com/api/docs/models/gpt-6-luna
- Model guidance: https://developers.openai.com/api/docs/guides/latest-model
- Responses API: https://developers.openai.com/api/docs/guides/text
- Structured Outputs: https://developers.openai.com/api/docs/guides/structured-outputs

Do not confuse GPT-6 Luna with an audio model. It handles text translation and extraction only in this architecture.

## 8. Environment variables

Create `backend/.env.example` with placeholders only. The real `.env` must be ignored by Git.

```dotenv
# Application
APP_ENV=development
APP_NAME=SwasthyaSetu
DEBUG=true
API_V1_PREFIX=/api/v1
SECRET_KEY=replace-with-a-long-random-secret
CORS_ORIGINS=http://localhost:*,http://127.0.0.1:*

# Database
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/swasthyasetu

# Gnani — use the current account's authentication scheme
GNANI_API_KEY=
GNANI_STT_MODEL=prisma-v2.5
GNANI_TTS_MODEL=timbre-v2.5
GNANI_STT_MODE=rest
GNANI_TTS_MODE=rest
GNANI_DEFAULT_VOICE_HI=
GNANI_DEFAULT_VOICE_MR=
GNANI_DEFAULT_VOICE_EN=
# Only for legacy Gnani accounts, if explicitly required by their docs:
GNANI_LEGACY_TOKEN=
GNANI_LEGACY_ACCESS_KEY=
GNANI_LEGACY_CERT_PATH=

# OpenAI GPT-6 Luna — text translation and structured draft extraction
OPENAI_API_KEY=
OPENAI_MODEL=gpt-6-luna
OPENAI_API_MODE=responses
OPENAI_REASONING_EFFORT=none
TRANSLATION_PROMPT_VERSION=v1
TRANSLATION_CACHE_TTL_DAYS=90
TRANSLATION_CACHE_ENCRYPTION_KEY=replace-with-32-byte-base64-key
TRANSLATION_CACHE_HMAC_KEY=replace-with-long-random-secret

# SMS — optional until a provider is selected
SMS_PROVIDER=mock
SMS_API_KEY=
SMS_API_SECRET=
SMS_SENDER_ID=
SMS_BASE_URL=

# Audio / retention
MAX_AUDIO_MB=20
AUDIO_TEMP_DIR=./tmp/audio
RETAIN_AUDIO=false
AUDIO_RETENTION_HOURS=0

# Optional app URL used in SMS / metadata
CLINIC_DISPLAY_NAME=SwasthyaSetu Demo Clinic
CLINIC_CONTACT_NUMBER=
```

Notes:
- `OPENAI_MODEL` must be set to a model available to the account; do not hard-code a guessed model name.
- `GNANI_API_KEY` is the current documented credential for the newer Gnani SDK. Do not populate legacy fields unless Gnani issued those credentials and the account's docs require them.
- The SMS variables depend on the provider chosen (e.g. a provider account and approved sender configuration). Keep `SMS_PROVIDER=mock` until real credentials exist.
- Do not put secrets in `app/.env`, Dart source, build configuration, screenshots or committed files.
- The Flutter app needs only a configurable backend base URL, not third-party provider API keys. Use `--dart-define=API_BASE_URL=...` or a safe build-time configuration.

## 9. Physical mobile phone testing — mandatory

The primary test target is a **real Android or iPhone device**, not only an emulator. The Flutter app must be usable on a phone connected to the same Wi-Fi network as the development computer.

Backend requirements:
- Run Uvicorn bound to `0.0.0.0`, not only `127.0.0.1`, so the phone can reach it over the LAN.
- Example: `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`.
- Determine the computer's private LAN IPv4 address (for example `192.168.1.25`) and configure that address as the app API base URL.
- Allow inbound TCP port 8000 through the computer firewall for the private network.
- Ensure phone and computer are on the same Wi-Fi and that guest-network/client isolation is disabled.
- Do not use `localhost` or `127.0.0.1` as the API host inside the app when testing on a physical phone; those addresses point to the phone itself.
- For a public/demo deployment, use an HTTPS backend URL. Do not expose a development server directly to the public internet.

Flutter API base URL configuration:
- Use `--dart-define=API_BASE_URL=http://192.168.1.25:8000` as an example; replace the IP with the developer computer's actual LAN IP.
- Keep the base URL in one configuration class and make it easy to switch between LAN development and deployed HTTPS.
- Add a visible connection status or a useful connection error in the app.
- Add Android Internet permission and microphone permission. Configure Android cleartext HTTP only for local development if required; production must use HTTPS.
- Configure iOS microphone usage description and local-network access requirements where applicable. Prefer HTTPS for deployed builds.

Reference URLs:
- Android emulator only (not the primary target): `http://10.0.2.2:8000`
- iOS simulator only (not the primary target): `http://127.0.0.1:8000`
- Physical phone: `http://<computer-LAN-IP>:8000`
- Deployed backend: `https://<your-api-domain>`

Do not assume `localhost` on a physical phone points to the development computer.

## 10. UX requirements

Create a clean, clinical, accessible Material 3 interface:
- Calm blue/teal palette, high contrast, readable typography and large touch targets.
- Dashboard with patient search, recent patients and “New patient”.
- Patient details with consultation history and “Start consultation”.
- Consultation view with language labels, speaker toggle, record/stop control, transcript timeline, translation display, retry and playback controls.
- Draft review view with clear “AI draft / pending review” status and editable fields.
- Approval confirmation screen.
- Follow-up scheduling form and SMS status.
- Loading, empty, permission-denied, offline/network error, provider error and retry states.
- Do not overload the consultation screen. Make active speaker and recording state unmistakable.
- Show original and translated text distinctly and retain both.

## 11. Data language, security, privacy and clinical safety

- English is the canonical storage language for patient/consultation records, transcript records, medical history, generated drafts, approved records, notes and search indexes. Translate non-English speech into English before persisting clinical content.
- Do not persist raw non-English transcripts in the main clinical tables. Non-English text may be held transiently in memory for the active turn and may be retained only in the encrypted translation cache described above to support reuse. Make the cache exception explicit in documentation and retention controls.
- Patient-facing/doctor-facing translated text may be displayed and spoken during the live consultation. Persist it only in the encrypted translation cache, not as the canonical medical record.
- The PDF says consent management is omitted from the MVP scope, but this does **not** remove the need to obtain appropriate patient consent before recording or processing real consultations. Use fictional data for the hackathon demo.
- Backend-only provider credentials.
- Do not deploy real patient data without authentication, authorization, HTTPS, secure database configuration and appropriate legal/privacy review.
- No raw audio retention by default.
- No transcript or patient data in application logs or analytics.
- Use parameterized ORM queries and validate all input.
- Add rate limits / upload limits where practical.
- Avoid detailed patient information in SMS.
- Make the distinction between AI-generated draft and doctor-approved record visible everywhere relevant.
- This is a communication and documentation aid, not a diagnostic or treatment system.

## 12. Testing requirements

Backend tests:
- Health endpoint and database connectivity.
- Patient create/list/search and validation.
- Consultation lifecycle and speaker attribution.
- Patient Hindi → doctor English translation works.
- Doctor English → patient Hindi translation works.
- Marathi and Indian English direction pairs are covered.
- Same-language turn skips recipient translation.
- Non-English turns are canonicalized to English before clinical persistence.
- Repeated exact phrase/language-pair hits translation cache and does not invoke GPT-6 Luna again.
- Reverse language direction uses a separate cache entry.
- Prompt/model/glossary version changes invalidate cache lookup.
- Sensitive cache text is encrypted and excluded from logs.
- STT/TTS provider adapters with mocked network calls.
- Extraction schema validation and null handling.
- Draft cannot become approved without explicit doctor action.
- Approval records reviewer and timestamp.
- SMS mock sends minimal reminder only.
- Provider failures, timeouts, retries and malformed responses.

Flutter tests:
- Navigation and form validation.
- Patient creation.
- Speaker selection.
- Recording states and permission denial.
- Transcript and translation rendering.
- Draft editing and approval.
- Follow-up scheduling and error states.

Demo acceptance scenario from the PDF:
A fictional Hindi-speaking patient says: “Mujhe three days se fever hai aur headache bhi hai.” The doctor uses English. The system transcribes the code-mixed statement, translates it into English for the doctor, stores the canonical English transcript, supports the doctor's English response being translated and spoken back in Hindi, and drafts patient-reported fever and headache with the stated durations. Repeating an identical utterance with the same language pair should use the translation cache rather than call GPT-6 Luna again. The doctor reviews and approves the draft, selects a follow-up date and triggers a test SMS.

## 13. Implementation order

1. Scaffold backend, configuration, database, migrations and health endpoint.
2. Scaffold Flutter navigation, theme and doctor language settings.
3. Patient CRUD and consultation creation.
4. Audio recording/upload and Gnani STT adapter.
5. Translation and Gnani TTS round-trip.
6. Transcript persistence and correction.
7. Structured draft extraction and review/edit UI.
8. Doctor approval and patient history.
9. Follow-up and mock SMS; real SMS only after provider credentials/configuration.
10. Tests, demo data, documentation and end-to-end hardening.

## 14. Definition of done

The project is not complete merely because screens exist. It is complete when:
- Both `backend` and `app` run locally using documented commands.
- Database migrations work from an empty database.
- Patient creation and consultation history work end to end.
- A real Gnani test credential can transcribe a supported test recording, or a clearly labelled mock adapter is available for offline development.
- Patient → doctor and doctor → patient translation both work.
- Canonical clinical data is persisted in English.
- Translation cache reuses exact translations and demonstrably reduces GPT-6 Luna calls.
- Gnani TTS can synthesize and play a translated response, or a clearly labelled mock is available.
- Draft extraction returns schema-valid data and never invents missing clinical facts.
- The doctor can edit and approve the draft.
- Follow-up can be scheduled and mock SMS status is visible.
- Automated tests pass.
- `.env.example`, `.gitignore`, root README, backend README, app README, API docs and demo script are present.
- No secrets are committed.

## 15. Mobile device validation checklist

Antigravity must document and verify the following real-device workflow:
1. Install/run the Flutter app on a physical Android phone (and ensure iOS build configuration is not broken if a Mac is available).
2. Grant microphone permission and verify recording works on the phone microphone.
3. Connect phone and computer to the same Wi-Fi.
4. Run FastAPI on `0.0.0.0` and configure the app with the computer's LAN IP.
5. Verify the phone can call `/health`, create/search a patient and start a consultation.
6. Record a real test utterance, upload it, and verify Gnani STT returns text.
7. Verify GPT-6 Luna translates text when languages differ and is not called for same-language turns.
8. Verify Gnani TTS audio plays on the phone speaker or connected headphones.
9. Verify recording is paused during TTS playback to avoid microphone feedback.
10. Complete draft review/approval and follow-up scheduling on the phone.
11. Test network loss, API timeout, microphone denial and provider failure states.
12. Record tested phone model, OS version, backend LAN address approach and any device-specific limitations in `docs/mobile-testing.md`.

Do not claim physical-device validation based only on emulator testing.

## 16. Instructions to Antigravity

Act as a senior full-stack engineer. Work directly in the opened repository and create the complete runnable MVP, not just a plan or sample snippets.

1. First inspect the repository and the provided `SwasthyaSetu_Project_Description.pdf`. Treat the PDF and this brief as the product source of truth.
2. Create the requested root structure with `backend/` and `app/`.
3. Before implementing Gnani, inspect the current official docs linked above and use the documented API/SDK version. Before implementing GPT-6 Luna, inspect its official model page and Responses API / Structured Outputs documentation. Record chosen integration methods and account-specific assumptions in `docs/api-integration-notes.md`.
4. Do not fabricate API endpoints, model names, voices, credentials or Luna 6 details. Use provider adapters and mock mode where credentials or documentation are unavailable.
5. Implement in phases, run tests and fix errors after each phase. Do not leave core flows as TODOs.
6. Include database migrations, seed/demo data using fictional patients, and a complete `.env.example`.
7. Ensure the app can run against the local backend on Android emulator and a physical phone using a configurable base URL.
8. At the end, provide exact commands for Windows PowerShell and macOS/Linux to install dependencies, configure environment variables, start PostgreSQL, run migrations, start FastAPI, run Flutter, run tests and build a demo APK.
9. Report what is genuinely integrated versus mocked, what credentials the developer must obtain, known limitations, and any manual dashboard setup.
10. Never claim a provider integration works until a real request has been tested successfully. If credentials are absent, finish the adapter, mock tests and setup instructions, and clearly mark the real-provider test as pending.
11. Treat real physical-phone testing as a required acceptance target. Configure the backend to listen on `0.0.0.0`, document LAN IP discovery and firewall setup, and pass the actual LAN API URL into Flutter with `--dart-define=API_BASE_URL=...`.
12. Use `gpt-6-luna` as the OpenAI model ID. Use the Responses API. Do not send audio to GPT-6 Luna; use Gnani for STT/TTS.

---

# Copy-paste Antigravity master prompt

Open the repository and read **`prompt.md` first**, then read `SwasthyaSetu_Project_Description.pdf`. Treat `prompt.md` as the detailed implementation specification and the PDF as the original product scope. Do not start coding until you have read both. Implement the entire SwasthyaSetu MVP exactly as specified in `prompt.md`.

Create a root project with `backend/` (FastAPI + PostgreSQL) and `app/` (Flutter mobile app). Build the backend APIs, SQLAlchemy models, Alembic migrations, Gnani STT/TTS adapters, OpenAI GPT-6 Luna (`gpt-6-luna`) bidirectional translation, English canonicalization, structured medical-draft extraction, patient management, turn-based consultation with manual Patient/Doctor speaker selection, transcript persistence, draft review/edit/approval, patient history and follow-up SMS mock provider. Implement the complete Flutter screens and connect them to the backend.

**Translation direction is mandatory and bidirectional:**
- When Patient is selected as speaker: translate Patient language → Doctor language.
- When Doctor is selected as speaker: translate Doctor language → Patient language.
- Use GPT-6 Luna for both directions.
- Use Gnani for speech-to-text and text-to-speech only.
- If source and recipient languages are identical, skip recipient translation.
- Regardless of the recipient language, persist the canonical clinical transcript and all clinical/application records in English.
- When a non-English utterance needs both recipient-language translation and English canonicalization, request both outputs in one structured GPT-6 Luna call where possible, avoiding two calls.
- Preserve the meaning of medical terms, negation, numbers, units, medicine names, dosage and symptom duration. Flag ambiguity; never invent clinical facts.

**Minimize GPT-6 Luna API usage:**
- Implement the persistent translation-result cache specified in `prompt.md`.
- Cache key includes normalized source-text HMAC/hash, source language, target language, model ID, prompt version and glossary version.
- Exact repeated phrase + same direction + same model/prompt version must return the cached translation without a new API call.
- Cache the two directions separately.
- Encrypt cached non-English target text at rest, apply TTL, keep cache entries out of logs, and provide a purge mechanism.
- Keep stable common translation instructions and the structured schema in a reusable fixed prompt prefix. Put variable utterance/language fields after it. Use OpenAI prompt caching only as documented and supported; do not invent parameters.
- Do not send the full patient history or entire transcript on every translation request. Send only the current utterance and the minimum context required.
- Add automated tests that count OpenAI calls and prove cache hits avoid repeat calls.

**Data storage rule:** English is the canonical language for all persisted clinical/application data. Do not store raw non-English transcripts in clinical tables. The translation cache is the explicitly documented exception: it may retain encrypted target-language output solely to reuse translations. Keep original non-English text transient during the active turn unless required by the encrypted cache. All clinical records, summaries, notes, extracted fields and approved records must be English.

Use GPT-6 Luna model ID `gpt-6-luna` via the OpenAI Responses API and Structured Outputs. Do not send audio to GPT-6 Luna. Inspect official OpenAI docs for the model, Responses API, Structured Outputs and prompt caching. Inspect current official Gnani docs for Prisma STT and Timbre TTS; verify the account's authentication scheme, supported languages, request format and voices. Do not invent endpoints or credentials. Keep provider integrations behind adapters and provide clearly labelled mock modes when credentials are absent.

The app will be tested on a **physical mobile phone**, not only an emulator. Backend must bind to `0.0.0.0`; Flutter must accept `API_BASE_URL` using `--dart-define`; use the computer's LAN IPv4 address on the same Wi-Fi; document firewall TCP 8000, Android microphone/internet permissions, local HTTP development and HTTPS deployment. Verify microphone recording, audio upload, Gnani STT, both GPT-6 Luna translation directions, English persistence, translation cache hits, Gnani TTS playback, draft approval and follow-up on the actual phone. Create `docs/mobile-testing.md` and distinguish real-device testing from emulator testing.

Create `.env.example`, `.gitignore`, root/backend/app READMEs, API docs, architecture notes, demo script, cache design notes and automated tests. Keep all third-party secrets on the backend. Run tests and fix failures. Do not stop after scaffolding. Finish with exact Windows PowerShell and macOS/Linux commands, credentials needed, manual provider setup, LAN IP discovery, physical phone connection, APK build instructions and a truthful real-vs-mock integration checklist.
