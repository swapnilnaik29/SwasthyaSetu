# SwasthyaSetu Mobile App (Flutter)

Doctor-operated multilingual healthcare communication and clinical documentation mobile application built with Flutter, Material 3, and Riverpod.

---

## Key Features

1. **Turn-Based Multilingual Speech Consultation**:
   - Doctor and patient take turns speaking on a single mobile device.
   - Prominent **Patient** vs. **Doctor** speaker selection before every speech turn.
   - Live speech capture via microphone with wave animation, timer, and automatic stop.
2. **Contextual Translation & TTS Delivery**:
   - Patient speaks (`hi-IN` or `mr-IN`) → translated into doctor's language (`en-IN` or configured language) and displayed in the live consultation timeline.
   - Doctor speaks → translated into patient's language and spoken aloud via Gnani TTS synthesis.
   - Single-device audio echo prevention: mic recording is automatically paused and locked while TTS audio is playing.
3. **Canonical English Record Keeping**:
   - Regardless of the recipient's language, every utterance is canonicalized to standard medical English for persistent health records.
4. **AI-Generated Draft Review & Doctor Approval**:
   - Structured extraction powered by OpenAI GPT-6 Luna.
   - Doctor edits symptoms, confirms diagnosis, and adds prescriptions.
   - Explicit doctor approval converts the draft into an official clinical record.
5. **Patient Follow-up & Minimal Reminder SMS**:
   - Date and time picker for appointment follow-up.
   - Dispatches privacy-compliant SMS containing only clinic name, doctor, and appointment time. Medical diagnoses and prescriptions are strictly excluded.
6. **Physical Phone LAN Testing**:
   - Real-time connection status banner with one-tap configuration of the computer's LAN IP address (`http://192.168.1.4:8000`).

---

## Physical Mobile Phone Setup

### Prerequisites
1. Ensure your mobile phone and development computer are connected to the **same Wi-Fi network**.
2. Verify your computer's private IPv4 address (e.g. `192.168.1.4`).
3. Ensure the FastAPI backend is running and listening on `0.0.0.0:8000`.

### Running on Physical Phone

#### Option A: Run via Flutter CLI
```bash
# Connect phone via USB with USB debugging enabled:
flutter run -d <device-id> --dart-define=API_BASE_URL=http://192.168.1.4:8000
```

#### Option B: Build & Install Release/Debug APK
```bash
# Build APK configured with your LAN IP
flutter build apk --debug --dart-define=API_BASE_URL=http://192.168.1.4:8000

# Install APK onto connected device:
flutter install
```

#### Option C: In-App Dynamic IP Switcher
If the IP changes or you installed a standard build:
1. Open the app on the phone.
2. Tap the **Ethernet / Settings icon** on the top connection banner.
3. Type `http://<your-computer-LAN-IP>:8000` (e.g. `http://192.168.1.4:8000`).
4. Tap **Save & Reconnect**. The app will immediately verify connection to `/health`.

---

## Running Tests

Run Flutter automated widget and unit tests:
```bash
flutter test
```

---

## Permissions Configured

- **Android** (`AndroidManifest.xml`):
  - `android.permission.INTERNET`
  - `android.permission.RECORD_AUDIO`
  - `android.permission.MODIFY_AUDIO_SETTINGS`
  - `android:usesCleartextTraffic="true"` (for local private LAN HTTP communication)
- **iOS** (`Info.plist`):
  - `NSMicrophoneUsageDescription`
  - `NSAppTransportSecurity` (Allows local network HTTP requests during development)
