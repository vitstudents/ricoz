# LedgerAI Mobile (Expo & React Native)

Autonomous Continuous Bookkeeper & Financial Close Mobile Application built with **Expo SDK 58, React Native, and TypeScript**.

---

## 📱 Features

- **Consolidated Multi-Currency Vault**: Real-time cash balance monitoring (\$1,428,500.00 USD) across Silicon Valley Bank (USD), Deutsche Bank (EUR), Barclays (GBP), and HDFC (INR) compliant with **ASC 830**.
- **Live Transaction Stream**: Search, filter by currency, view GAAP GL accounts (4010, 6010, 6040, etc.), and inspect foreign exchange equivalents.
- **Continuous Auto-Reconciliation**: Automated 1:1 and 1:N match suggestions with confidence scores (e.g., 99.4%) and one-tap SOX audit locking.
- **Autonomous Fraud & Outlier Watch**: Real-time detection of duplicate subscriptions, expense amount spikes, and capitalization violations with instant Dismiss and CPA Flag actions.
- **AI Bookkeeper Copilot**: Interactive financial query assistant for on-the-fly multi-currency balances, ASC 830 revaluations, and trial balance verification.
- **Executive Administration & Settings**: FX spot conversion tables, institutional vault sync statuses, and immutable SOX audit log.

---

## 🚀 Quick Start (Development)

To run the application locally on an Android device or emulator using Expo:

```bash
cd andr
npm install
npx expo start
```

- Press `a` in the terminal to open in Android Emulator.
- Or scan the terminal QR code with the **Expo Go** app on any physical Android or iOS device.

---

## 📦 How to Generate the APK File

### Method 1: Local Standalone Build (Windows / Linux / macOS)

Run the included build script:
```cmd
cd andr
build-apk.bat
```

Or run directly via Gradle:
```bash
cd andr/android
./gradlew assembleDebug
```

The compiled APK will be generated at:
```
andr/android/app/build/outputs/apk/debug/app-debug.apk
```

To build an optimized, shrunk production APK:
```bash
cd andr/android
./gradlew assembleRelease
```

---

### Method 2: Expo Cloud EAS Build (Recommended for Distribution)

The project includes a production-tuned `eas.json` configured for APK generation:

```bash
cd andr
npx eas-cli build -p android --profile preview
```

EAS compiles the standalone APK in the cloud and provides a direct `.apk` download link and QR code for any Android phone.

---

## 🌐 Production API

The mobile app connects out-of-the-box to the production LedgerAI API on Vercel:
- **Cloud Endpoint**: `https://work-hazel-one.vercel.app/api/v1`
- Includes automatic offline caching and graceful fallback.
