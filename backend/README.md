# SwasthyaSetu Backend API & Web Application
**Gnani.ai AI Internship Hackathon Submission**

High-performance FastAPI service powering SwasthyaSetu's multilingual clinical communication suite. It hosts the REST API (`/api/v1`) and serves the integrated web frontend directly at `/`.

---

## Core Capabilities

1. **Gnani.ai Speech Intelligence**:
   - High-accuracy Speech-to-Text (STT) supporting 11 Indian languages.
   - Text-to-Speech (TTS) with contextual persona selection (Male doctor voices, Female intake assistant voices, and dynamic patient gender voices).
2. **Contextual Translation & Ambient Clinical Scribing**:
   - Turn-by-Turn bidirectional translation.
   - Ambient Clinical Scribe mode that passively listens to continuous doctor-patient dialogue, transcribes, translates to clinical English, and structures complete clinical reports and vitals.
3. **Canonical English Storage in SQLite (WAL Mode)**:
   - High-throughput asynchronous persistence via SQLAlchemy and SQLite WAL mode.
   - Standardized clinical English EHR records for hospital interoperability.
4. **Zero-Latency UI Localization Cache**:
   - Pre-seeded and cached UI translations across 11 Indic languages for immediate switching.
5. **Render Cloud Ready**:
   - Configured with `render.yaml`, `Procfile`, and dynamic port binding (`$PORT`) for one-click deployment.

---

## Running Locally

```bash
# Navigate to backend
cd backend

# Setup virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # On Windows
# source .venv/bin/activate    # On Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- Web UI: `http://localhost:8000/`
- API Docs: `http://localhost:8000/docs`

---

## Running Backend Tests

```bash
.venv\Scripts\python -m pytest tests/test_consultation_flow.py tests/test_provider_adapters.py -v
```

---

## Render Deployment

This directory contains `render.yaml`, `Procfile`, and `runtime.txt`. You can deploy this directory directly on Render as a Python Web Service. Set `GNANI_API_KEY` and `OPENAI_API_KEY` as environment variables in the Render dashboard.

---

## Submission Credits

- **Project**: SwasthyaSetu
- **Hackathon**: Gnani.ai AI Internship Hackathon
- **Developer**: Swapnil Naik

