# LedgerAI Android Mobile Application (`andr`)

Autonomous Continuous Bookkeeper & Financial Close Mobile Client for Android.

---

## 📱 Overview

The `andr` directory contains the complete production-grade Android application for **LedgerAI**. Built with a **Dual Native & Hybrid Cloud Architecture**, it delivers:

1. **Ultra-Fast Native Android Experience**: Native Material 3 cards, bottom navigation, instant pull-to-refresh, and local offline fallback.
2. **CPA Biometric Approval Gate**: Hardware-backed Android `BiometricPrompt` requiring fingerprint/face unlock to commit closing journal entries to the General Ledger.
3. **Real-time Push Notifications**: Instant alerts dispatched to the Android notification drawer when high-risk financial anomalies (duplicate charges, amount spikes, ASC 360 capital expense flags) are detected.
4. **Autonomous AI Copilot**: Voice and text financial assistant for querying vault balances, ASC 830 foreign exchange revaluations, and trial balance health on the go.
5. **Seamless Cloud Console Sync**: One-tap toggle into the live full-featured production cloud console hosted at [`https://work-hazel-one.vercel.app`](https://work-hazel-one.vercel.app), equipped with two-way JavaScript bridge hooks (`window.LedgerNative`).

---

## 📂 Project Architecture

```
andr/
├── build.gradle                            # Top-level Gradle build script
├── settings.gradle                         # Root project & module settings (:app)
├── gradle.properties                       # JVM & AndroidX optimization flags
├── gradlew & gradlew.bat                   # Gradle wrapper executables
├── package.json & capacitor.config.json    # Hybrid mobile tooling & web configuration
├── README.md                               # Android documentation
├── app/
│   ├── build.gradle                        # Android app module configuration
│   ├── proguard-rules.pro                  # R8/ProGuard obfuscation & shrink rules
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml         # Permissions, Activities, Deep Links & Providers
│           ├── res/
│           │   ├── values/                 # strings.xml, colors.xml, themes.xml
│           │   ├── xml/                    # network_security_config.xml, file_paths.xml
│           │   ├── menu/                   # bottom_nav_menu.xml
│           │   ├── layout/                 # activity_main.xml (Toolbar, Nav, Content Frame)
│           │   └── drawable/               # Vector drawables, icons, and splash screen
│           ├── java/com/ledgerai/mobile/
│           │   ├── LedgerApp.kt            # Application class with Notification Channels & OkHttp
│           │   ├── MainActivity.kt         # Core Dual-Mode Activity & Tab View Controller
│           │   ├── data/
│           │   │   ├── model/Models.kt     # Transaction, Anomaly, Journal & KPI models
│           │   │   └── api/LedgerApiService.kt # Coroutine API client with cloud/local endpoints
│           │   ├── ui/components/
│           │   │   └── NativeBridge.kt     # JS interface for Biometrics, Toast, & Vibration
│           │   └── util/
│           │       ├── BiometricHelper.kt  # Android BiometricPrompt security gate
│           │       └── NotificationHelper.kt # High-severity anomaly notification manager
│           └── assets/www/                 # Embedded mobile web app shell & offline fallback
│               ├── index.html
│               ├── app.js
│               └── app.css
```

---

## 🚀 How to Build & Run

### Method 1: Android Studio (Recommended)
1. Launch **Android Studio** (Hedgehog, Iguana, or later).
2. Select **Open** and browse to `c:\Users\ADMIN\Downloads\work\andr`.
3. Let Gradle sync dependencies.
4. Select an Android Virtual Device (AVD running API 26+) or connect a physical Android device with USB Debugging enabled.
5. Click **Run** (`Shift + F10`).

### Method 2: Command Line Gradle Build
To build the debug APK directly:
```bash
cd andr
./gradlew assembleDebug
```
The output APK will be generated at:
`andr/app/build/outputs/apk/debug/app-debug.apk`

To build the optimized production release APK:
```bash
./gradlew assembleRelease
```

---

## 🌐 Endpoints & Deep Linking

- **Production Cloud Host**: `https://work-hazel-one.vercel.app/api/v1/`
- **Android Emulator Local Host**: `http://10.0.2.2:8000/api/v1/`
- **Deep Link Handler**: Clicking on a notification for a high-risk anomaly automatically deep-links into `MainActivity` with the **Anomalies** tab active.

---

## 🔒 Security & Compliance
- **TLS 1.3 Strict HTTPS**: Configured in `network_security_config.xml`.
- **SOX Audit Attribution**: All approvals performed via mobile biometric sign-off attach device and user credentials to the audit log.
- **Data Protection**: ProGuard rules protect models and API keys from reverse engineering.
