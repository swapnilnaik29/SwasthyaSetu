# SwasthyaSetu — System Architecture & Design Specification

SwasthyaSetu is a doctor-operated, single-phone multilingual healthcare communication and clinical documentation assistant designed to eliminate language barriers in doctor-patient consultations.

---

## 1. High-Level Architecture

```mermaid
graph TD
    subgraph MobileDevice["Doctor Mobile Device (Flutter App)"]
        UI["Doctor UI (Material 3)"]
        MIC["Microphone Capture (Record WAV)"]
        PLAYER["Audio Player (JustAudio TTS Playback)"]
        CLIENT["API Client (Dio with Dynamic LAN IP)"]
    end

    subgraph BackendHost["FastAPI Backend (0.0.0.0:8000)"]
        ROUTER["API Routers (/api/v1)"]
        AUTH_DOC["Doctor Settings Service"]
        PAT_MGR["Patient Management"]
        CONS_ORCH["Consultation Orchestrator"]
        CACHE["Encrypted Translation Cache Service"]
        EXTRACT["Structured Draft Extractor"]
        NOTIF["SMS Dispatch Service"]
    end

    subgraph Database["PostgreSQL / SQLite Database"]
        DB_TABLES["patients, doctors, consultations"]
        DB_TRANS["transcripts (Canonical English Only)"]
        DB_CACHE["translation_cache (AES-GCM Encrypted)"]
        DB_RECORDS["consultation_drafts, clinical_records, followups"]
    end

    subgraph ExternalAI["External AI Providers"]
        GNANI_STT["Gnani Prisma v2.5 STT REST"]
        GNANI_TTS["Gnani Timbre v2.5 TTS REST"]
        OPENAI["OpenAI GPT-6 Luna Responses API"]
        SMS_GW["SMS Provider / Mock Gateway"]
    end

    MIC -->|Upload audio turn| CLIENT
    CLIENT -->|REST POST /turns| ROUTER
    ROUTER --> CONS_ORCH
    CONS_ORCH --> GNANI_STT
    CONS_ORCH --> CACHE
    CACHE -.->|Cache Miss| OPENAI
    CONS_ORCH --> GNANI_TTS
    CONS_ORCH --> DB_TRANS
    CACHE --> DB_CACHE
    PLAYER <--|Fetch synthesized WAV| ROUTER
    EXTRACT --> OPENAI
    EXTRACT --> DB_RECORDS
    NOTIF --> SMS_GW
```

---

## 2. Bidirectional Turn-Based Consultation Flow

The consultation operates in discrete, turn-based speech exchanges on a single doctor-held smartphone. The doctor manually designates the active speaker (**Patient** or **Doctor**) before each turn.

```mermaid
sequenceDiagram
    autonumber
    actor Doctor
    actor Patient
    participant App as Flutter Mobile App
    participant API as FastAPI Backend
    participant Cache as Translation Cache (AES-GCM)
    participant Luna as OpenAI GPT-6 Luna
    participant Gnani as Gnani AI (Prisma/Timbre)
    participant DB as PostgreSQL Database

    Note over Doctor,App: Turn 1: Patient Speaks Hindi (Doctor understands English)
    Doctor->>App: Selects "PATIENT SPEAKS" & Taps Record
    Patient->>App: "Mujhe three days se fever hai aur headache bhi hai."
    Doctor->>App: Taps Stop Record
    App->>API: POST /consultations/{id}/turns (audio.wav, speaker=PATIENT, hi-IN -> en-IN)
    API->>Gnani: Transcribe Audio (Prisma v2.5, hi-IN)
    Gnani-->>API: "Mujhe three days se fever hai aur headache bhi hai."
    API->>Cache: Lookup HMAC-SHA256(source + hi-IN + en-IN + luna)
    alt Cache Hit
        Cache-->>API: Decrypted cached translation
    else Cache Miss
        API->>Luna: Contextual Translation & Canonicalization (Responses API)
        Luna-->>API: {recipient_translation: "I have fever and headache...", canonical_english: "..."}
        API->>Cache: Encrypt & Store in translation_cache (AES-GCM)
    end
    API->>DB: INSERT into transcripts (canonical_english_text ONLY)
    API->>Gnani: Synthesize TTS (Timbre v2.5, en-IN)
    Gnani-->>API: WAV audio bytes
    API-->>App: Turn Result (transcript_id, canonical_english, audio_url)
    App->>App: Lock Microphone & Play Synthesized Audio on Phone Speaker
    App->>Doctor: Displays English Translation in Timeline

    Note over Doctor,App: Turn 2: Doctor Speaks English (Patient understands Hindi)
    Doctor->>App: Selects "DOCTOR SPEAKS" & Taps Record
    Doctor->>App: "Take paracetamol 500mg twice daily after meals for three days."
    Doctor->>App: Taps Stop Record
    App->>API: POST /consultations/{id}/turns (audio.wav, speaker=DOCTOR, en-IN -> hi-IN)
    API->>Gnani: Transcribe (en-IN)
    API->>Cache: Lookup Translation Cache
    alt Cache Miss
        API->>Luna: Translate (en-IN -> hi-IN)
        API->>Cache: Encrypt & Store (AES-GCM)
    end
    API->>DB: INSERT into transcripts (canonical_english_text ONLY)
    API->>Gnani: Synthesize TTS in Hindi (hi_female_1)
    Gnani-->>API: Hindi WAV audio bytes
    API-->>App: Turn Result (recipient_translation: "पैरासिटामोल 500 मिलीग्राम...", audio_url)
    App->>App: Lock Microphone & Play Hindi Audio to Patient
```

