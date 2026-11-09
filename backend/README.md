# SwasthyaSetu Backend API

FastAPI backend orchestrating multilingual medical consultation speech recognition, OpenAI GPT-6 Luna bidirectional contextual translation, persistent encrypted SQLite translation caching, English canonical clinical persistence, AI draft generation, doctor approval, and follow-up appointment tracking.

---

## Architecture & Core Features

1. **Bidirectional Translation with GPT-6 Luna**:
   - Patient → Doctor translation (`hi-IN`/`mr-IN` → `en-IN`/doctor language).
   - Doctor → Patient translation (`en-IN`/doctor language → `hi-IN`/`mr-IN`).
   - Reusable prompt caching instructions with strict medical preservation rules (negation, units, dosages, duration, brand names).
2. **Canonical English Storage Rule**:
   - English is the canonical language for all persisted clinical records, summaries, notes, and search data.
   - Raw non-English transcript text is strictly excluded from clinical tables (`transcripts`, `clinical_records`).
3. **Encrypted Translation Cache on SQLite**:
   - Sensitive translated target-language text is encrypted at rest using AES-GCM.
   - Key lookup uses keyed HMAC-SHA256 (no plaintext stored in keys).
   - Exact repeated phrase with identical language pair returns cached translation with zero OpenAI API calls.
   - Cache purge and metrics endpoints (`/api/v1/cache/stats`, `/api/v1/cache/purge`).
4. **Speech-to-Text & Text-to-Speech (Male Voices)**:
   - Gnani Prisma v2.5 STT REST adapter.
   - Gnani Timbre v2.5 TTS REST adapter with default male voice selection (`hi_male_1`, `mr_male_1`, `en_male_1`).
   - Mock adapters for offline development and instant automated test verification.
5. **Doctor-Supervised Clinical Records**:
   - Structured draft extraction using GPT-6 Luna Structured Outputs.
   - Prescriptions and diagnoses remain unconfirmed until explicitly entered/approved by the doctor.
   - Doctor approval writes immutable clinical record with reviewer ID and timestamp.
6. **Physical Phone LAN Readiness**:
   - Binds to `0.0.0.0:8000` to allow phones on the same Wi-Fi network to connect.
   - Serves the mobile-optimized HTML/CSS/JS frontend directly at `/`.

---

## Environment Variables (`.env.example`)

SwasthyaSetu defaults to local SQLite out of the box with zero setup required.
If you wish to supply live API keys, copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Key environment configurations:
- `DATABASE_URL`: `sqlite+aiosqlite:///./swasthyasetu.db` (Default local high-performance SQLite)
- `OPENAI_API_KEY`: Your OpenAI API key (for GPT-6 Luna)
- `OPENAI_MODEL`: `gpt-6-luna`
- `GNANI_API_KEY`: Your Gnani AI API key
- `GNANI_VOICE_HI`: `hi_male_1` (Default male voice)
- `GNANI_VOICE_MR`: `mr_male_1` (Default male voice)
- `GNANI_VOICE_EN`: `en_male_1` (Default male voice)
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

# 4. Run automated tests (16 passing tests)
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
| `GET` | `/` | Web Frontend Single Page Application |
| `GET` | `/health` | Health check, DB connection status, local LAN IP |
| `GET` | `/api/v1/doctor/settings` | Retrieve doctor profile & preferred language |
| `PUT` | `/api/v1/doctor/settings` | Update doctor profile & preferred language |
| `GET` | `/api/v1/patients` | List patients with consultation history |
| `POST` | `/api/v1/patients` | Register new patient |
| `POST` | `/api/v1/consultations` | Start a new consultation session |
| `POST` | `/api/v1/consultations/{id}/turns` | Upload audio or text turn, translate, synthesize |
| `GET` | `/api/v1/consultations/{id}/draft` | Generate/retrieve AI structured clinical draft |
| `POST` | `/api/v1/consultations/{id}/approve` | Doctor review & approve clinical record |
| `POST` | `/api/v1/consultations/{id}/followup` | Save follow-up appointment (stored locally) |
| `GET` | `/api/v1/cache/stats` | Translation cache hit/miss and entry statistics |
| `POST` | `/api/v1/cache/purge` | Purge expired or all cache entries |
