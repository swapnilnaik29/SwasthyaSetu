# SwasthyaSetu — Hackathon Demonstration Script

This script provides an exact step-by-step walkthrough of the official SwasthyaSetu demonstration scenario, covering code-mixed speech, bidirectional translation, translation caching, canonical English clinical record creation, doctor draft review, approval, and local appointment follow-up storage.

---

## Preparation & Prerequisites

1. **Start Backend**:
   ```powershell
   cd backend
   .\.venv\Scripts\Activate.ps1
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
2. **Access Web Frontend**:
   - On Desktop: Open `http://localhost:8000/`
   - On Mobile Phone: Open `http://192.168.1.4:8000/` in Chrome or Safari (same Wi-Fi)
3. **Verify Connection**:
   - The green pill at the top shows:
     `Connected (http://192.168.1.4:8000)`

---

## Step-by-Step Demonstration Flow

### Scene 1: Doctor Profile & App Settings
1. Open the app to the **Dashboard**.
2. Tap the **Settings icon** in the top-right corner.
3. Observe doctor profile:
   - Name: `Dr. Priya Sharma`
   - Credentials: `MBBS, MD (General Medicine)`
   - Preferred Language: `English (Indian) [en-IN]`
   - Messaging: `Local Mode (SMS reserved for future provider)`
4. Tap **Back** to return to the Dashboard.

### Scene 2: Selecting or Registering a Patient
1. On the Dashboard, find the pre-seeded patient **Ramesh Kumar**:
   - Age: `38 years`
   - Mobile: `9876543210`
   - Preferred Language: `Hindi (हिंदी) [hi-IN]`
2. Tap on Ramesh Kumar's card to view his **Patient Profile & Consultation History**.
3. Tap the green button: **"Start New Consultation"**.

---

### Scene 3: The Live Consultation Session

The Consultation screen opens showing:
- Language Pair: `Patient: Hindi (हिंदी) ↔ Doctor: English (Indian)`
- Turn-wise active speaker toggle: `[PATIENT SPEAKS] | [DOCTOR SPEAKS]`
- Turn direction banner: `Patient Speaks (Hindi) ➔ Doctor Listens (English)`

#### Turn 1: Patient Speaks in Code-Mixed Hindi
1. Ensure **PATIENT SPEAKS** is selected (Amber button is active).
2. Tap the **Microphone Button** (or tap Demo Presets):
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

#### Turn 2: Doctor Speaks in English with Hindi Audio Output (Male Voice)
1. Tap **DOCTOR SPEAKS** (Blue button is active).
2. The banner updates: `Doctor Speaks (English) ➔ Patient Listens (Hindi)`.
3. Tap the **Microphone Button** (or tap Demo Presets and select the prescription phrase):
   > *"Take paracetamol 500mg twice daily after meals for three days."*
4. Tap **Stop Record** (or submit preset).
5. Observe the timeline tile:
   - Speaker: **DOCTOR** (`en-IN → hi-IN`)
   - Recipient Translation: *"पैरासिटामोल 500 मिलीग्राम खाने के बाद दिन में दो बार तीन दिनों तक लें।"*
   - The device speaker immediately plays the synthesized Hindi speech in a **male voice** (`hi_male_1`) via **Gnani Timbre TTS**!
   - Note that recording is locked while audio plays, preventing microphone feedback.

#### Turn 3: Demonstrating the Persistent Encrypted Translation Cache
1. Tap **PATIENT SPEAKS**.
2. Re-enter the exact same phrase:
   > *"Mujhe three days se fever hai aur headache bhi hai."*
3. Notice that the turn completes **instantaneously** (0-10ms).
4. An amber badge appears: **`CACHED ⚡`**.
5. Explain to the judges:
   - *"The backend computed the keyed HMAC-SHA256 hash of the normalized utterance, found an exact cache hit in the local SQLite database, decrypted the stored translation using AES-GCM, and skipped calling GPT-6 Luna completely, minimizing latency and API expense."*

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
5. Point out to judges:
   - *"The AI explicitly leaves diagnoses and prescriptions empty. Clinical liability demands doctor-confirmed actions only."*

---

### Scene 5: Doctor Editing, Prescription & Approval
1. In the **Doctor Diagnosis** field, type:
   > `Acute Viral Fever with tension headache`
2. In the **Doctor Notes** field, type:
   > `Patient advised rest, hydration, and light diet.`
3. Under **Prescriptions**, add:
   - Medication: `Paracetamol`
   - Dosage: `500mg`
   - Frequency: `Twice daily after meals`
   - Duration: `3 days`
   - Instructions: `Take with water after food`
4. Tap the blue button: **"Approve & Finalize Record"**.
5. The view updates with the **Approved Clinical Record**:
   - Status: `APPROVED`
   - Approved By: `Dr. Priya Sharma (Doctor #1)`
   - Storage Language: `Canonical English strictly`

---

### Scene 6: Appointment Follow-up Storage
1. In the Follow-up section, select:
   - Date: `+3 days from today`
   - Notes: `Review if fever persists beyond 3 days`
2. Tap **"Schedule Follow-up"**.
3. Confirmation banner appears:
   - *"Follow-up scheduled and saved to local SQLite database."*
   - Doctor Name: `Dr. Priya Sharma`
   - Clinic: `City Health Clinic`
   - Privacy guarantee: No clinical diagnoses or prescription details are transmitted.