---

## 3. Canonical English Storage Architecture

### Rationale & Legal Integrity
In medical and hospital governance across India, medical records and prescriptions are legally canonicalized in standard English. Translating into regional languages transiently bridges the clinical gap, but persisting raw, unverified regional text into the canonical medical record introduces liability and audit discrepancies.

### Enforcement Rules
1. **Clinical Tables Exclusion**: The tables `transcripts`, `consultation_drafts`, and `clinical_records` strictly store canonical English text.
2. **Transient UI Display**: Recognized regional speech is returned transiently to the active consultation screen so the doctor can audit the speech recognition live.
3. **Encrypted Cache Exception**: The `translation_cache` table is the sole permitted exception to avoid repeat API calls. Cached non-English text is encrypted at rest using AES-GCM and indexed via keyed HMAC-SHA256.

---

## 4. Persistent Encrypted Translation Cache

```mermaid
flowchart TD
    Start([Speech Turn Recognized]) --> Norm[Normalize Safe Whitespace & NFC]
    Norm --> HMAC[Compute Keyed HMAC-SHA256 Hash]
    HMAC --> Lookup{Match in DB cache_key_hash?}
    Lookup -- Yes (Not Expired) --> Hit[Increment hit_count & Decrypt AES-GCM]
    Hit --> Return[Return Cached Translation (0 Model Calls)]
    Lookup -- No / Expired --> Call[Call GPT-6 Luna Responses API]
    Call --> Validate[Validate Strict Pydantic Schema]
    Validate --> Encrypt[Encrypt Target Text with AES-GCM]
    Encrypt --> Store[Store in DB with 90-day TTL]
    Store --> Return
```

---

## 5. Draft Generation & Approval Flow

```mermaid
sequenceDiagram
    autonumber
    actor Doctor
    participant App as Mobile App
    participant API as FastAPI Backend
    participant Luna as GPT-6 Luna
    participant DB as PostgreSQL Database
    participant SMS as SMS Gateway

    Doctor->>App: Taps "End Consultation & Review Draft"
    App->>API: POST /consultations/{id}/draft
    API->>DB: Fetch Canonical English Transcripts
    DB-->>API: List of English turns
    API->>Luna: Extract Structured Draft (Strict Pydantic JSON Schema)
    Note over Luna: Extracts symptoms, durations, history.<br/>Leaves diagnosis & prescription EMPTY.
    Luna-->>API: Structured Draft Payload
    API->>DB: INSERT into consultation_drafts (status=PENDING_REVIEW)
    API-->>App: Draft Data
    App->>Doctor: Displays Draft Review Screen with "AI-Generated Pending Review" Badge
    Doctor->>App: Edits diagnosis ("Viral Pyrexia") & adds Prescription ("Paracetamol 500mg")
    Doctor->>App: Taps "Approve & Save Official Record"
    App->>API: POST /consultations/{id}/approve
    API->>DB: UPDATE consultation_drafts (status=APPROVED)
    API->>DB: INSERT into clinical_records (approved_by, approved_at, payload)
    API-->>App: Approved Record Confirmation
    Doctor->>App: Picks Follow-up Date (3 days later) & Taps "Send SMS Reminder"
    App->>API: POST /consultations/{id}/followups
    API->>SMS: Dispatch Minimal Reminder (Clinic, Doctor, Date/Time ONLY)
    SMS-->>API: Status: DELIVERED, message_id
    API-->>App: Followup Created
```

---

## 6. Single-Device Audio Feedback Prevention

When recording and playback occur on a single smartphone:
- TTS playback through phone speaker can bleed directly into the microphone.
- **Solution implemented in `AudioService`**:
  * Audio playback triggers an automatic recording lock (`isPlaying = true`).
  * If recording is active when playback begins, recording is immediately stopped.
  * Start recording is prohibited while audio playback is active.
  * UI prominently displays: `"TTS Playing — Recording paused to prevent microphone echo"`.
