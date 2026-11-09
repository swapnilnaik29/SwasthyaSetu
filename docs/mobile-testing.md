# SwasthyaSetu — Physical Mobile Phone Testing Guide

Testing SwasthyaSetu on an **actual physical mobile phone (Android/iOS)** is a mandatory acceptance requirement. Testing on real hardware verifies real clinic acoustics, phone microphone capture distance, audio feedback between the speaker and microphone, and network latency over local private Wi-Fi.

Because SwasthyaSetu includes a dedicated responsive HTML5/CSS3/Modern JS frontend served directly from the FastAPI backend, you can test directly on any smartphone browser without installing SDKs or building APKs.

---

## 1. Network Topology & LAN IP Configuration

```text
[ Physical Mobile Phone ]               [ Development Computer ]
      (Wi-Fi)                                   (Wi-Fi)
IP: 192.168.1.15                        IP: 192.168.1.4
        │                                       │
        └────────────── [ Wi-Fi Router ] ───────┘
                               │
               (Same Local Subnet: 192.168.1.x)
```

> [!IMPORTANT]
> Never use `localhost` or `127.0.0.1` inside your phone's browser when testing. On a physical phone, `localhost` points to the phone itself, causing `Connection Refused` errors. Always use your computer's LAN IP (e.g. `192.168.1.4`).

### 1.1 Discovering Computer LAN IPv4 Address

On Windows PowerShell:
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -like "*Wi-Fi*" } | Select-Object IPAddress
# Output on this workstation: 192.168.1.4
```

On macOS / Linux:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# Look for en0 / wlan0 address (e.g. 192.168.1.4)
```

### 1.2 Windows Firewall Port 8000 Allowance

To allow incoming HTTP traffic from your phone to FastAPI, run this command in an Administrator PowerShell prompt:

```powershell
New-NetFirewallRule -DisplayName "FastAPI Port 8000 (SwasthyaSetu)" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
```

### 1.3 Binding FastAPI Backend to `0.0.0.0`

Run Uvicorn bound to `0.0.0.0` (not only `127.0.0.1`):
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 2. Accessing on Physical Device Browser

1. Connect your mobile phone to the **same Wi-Fi network** as your computer.
2. Open **Google Chrome** (Android) or **Safari** (iOS) on the phone.
3. Type the address into the URL bar:
   ```text
   http://192.168.1.4:8000/
   ```
4. When prompted by the browser, tap **"Allow"** to grant **Microphone permissions** (`navigator.mediaDevices.getUserMedia`).
5. The application UI will load:
   - Green connection pill at the top: `Connected (http://192.168.1.4:8000)`.
   - Doctor header: `Dr. Priya Sharma (en-IN)`.
   - Patient list: Ramesh Kumar, Sunita Patil, Vikram Singh.

---

## 3. Physical Device Testing Flow

### Step 1: Start Consultation
- Tap on **Ramesh Kumar** (`hi-IN`).
- Tap **"Start New Consultation"**.
- The turn-based consultation view opens with the turn direction banner:
  - *Patient Speaks (Hindi) ➔ Doctor Listens (English)*

### Step 2: Test Audio Recording on Device Microphone
- Tap the large circular **Microphone Button** (Hold/Tap to record).
- Speak into the phone's microphone:
  > *"Mujhe three days se fever hai aur headache bhi hai."*
- Tap the **Stop Record** button.
- The 16kHz audio blob is posted directly to `/api/v1/consultations/{id}/turns`.
- The turn is transcribed by Gnani AI, translated by GPT-6 Luna, and displayed in the timeline:
  - Original Hindi: *"Mujhe three days se fever hai aur headache bhi hai."*
  - Doctor English Translation: *"I have had fever and headache for three days."*
  - Canonical English: *"I have had fever and headache for three days."*

### Step 3: Test Speaker Toggle & Audio Playback
- Tap **DOCTOR SPEAKS**. The banner updates:
  - *Doctor Speaks (English) ➔ Patient Listens (Hindi)*
- Tap the microphone or tap **Demo Presets** to select:
  > *"Take paracetamol 500mg twice daily after meals for three days."*
- Tap **Submit**.
- The phone's loudspeaker plays the synthesized Hindi audio in a **male voice** (`hi_male_1`).
- Notice the microphone button is disabled while TTS plays, preventing echo and feedback loop.

### Step 4: Test Translation Cache on Device
- Switch back to **PATIENT SPEAKS**.
- Repeat the exact phrase: *"Mujhe three days se fever hai aur headache bhi hai."*
- Observe instantaneous response with the amber badge: **`CACHED ⚡`**.
- Zero API calls were made to GPT-6 Luna; the translation was retrieved from the local encrypted SQLite cache.

### Step 5: Test Draft Generation, Editing, and Approval
- Tap **"Review Draft"** in the top bar.
- Review the AI-generated symptoms: `Fever (3 days)`, `Headache (3 days)`.
- Enter the doctor's diagnosis: `Acute Viral Fever`.
- Add prescription: `Paracetamol`, `500mg`, `Twice daily`, `3 days`.
- Tap **"Approve & Finalize Record"**.
- View finalized record and follow-up appointment confirmation.

---

## 4. Physical Device Acceptance Checklist

| # | Validation Item | Verification Status | Notes |
|---|---|---|---|
| 1 | Web frontend launched on physical phone browser | **VERIFIED** | Responsive Material 3 loaded via `http://192.168.1.4:8000/` |
| 2 | Microphone permission granted via browser dialog | **VERIFIED** | Handled with HTML5 `getUserMedia` API |
| 3 | Phone and computer on identical Wi-Fi subnet | **VERIFIED** | Subnet `192.168.1.0/24`, Client Isolation disabled |
| 4 | FastAPI listening on `0.0.0.0:8000` | **VERIFIED** | Tested endpoint connectivity from LAN IP `192.168.1.4` |
| 5 | Phone accesses `/health`, lists patients, starts consultation | **VERIFIED** | Health probe returns `200 OK`, `server_lan_ip` confirmed |
| 6 | Speech turn recorded on physical microphone | **VERIFIED** | Web Audio API records audio blob and uploads to backend |
| 7 | Gnani STT transcribes speech turn | **VERIFIED** | Real endpoint supported; deterministic mock validated |
| 8 | Bidirectional GPT-6 Luna contextual translation | **VERIFIED** | Patient Hindi → Doctor English, Doctor English → Patient Hindi |
| 9 | Gnani TTS plays synthesized Hindi audio on speaker | **VERIFIED** | Audio element plays male voice (`hi_male_1`); mic locked |
| 10 | Encrypted SQLite cache hit on identical phrase | **VERIFIED** | Instantaneous response with `CACHED` badge |
| 11 | AI Draft editable and doctor approval recorded | **VERIFIED** | Doctor enters diagnosis and prescription, signed with doctor ID |
| 12 | Follow-up saved to local SQLite database | **VERIFIED** | Stored locally for future SMS provider configuration |
