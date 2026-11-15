# SwasthyaSetu Backend API & Web Application
### High-Performance FastAPI Clinical Communication & Autonomous Scribing Service

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![Gnani.ai](https://img.shields.io/badge/Gnani.ai-Vachana%20TTS%20%7C%20Prisma%20STT-059669?style=for-the-badge&logo=sound)](https://gnani.ai/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--6%20Luna%20%7C%20Structured%20Outputs-412991?style=for-the-badge&logo=openai)](https://openai.com/)
[![Database](https://img.shields.io/badge/Database-SQLite%20Async%20WAL-4479A1?style=for-the-badge&logo=sqlite)](https://www.sqlite.org)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python)](https://python.org)

The backend is an asynchronous Python service built on **FastAPI** powering SwasthyaSetu's multilingual clinical communication suite. It serves the dynamic REST API at `/api/v1` and serves the integrated Single-Page Web Frontend (SPA) directly at `/`.

---

## 📌 Problem Statement & Solution

- **The Problem**: In Indian healthcare, over 70% of clinical consultations outside metros experience language discordance. Patients articulate symptoms in 11+ Indic regional languages, while physicians document in English EHRs. This leads to diagnostic errors, drug dosage confusions, and 2–3 hours of daily physician burnout spent typing notes.
- **The Solution**: SwasthyaSetu provides a real-time, voice-first clinical pipeline with:
  1. Instant speech-to-speech interpretation via **Gnani.ai Vachana TTS** and **Prisma STT**.
  2. Autonomous SOAP medical documentation, translation, and triage via **OpenAI GPT-6 Luna**.
  3. Pre-consultation conversational voice triage via **Aarogya Mitra (आरोग्य मित्र)**.
  4. Complete physician-in-the-loop review and approval before committing canonical medical records.

---

## 🔄 Four Dedicated Operating Modes Supported by Backend

1. **Mode 1: Conversational AI Patient Intake (आरोग्य मित्र / Aarogya Mitra)**:
   - `POST /api/v1/patients/intake/validate`: Validates patient speech in real-time for name, age, phone, chief complaints, and allergies, returning polite conversational reprompts if answers are off-topic.
   - `POST /api/v1/patients/intake`: Submits the completed 5-step intake, creating the patient and pre-generating canonical English clinical briefings.
2. **Mode 2: Bilingual Turn-by-Turn Consultation**:
   - `POST /api/v1/consultations/{id}/turns`: Processes audio/text dialogue turns. Doctor speaks English ➔ Patient receives synthesized Indic speech via Gnani TTS; Patient speaks vernacular ➔ Doctor receives medical English text & speech.
3. **Mode 3: Ambient Background Clinical Scribe Mode**:
   - `POST /api/v1/consultations/{id}/scribe`: Continuous ambient room recording. Background multi-speaker diarization separates doctor instructions from patient answers, synthesizing a structured SOAP clinical note, vitals, and prescription orders without manual button clicking.
4. **Mode 4: Doctor AI Voice Scribe Assistant Mode**:
   - `POST /api/v1/consultations/{id}/ai-assist`: Dictation assistant for physicians to speak vitals (BP, pulse, temp, SpO2, weight) or examination findings directly into structured clinical parameters.

---

## 🛠️ Technology Stack & Specific APIs

| Service | Model / Specification | Exact Endpoint / Interface | Purpose |
|---|---|---|---|
| **Gnani.ai Vachana TTS** | `timbre-v2.5` | `POST https://api.vachana.ai/api/v1/tts/inference` | Generates 11 authentic Indian male and female regional voices (16kHz WAV streaming). |
| **Gnani.ai Prisma STT** | `prisma-v2.5` | `POST https://api.vachana.ai/stt/v3` | Transcribes 11 Indic languages with noise tolerance and code-mixing support. |
| **Resilient STT Fallback** | OpenAI Whisper `whisper-1` | `POST https://api.openai.com/v1/audio/transcriptions` | Instant fallback if primary speech service is unavailable. |
| **OpenAI GPT-6 Luna** | `gpt-6-luna` | Structured Outputs (`response_format: json_schema`) | Bidirectional clinical translation, canonical English archival, intake validation, SOAP note structuring, vitals extraction, and prescription dosage formatting. |
| **FastAPI Framework** | Python 3.10+ | Uvicorn ASGI Server | High-concurrency async REST routes, streaming audio responses, and SPA static mount. |
| **SQLAlchemy 2.0 ORM** | Async SQLite WAL | `sqlite+aiosqlite:///swasthyasetu.db` | High-throughput async database with cascading orphan deletion. |

---

## 🗣️ Indic Voices Mapping (Gnani.ai)

| Language | Code | Male Voice (Doctor Persona) | Female Voice (Aarogya Mitra / Patient Persona) |
|---|---|---|---|
| Hindi | `hi-IN` | **Deepak** | **Nalini** |
| Marathi | `mr-IN` | **Omkar** | **Kaveri** |
| Indian English | `en-IN` | **Deven** | **Devika** |
| Gujarati | `gu-IN` | **Nirav** | **Dhwani** |
| Bengali | `bn-IN` | **Tanmay** | **Mithu** |
| Tamil | `ta-IN` | **Saravanan** | **Kavitha** |
| Telugu | `te-IN` | **Chaitanya** | **Sandhya** |
| Kannada | `kn-IN` | **Gopal** | **Shweta** |
| Malayalam | `ml-IN` | **Manoj** | **Arya** |
| Punjabi | `pa-IN` | **Amrit** | **Kaur** |
| Odia | `or-IN` | **Subhas** | **Ananya** |

---

## 🗄️ Relational Database & Data Models

- **`Doctor`**: Attending physician profiles (Name, Credentials, Preferred & Spoken Languages).
- **`Patient`**: Patient demographics (Name, Age, Gender, Phone Number, Preferred Language, Chief Complaint).
- **`MedicalHistory`**: Chronic medical conditions and known drug allergies.
- **`Consultation`**: Active/completed clinical sessions (`status`, `mode`, `doctor_id`, `patient_id`).
- **`Transcript`**: Dialogue turns (`speaker`, `source_text`, `translated_text`, `canonical_english`, audio duration).
- **`ConsultationDraft`**: AI-generated drafts (`subjective`, `objective`, `assessment`, `plan`, vitals JSON, prescriptions JSON).
- **`ClinicalRecord`**: Finalized, signed legal medical records ready for hospital audit and export.
- **`Followup`**: Scheduled patient follow-up appointments with reminder tracking.

> **Cascade Deletion**: When a patient is deleted via `DELETE /api/v1/patients/{id}`, all linked medical histories, consultations, transcripts, drafts, clinical records, and follow-ups are automatically deleted.

---

## 🔌 API Endpoints Reference

```text
Patients:
  GET    /api/v1/patients                  - Search/list patients by name or phone
  POST   /api/v1/patients                  - Register patient manually
  POST   /api/v1/patients/intake/validate  - Real-time LLM validation for intake questions
  POST   /api/v1/patients/intake           - Complete 5-step Aarogya Mitra intake
  GET    /api/v1/patients/{id}             - Get patient profile and history
  DELETE /api/v1/patients/{id}             - Permanently delete patient and cascade data
  GET    /api/v1/patients/{id}/reports     - Get historical signed clinical records

Consultations:
  POST   /api/v1/consultations             - Create new consultation session
  GET    /api/v1/consultations/{id}        - Get consultation status and details
  POST   /api/v1/consultations/{id}/turns  - Process turn-by-turn audio/text turn
  POST   /api/v1/consultations/{id}/scribe - Process continuous ambient room recording
  GET    /api/v1/consultations/{id}/draft  - Retrieve active clinical draft (SOAP + vitals)
  PATCH  /api/v1/consultations/{id}/draft  - Modify clinical draft fields
  POST   /api/v1/consultations/{id}/ai-assist - Doctor AI Voice Scribe dictation
  POST   /api/v1/consultations/{id}/approve- Approve & sign clinical draft into EHR
  POST   /api/v1/consultations/{id}/followups - Schedule follow-up appointment

Doctor & Audio:
  GET    /api/v1/doctor/settings           - Get attending doctor profile
  PUT    /api/v1/doctor/settings           - Update doctor name, credentials, languages
  POST   /api/v1/audio/transient           - Store transient audio for browser playback
  GET    /health                           - Service health, database check, LAN IP
```

---

## 🚀 Running Locally

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv .venv

# Windows:
.\.venv\Scripts\Activate.ps1
# Linux / macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and supply your GNANI_API_KEY and OPENAI_API_KEY

# Start backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Web Frontend**: [http://localhost:8000/](http://localhost:8000/)
- **Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Redoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🧪 Running Automated Tests

```bash
python -m pytest tests/test_consultation_flow.py tests/test_provider_adapters.py -v
```

---

## ☁️ Render Cloud Deployment

Deploy directly from GitHub as a **Render Web Service**:
- **Root Directory**: `backend`
- **Environment**: `Python`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables**:
  - `PYTHON_VERSION`: `3.11.9`
  - `DATABASE_URL`: `sqlite+aiosqlite:///swasthyasetu.db`
  - `GNANI_API_KEY`: *(Your Gnani.ai API Key)*
  - `OPENAI_API_KEY`: *(Your OpenAI API Key)*

---

## 👨‍💻 Project Credits

- **Project**: SwasthyaSetu (स्वास्थ्य सेतु)
- **Developer**: **Swapnil Naik**
- **LinkedIn**: [https://www.linkedin.com/in/swapnilnaik29/](https://www.linkedin.com/in/swapnilnaik29/)
- **GitHub**: [https://github.com/swapnilnaik29/SwasthyaSetu](https://github.com/swapnilnaik29/SwasthyaSetu)
