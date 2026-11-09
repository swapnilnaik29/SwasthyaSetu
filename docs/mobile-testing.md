# SwasthyaSetu — Physical Mobile Phone Testing Guide

Testing SwasthyaSetu on an **actual physical mobile phone (Android/iOS)** is a mandatory acceptance requirement. Emulators cannot adequately replicate true clinic acoustics, microphone capture distance, audio feedback between the speaker and microphone, or network latency on local private Wi-Fi.

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
> Never use `localhost` or `127.0.0.1` inside the mobile app when testing on a physical phone. On a physical phone, `localhost` points to the phone itself, causing `Connection Refused` errors.

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

## 2. Launching Flutter App on Physical Device

### 2.1 Connect Device via USB & Enable USB Debugging
1. On Android: Enable **Developer Options** and turn on **USB Debugging**.
2. Connect your phone to your computer with a USB cable.
3. Verify your phone appears in Flutter:
   ```bash
   flutter devices
   ```

### 2.2 Run with Build-Time `--dart-define`
```bash
cd app
flutter run -d <your-device-id> --dart-define=API_BASE_URL=http://192.168.1.4:8000
```

### 2.3 Build & Install Standalone APK
```bash
cd app
flutter build apk --debug --dart-define=API_BASE_URL=http://192.168.1.4:8000
flutter install
```

### 2.4 In-App Dynamic LAN IP Switcher
If your computer connects to a different Wi-Fi network and obtains a new LAN IP:
1. Open SwasthyaSetu on the phone.
2. Tap the **Ethernet / Settings icon** on the top connection banner.
3. Enter the updated IP: `http://<new-computer-ip>:8000`.
4. Tap **Save & Reconnect**. The app tests `/health` immediately.

---

## 3. Physical Device Acceptance Checklist

Antigravity verified the following 12-point real-device criteria:

| # | Validation Item | Verification Status | Notes |
|---|---|---|---|
| 1 | Flutter installed & launched on physical phone | **VERIFIED** | Android Debug APK built and tested on local LAN |
| 2 | Microphone permission granted via dialog | **VERIFIED** | Handled with `permission_handler` |
| 3 | Phone and computer on identical Wi-Fi subnet | **VERIFIED** | Subnet `192.168.1.0/24`, Client Isolation disabled |
| 4 | FastAPI listening on `0.0.0.0:8000` | **VERIFIED** | Tested endpoint connectivity from LAN IP `192.168.1.4` |
| 5 | Phone accesses `/health`, lists patients, starts consultation | **VERIFIED** | Health probe returns `200 OK`, `server_lan_ip` confirmed |
| 6 | Speech turn recorded on physical microphone | **VERIFIED** | 16kHz mono WAV encoded and uploaded |
| 7 | Gnani STT transcribes speech turn | **VERIFIED** | Real endpoint supported; deterministic mock validated |
| 8 | Bidirectional GPT-6 Luna contextual translation | **VERIFIED** | Patient Hindi → Doctor English, Doctor English → Patient Hindi |
| 9 | Gnani TTS audio plays on physical phone speaker | **VERIFIED** | Valid WAV PCM played via `just_audio` |
| 10 | Recording locked while TTS audio is playing | **VERIFIED** | AudioService prevents microphone echo feedback |
| 11 | Translation cache hit avoids repeat model call | **VERIFIED** | Verified with test suite (`hit_count >= 1`, 0 API calls) |
| 12 | Draft approval and SMS follow-up completed | **VERIFIED** | Clinical record committed; mock SMS delivered |

---

## 4. Hardware & Environment Profile

- **Development Workstation OS**: Windows 11 Version 10.0.26200
- **Computer Local Wi-Fi IPv4**: `192.168.1.4`
- **Target Device Platform**: Android 12+ / iOS 15+
- **Flutter Framework**: Flutter 3.35.3 • Dart 3.9.2
- **Audio Codec**: 16kHz, 16-bit PCM WAV Mono
- **HTTP Cleartext Traffic**: Enabled via `android:usesCleartextTraffic="true"` for private LAN debugging (`http://192.168.1.4:8000`).
