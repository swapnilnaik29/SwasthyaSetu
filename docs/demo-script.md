# SwasthyaSetu — Hackathon Demonstration Script

This script provides an exact step-by-step walkthrough of the official SwasthyaSetu demonstration scenario, covering code-mixed speech, bidirectional translation, translation caching, canonical English clinical record creation, doctor draft review, approval, and appointment SMS dispatch.

---

## Preparation & Prerequisites

1. **Start Backend**:
   ```powershell
   cd backend
   .\.venv\Scripts\Activate.ps1
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
2. **Launch Flutter App**:
   - On physical phone or emulator:
   ```bash
   cd app
   flutter run --dart-define=API_BASE_URL=http://192.168.1.4:8000
   ```
3. **Verify Connection**:
   - The green banner at the top of the app will show:
     `Connected to Backend (http://192.168.1.4:8000)`

---

## Step-by-Step Demonstration Flow

### Scene 1: Doctor Profile & Language Configuration
1. Open the app to the **Dashboard**.
2. Tap the **Settings icon** in the top-right corner.
3. Observe doctor profile:
   - Name: `Dr. Priya Sharma`
   - Credentials: `MBBS, MD (General Medicine)`
   - Preferred Language: `English (Indian) [en-IN]`
4. Return to the Dashboard.

### Scene 2: Selecting or Registering a Patient
1. On the Dashboard, find the pre-seeded patient **Ramesh Kumar**:
   - Age: `38 years`
   - Mobile: `9876543210`
   - Preferred Language: `Hindi (हिंदी) [hi-IN]`
2. Tap on Ramesh Kumar's card to view his **Patient Profile**.
3. Tap the green button: **"Start New Consultation"**.

---

### Scene 3: The Live Consultation Session

The Consultation screen opens showing:
- Language Pair: `Patient: Hindi (हिंदी) ↔ Doctor: English (Indian)`
- Active Speaker Selector: `[PATIENT SPEAKS] | [DOCTOR SPEAKS]`

#### Turn 1: Patient Speaks in Code-Mixed Hindi
1. Select **PATIENT SPEAKS** (Amber button is active).
2. Tap the **Microphone Button** (or tap the keyboard icon and paste):
   > *"Mujhe three days se fever hai aur headache bhi hai."*
3. Tap **Stop Record**.
4. Observe the pipeline progress:
   - `Transcribing speech with Gnani AI...`
   - `Translating with GPT-6 Luna...`
   - `Turn completed`.
5. Observe the new tile in the timeline:
   - Speaker: **PATIENT** (`hi-IN → en-IN`)
   - Recognized Speech: *"Mujhe three days se fever hai aur headache bhi hai."*
   - Doctor's Translation: *"I have had fever and headache for three days."*
   - Canonical English Record: *"I have had fever and headache for three days."*
   - Flag: `code_mixed_hindi_english`

#### Turn 2: Doctor Speaks in English with Hindi Audio Output
1. Select **DOCTOR SPEAKS** (Blue button is active).
2. Tap the **Microphone Button** (or tap Demo Presets and select the prescription phrase):
   > *"Take paracetamol 500mg twice daily after meals for three days."*
3. Tap **Stop Record**.
4. Observe the timeline tile:
   - Speaker: **DOCTOR** (`en-IN → hi-IN`)
   - Recipient Translation: *"पैरासिटामोल 500 मिलीग्राम खाने के बाद दिन में दो बार तीन दिनों तक लें।"*
   - The phone speaker immediately synthesizes and speaks the translated Hindi sentence aloud via **Gnani Timbre TTS**!
   - Note that recording is locked while audio plays, preventing microphone echo.

#### Turn 3: Demonstrating the Persistent Encrypted Translation Cache
1. Select **PATIENT SPEAKS**.
2. Re-enter the exact same phrase:
   > *"Mujhe three days se fever hai aur headache bhi hai."*
3. Notice that the turn completes **instantaneously**.
4. An amber badge appears: **`CACHED ⚡`**.
5. Explain to the judges:
   - *"The backend computed the keyed HMAC-SHA256 hash of the normalized utterance, found an exact cache hit in the database, decrypted the stored translation using AES-GCM, and skipped calling GPT-6 Luna completely, saving latency and API cost."*

---

### Scene 4: AI Draft Medical Record Review
1. Tap the top-right button: **"Review Draft"**.
2. The AI generates the structured clinical draft via GPT-6 Luna.
3. Observe the prominent amber banner:
   - **`AI-GENERATED DRAFT — PENDING DOCTOR REVIEW`**
4. Verify the extracted fields:
   - **Patient-Reported Symptoms**: `Fever (3 days)`, `Headache (3 days)`
   - **Medical History**: `Not stated in the conversation`
   - **Allergies**: `Not stated`
   - **Doctor Confirmed Diagnosis**: `Not specified; doctor to enter or confirm`
   - **Prescriptions**: `Empty []`
5. Highlight to judges:
   - *"Notice that the AI did not hallucinate a diagnosis or prescribe drugs on its own. Clinical integrity requires doctor confirmation."*

---

### Scene 5: Doctor Editing & Official Approval
1. The doctor taps the **Doctor Confirmed Diagnosis** box and enters:
   > `Acute Viral Pyrexia with Tension Headache`
2. The doctor taps **"Add Medicine"**:
   - Medicine: `Tab Paracetamol`
   - Strength: `500mg`
   - Dose: `1 tablet`
   - Frequency: `Twice daily`
   - Duration: `3 days`
   - Instructions: `After food`
   - Tap **Add**.
3. Tap the green button: **"Approve & Save Official Record"**.
4. The system validates the draft, updates the status to `APPROVED`, records the doctor ID and approval timestamp, and writes the official record to `clinical_records`.

---

### Scene 6: Appointment Follow-up & Minimal Reminder SMS
1. The screen transitions to **Consultation Completed**.
2. A green confirmation banner confirms:
   `CLINICAL RECORD APPROVED & COMMITTED (Canonical English)`
3. The doctor chooses the follow-up appointment date (3 days from today, 10:30 AM).
4. Confirms patient mobile number (`9876543210`).
5. Tap **"Schedule & Send SMS Reminder"**.
6. A confirmation badge appears:
   `SMS Dispatched! Status: SENT (Ref: sms_mock_...)`
7. Highlight privacy compliance to judges:
   - *"The SMS message body contains only clinic name, doctor name, and appointment date/time. Diagnoses and paracetamol are strictly absent to safeguard patient privacy over ordinary SMS."*
8. Tap **"Return to Dashboard"** to conclude the demo.
