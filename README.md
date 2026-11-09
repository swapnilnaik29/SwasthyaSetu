# SwasthyaSetu (स्वास्थ्यसेतु)
### AI-Powered Multilingual Healthcare Communication & Clinical Documentation Assistant

[![Backend Tests](https://img.shields.io/badge/backend%20tests-16%20passed-brightgreen.svg)]()
[![Flutter Tests](https://img.shields.io/badge/flutter%20tests-3%20passed-brightgreen.svg)]()
[![OpenAI Model](https://img.shields.io/badge/OpenAI-GPT--6%20Luna-blue.svg)]()
[![Gnani AI](https://img.shields.io/badge/Gnani-Prisma%20%7C%20Timbre-orange.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()

SwasthyaSetu bridges language barriers during doctor-patient consultations on a single doctor-held smartphone. The application captures turn-based speech, performs contextual bidirectional translation using **OpenAI GPT-6 Luna**, delivers synthesized speech in the patient's language via **Gnani Timbre TTS**, stores clinical records strictly in **canonical medical English**, prevents redundant API calls using a **persistent encrypted translation cache**, and drafts structured clinical notes for physician review and approval.

---

## Repository Structure

```text
SwasthyaSetu/
├── backend/                  # Python 3.11+ FastAPI + SQLAlchemy + Alembic
│   ├── app/
│   │   ├── api/routes/       # REST endpoints (/api/v1)
│   │   ├── core/             # Configuration, AES-GCM security, HMAC hashing
│   │   ├── db/               # SQLAlchemy async session & engine
│   │   ├── models/           # ORM models (doctors, patients, consultations, etc.)
│   │   ├── schemas/          # Strict Pydantic v2 validation schemas
│   │   ├── services/
│   │   │   ├── speech/       # Gnani Prisma STT & Timbre TTS adapters + mocks
│   │   │   ├── translation/  # GPT-6 Luna translation & persistent encrypted cache
│   │   │   ├── records/      # GPT-6 Luna structured draft extractor
│   │   │   └── notifications/# Minimal appointment SMS provider
│   │   └── main.py           # Application entrypoint (listens on 0.0.0.0:8000)
│   ├── alembic/              # Database schema migrations
│   ├── tests/                # Pytest test suite (16 tests covering all flows)
│   ├── .env.example          # Environment variables template
│   ├── requirements.txt      # Pinned Python dependencies
│   └── README.md
├── app/                      # Flutter Stable / Material 3 Mobile Application
│   ├── lib/
│   │   ├── core/             # API config, Material 3 theme, language constants
│   │   ├── models/           # Dart data models
│   │   ├── services/         # Dio HTTP client, AudioRecorder & JustAudio player
│   │   ├── state/            # Riverpod state management
│   │   ├── widgets/          # Connection banner, SpeakerToggle, AudioRecorder
│   │   └── features/         # Dashboard, Consultation, Draft Review, Follow-up
│   ├── test/                 # Automated Flutter widget & unit tests
│   └── README.md
├── docs/
│   ├── architecture.md       # Architecture diagrams & security design
│   ├── api-integration-notes.md # GPT-6 Luna & Gnani technical details
│   ├── demo-script.md        # Step-by-step hackathon presentation guide
│   └── mobile-testing.md     # Mandatory physical phone testing guide
├── prompt.md                 # Complete implementation specification
├── .gitignore
└── README.md
```

---

## Quick Start Guide

### 1. Backend Setup & Run

#### Windows PowerShell

```powershell
# Navigate to backend
cd backend

# Create & activate Python virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Run backend test suite (16 passing tests)
pytest tests -v

# Start FastAPI server on 0.0.0.0:8000 (accessible on local LAN)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### macOS / Linux

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
pytest tests -v
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

### 2. Flutter Mobile App Setup & Run

#### Run on Physical Mobile Phone (Same Wi-Fi)

1. Find your computer's private LAN IPv4 address (e.g. `192.168.1.4`).
2. Run Flutter targeting your connected Android/iOS phone:

```bash
cd app

# Run on physical device
flutter run --dart-define=API_BASE_URL=http://192.168.1.4:8000

# Or build debug APK
flutter build apk --debug --dart-define=API_BASE_URL=http://192.168.1.4:8000
```

> **Dynamic In-App Switcher**: If your Wi-Fi IP changes, tap the Ethernet icon on the top banner in the app to update the server URL without rebuilding!

#### Run Flutter Automated Tests

```bash
cd app
flutter test
```

---

## Core Technical Features

### 1. Bidirectional Contextual Translation with GPT-6 Luna
- **Patient → Doctor**: Translates patient's language (`hi-IN` or `mr-IN`) into doctor's language (`en-IN` or configured language).
- **Doctor → Patient**: Translates doctor's speech into patient's language and synthesizes spoken audio via **Gnani Timbre TTS**.
- **Skip Logic**: Same-language speech turns bypass translation model calls.
- **Single-Call Canonicalization**: When translating between non-English languages, one structured GPT-6 Luna call provides both the recipient translation and the canonical English text.

### 2. English-Only Canonical Data Storage
- Medical records, transcripts, summaries, doctor notes, and search data are strictly stored in **canonical English** in `transcripts` and `clinical_records`.
- Non-English transcripts are never stored in the clinical tables.

### 3. Persistent Encrypted Translation Cache
- Prevents repeated model calls for identical clinical phrases.
- **Key Lookup**: Keyed HMAC-SHA256 of normalized source text (no plaintext in keys).
- **At-Rest Security**: AES-256-GCM encrypted target-language text.
- **Direction Independence**: `hi-IN → en-IN` cache is separate from `en-IN → hi-IN`.
- Includes TTL (90 days) and cache management endpoints (`/api/v1/cache/stats`, `/api/v1/cache/purge`).

### 4. Gnani Speech AI Integration
- **STT**: Gnani Prisma v2.5 (`GNANI_API_KEY`) with code-mixed Hindi-English and Marathi-English transcription.
- **TTS**: Gnani Timbre v2.5 with Hindi (`hi_female_1`), Marathi (`mr_female_1`), and English voices.
- **Echo Mitigation**: Single-device audio safety pauses and locks microphone capture while synthesized TTS is playing.
- **Offline / Mock Mode**: Deterministic fallback services ensure 100% offline development and automated test capability.

### 5. Physician-Supervised Draft & Follow-up SMS
- AI drafts structured symptoms, duration, and stated history.
- AI **never** creates or confirms diagnoses or prescriptions autonomously.
- Doctor reviews, edits, and approves the record with reviewer ID and timestamp recorded.
- Minimal appointment follow-up SMS dispatched with doctor name, clinic name, and date/time only; clinical diagnoses are strictly excluded.

---

## Integration Status: Real vs. Mock

| Component | Architecture Role | Real Provider Implementation | Fallback / Mock Mode | Tested Status |
|---|---|---|---|---|
| **STT** | Speech-to-Text | Gnani Prisma v2.5 REST (`GNANI_API_KEY`) | `MockSTTService` (deterministic scripted audio) | **Verified** with real client & mock adapter |
| **TTS** | Speech Synthesis | Gnani Timbre v2.5 REST (`GNANI_API_KEY`) | `MockTTSService` (generates valid 16kHz WAV) | **Verified** with live audio playback |
| **Translation** | Contextual Translation | OpenAI GPT-6 Luna Responses API (`OPENAI_API_KEY`) | Local Clinical Translation Engine (exact medical mapping) | **Verified** with bidirectional tests & cache hit tests |
| **Extraction** | Structured Draft | OpenAI GPT-6 Luna Structured Outputs | Schema-validated deterministic extractor | **Verified** with strict Pydantic checks |
| **Translation Cache** | API Minimization | PostgreSQL / SQLite AES-GCM encrypted cache | N/A (Always real encrypted DB persistence) | **Verified** with HMAC lookup & encryption tests |
| **Database** | Clinical Persistence | PostgreSQL (production) & SQLite (local/test) | N/A (Fully functional SQLAlchemy 2.0 async) | **Verified** with Alembic migrations & pytest |
| **SMS Gateway** | Appointment Reminder | Configurable SMS Provider | `MockSMSProvider` with privacy keyword assertion | **Verified** with privacy assertion tests |

---

## Documentation Links

- [System Architecture & Data Flows](docs/architecture.md)
- [API Integration Notes & Provider Details](docs/api-integration-notes.md)
- [Hackathon Demonstration Script](docs/demo-script.md)
- [Physical Mobile Phone Testing Guide](docs/mobile-testing.md)

