# SwasthyaSetu — System Architecture & Design Specification

SwasthyaSetu is a doctor-operated, single-device multilingual healthcare communication and clinical documentation assistant designed to eliminate language barriers in doctor-patient consultations.

---

## 1. High-Level Architecture

```mermaid
graph TD
    subgraph ClientLayer["Doctor Device (Mobile / Desktop Web Client)"]
        UI["Modern Web UI (HTML5 / CSS3 / ES6)"]
        MIC["Audio Capture (MediaRecorder Web API)"]
        PLAYER["Audio Playback (HTML5 Audio Element)"]
        CLIENT["API Client (Vanilla JS Fetch with Health Probe)"]
    end

    subgraph BackendHost["FastAPI Backend (0.0.0.0:8000)"]
        STATIC["StaticFiles Server (Mounts / to frontend/)"]
        ROUTER["API Routers (/api/v1)"]
        AUTH_DOC["Doctor Settings Service"]
        PAT_MGR["Patient Management"]
        CONS_ORCH["Consultation Orchestrator"]
        CACHE["Encrypted SQLite Translation Cache Service"]
        EXTRACT["Structured Draft Extractor"]
        NOTIF["Local Follow-up Store"]
    end

    subgraph Database["Local High-Performance SQLite (WAL Mode)"]
        DB_TABLES["patients, doctors, consultations"]
        DB_TRANS["transcripts (Canonical English Only)"]
        DB_CACHE["translation_cache (AES-GCM Encrypted)"]
        DB_RECORDS["consultation_drafts, clinical_records, followups"]
    end

    subgraph ExternalAI["Speech & Intelligence Providers"]
        GNANI_STT["Gnani Prisma v2.5 STT REST"]
        GNANI_TTS["Gnani Timbre v2.5 TTS REST (Male Voices)"]
        OPENAI["OpenAI GPT-6 Luna Responses API"]
    end

    STATIC --> UI
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
    NOTIF --> DB_RECORDS
```

---

## 2. Bidirectional Turn-Based Consultation Flow

The consultation operates in discrete, turn-based speech exchanges on a single doctor-held device. The doctor manually designates the active speaker (**Patient** or **Doctor**) before each turn.

```mermaid
sequenceDiagram
    autonumber
    actor Doctor
    actor Patient
    participant App as Web Frontend (HTML/JS)
    participant API as FastAPI Backend
    participant Cache as Translation Cache (AES-GCM in SQLite)
    participant Luna as OpenAI GPT-6 Luna
    participant Gnani as Gnani AI (Prisma/Timbre)
    participant DB as SQLite Database

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
        Luna-->>API: {recipient_translation: "I have had fever...", canonical_english: "..."}
        API->>Cache: Encrypt & Store in translation_cache (AES-GCM)
    end
    API->>DB: INSERT into transcripts (canonical_english_text ONLY)
    API->>Gnani: Synthesize TTS (Timbre v2.5, en-IN, Male Voice)
    Gnani-->>API: WAV audio bytes
    API-->>App: Turn Result (transcript_id, canonical_english, audio_url)
    App->>App: Lock Microphone & Play Synthesized Audio on Phone Speaker
    App->>Doctor: Displays English Translation in Timeline

    Note over Doctor,App: Turn 2: Doctor Speaks English (Patient understands Hindi)
    Doctor->>App: Selects "DOCTOR SPEAKS" & Taps Record
    Doctor->>App: "Take paracetamol 500mg twice daily after meals for three days."
    Doctor->>App: Taps Stop Record
    App->>API: POST /consultations/{id}/turns (audio.wav, speaker=DOCTOR, en-IN -> hi-IN)
    API->>Gnani: Transcribe Audio (Prisma v2.5, en-IN)
    Gnani-->>API: "Take paracetamol 500mg twice daily after meals for three days."
    API->>Cache: Lookup HMAC-SHA256(source + en-IN + hi-IN + luna)
    alt Cache Hit
        Cache-->>API: Decrypted cached translation
    else Cache Miss
        API->>Luna: Contextual Translation & Canonicalization
        Luna-->>API: {recipient_translation: "पैरासिटामोल 500 मिलीग्राम...", canonical_english: "..."}
        API->>Cache: Encrypt & Store in translation_cache (AES-GCM)
    end
    API->>DB: INSERT into transcripts (canonical_english_text ONLY)
    API->>Gnani: Synthesize TTS (Timbre v2.5, hi-IN, Male Voice: hi_male_1)
    Gnani-->>API: Synthesized WAV audio bytes
    API-->>App: Turn Result (audio_url: /api/v1/audio/{id})
    App->>App: Lock Microphone & Play Hindi Audio Aloud via Phone Speaker
    App->>Patient: Patient hears instructions clearly in Hindi
```

---

## 3. High-Performance SQLite Configuration

To ensure sub-second response times on local devices, SQLite is configured with Write-Ahead Logging (WAL) and memory optimization PRAGMAs:

```sql
PRAGMA journal_mode = WAL;         -- Concurrent reads during writes
PRAGMA synchronous = NORMAL;       -- Safe durability with reduced disk sync overhead
PRAGMA cache_size = -64000;        -- 64MB memory page cache
PRAGMA temp_store = MEMORY;        -- Temporary tables in RAM
PRAGMA foreign_keys = ON;          -- Referential integrity
```

Additionally, connection pooling (`httpx.AsyncClient` with keep-alives) is maintained across Gnani AI and OpenAI API calls, eliminating TLS handshakes on every conversational turn.

---

## 4. Canonical English Storage Rule

Medical records must be searchable and auditable across doctors regardless of the language spoken during the consultation. Therefore:
1. All entries in the `transcripts` table store `canonical_english_text`. Non-English raw transcripts are never persisted in the clinical record.
2. All entries in `consultation_drafts` and `clinical_records` store structured entities (symptoms, duration, diagnosis, medications, instructions) strictly in canonical medical English.

---

## 5. Security & Encryption at Rest

1. **Translation Cache**:
   - `lookup_hash`: `HMAC-SHA256(normalized_source_text + src_lang + tgt_lang + model, hmac_key)`
   - `encrypted_translation`: AES-256-GCM encrypted ciphertext with 12-byte random nonce and 16-byte authentication tag.
2. **Clinical Records**:
   - Stored locally on encrypted volume or protected database file.
   - Physician approval is strictly signed with doctor ID and timestamp.
