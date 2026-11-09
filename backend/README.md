# SwasthyaSetu Backend API

FastAPI backend orchestrating multilingual medical consultation speech recognition, OpenAI GPT-6 Luna bidirectional contextual translation, persistent encrypted translation caching, English canonical clinical persistence, AI draft generation, doctor approval, and follow-up appointment SMS dispatch.

---

## Architecture & Core Features

1. **Bidirectional Translation with GPT-6 Luna**:
   - Patient → Doctor translation (`hi-IN`/`mr-IN` → `en-IN`/doctor language).
   - Doctor → Patient translation (`en-IN`/doctor language → `hi-IN`/`mr-IN`).
   - Reusable prompt caching instructions with strict medical preservation rules (negation, units, dosages, duration, brand names).
2. **Canonical English Storage Rule**:
   - English is the canonical language for all persisted clinical records, summaries, notes, and search data.
   - Raw non-English transcript text is strictly excluded from clinical tables (`transcripts`, `clinical_records`).
3. **Encrypted Translation Cache**:
   - Sensitive translated target-language text is encrypted at rest using AES-GCM.
   - Key lookup uses keyed HMAC-SHA256 (no plaintext stored in keys).
   - Exact repeated phrase with identical language pair returns cached translation with zero OpenAI API calls.
   - Cache purge and metrics endpoints (`/api/v1/cache/stats`, `/api/v1/cache/purge`).
4. **Speech-to-Text & Text-to-Speech**:
   - Gnani Prisma v2.5 STT REST adapter.
   - Gnani Timbre v2.5 TTS REST adapter with language-specific voice selection.
   - Mock adapters for offline development and instant automated test verification.
5. **Doctor-Supervised Clinical Records**:
   - Structured draft extraction using GPT-6 Luna Structured Outputs.
   - Prescriptions and diagnoses remain unconfirmed until explicitly entered/approved by the doctor.
   - Doctor approval writes immutable clinical record with reviewer ID and timestamp.
6. **Physical Phone LAN Readiness**:
   - Binds to `0.0.0.0:8000` to allow phones on the same Wi-Fi network to connect.

---

## Environment Variables (`.env`)

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Key environment configurations:
- `DATABASE_URL`: `postgresql+psycopg://postgres:postgres@localhost:5432/swasthyasetu` (or `sqlite+aiosqlite:///./swasthyasetu.db` for zero-setup local dev)
- `OPENAI_API_KEY`: Your OpenAI API key (for GPT-6 Luna)
- `OPENAI_MODEL`: `gpt-6-luna`
- `GNANI_API_KEY`: Your Gnani AI API key
- `TRANSLATION_CACHE_ENCRYPTION_KEY`: 32-byte base64 encryption key
- `TRANSLATION_CACHE_HMAC_KEY`: Secret string for HMAC hashing

---

## Setup & Running

### Windows PowerShell

```powershell
# 1. Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 2. Install dependencies
pip install -r requirements.txt

# 3. Apply database migrations
alembic upgrade head

# 4. Run automated tests
pytest tests -v

# 5. Start backend server (listening on 0.0.0.0 for physical phone LAN access)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### macOS / Linux

```bash
# 1. Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Apply database migrations
alembic upgrade head

# 4. Run automated tests
pytest tests -v

# 5. Start backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## API Endpoints (`/api/v1`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check, DB connection status, local LAN IP |
| `GET` | `/api/v1/doctor/settings` | Retrieve doctor profile & preferred language |
| `PUT` | `/api/v1/doctor/settings` | Update doctor profile & preferred language |
| `GET` | `/api/v1/patients` | Search & list patients (`?q=`) |
| `POST` | `/api/v1/patients` | Register new patient |
| `GET` | `/api/v1/patients/{id}` | Patient details |
| `PATCH` | `/api/v1/patients/{id}` | Update patient details |
| `GET` | `/api/v1/patients/{id}/consultations` | Patient consultation history |
| `POST` | `/api/v1/consultations` | Start consultation session |
| `GET` | `/api/v1/consultations/{id}` | Consultation status & details |
| `POST` | `/api/v1/consultations/{id}/turns` | Process audio or text speech turn (STT → Translation → Canonical English → TTS) |
| `GET` | `/api/v1/consultations/{id}/transcripts` | List canonical English transcripts |
| `PATCH` | `/api/v1/transcripts/{id}` | Doctor correction of transcript text |
| `POST` | `/api/v1/consultations/{id}/draft` | Generate structured AI draft via GPT-6 Luna |
| `GET` | `/api/v1/consultations/{id}/draft` | View draft |
| `PATCH` | `/api/v1/consultations/{id}/draft` | Doctor edit draft fields |
| `POST` | `/api/v1/consultations/{id}/approve` | Doctor approval → commits official clinical record |
| `POST` | `/api/v1/consultations/{id}/reject` | Reject draft |
| `POST` | `/api/v1/consultations/{id}/followups` | Schedule follow-up & send minimal appointment reminder SMS |
| `GET` | `/api/v1/consultations/{id}/followups` | View scheduled follow-ups |
| `GET` | `/api/v1/audio/{audio_id}` | Serve synthesized TTS audio for phone playback |
| `GET` | `/api/v1/cache/stats` | Translation cache hit/miss statistics |
| `POST` | `/api/v1/cache/purge` | Purge translation cache |
