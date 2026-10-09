# DocuFlex — Secure All-in-One Document Viewer for Android

A production-grade, privacy-first, offline native Android document viewer built with **Kotlin**, **Jetpack Compose**, **Material 3**, and modular **MVVM** architecture.

---

## 🔒 Security & Privacy Guarantees

- **100% Offline**: Zero network permissions (`android.permission.INTERNET` is explicitly omitted and validated via CI).
- **Storage Access Framework (SAF)**: Uses `ACTION_OPEN_DOCUMENT` exclusively. No broad storage permissions (`READ_EXTERNAL_STORAGE` or `MANAGE_EXTERNAL_STORAGE`).
- **Defensive Parsing**:
  - Validated by magic byte signatures (prevents executable camouflage).
  - ZipBomb / ZipSlip path traversal protection on OpenXML archives.
  - XXE (XML External Entity) and DTD injection prevention.
  - HTML preview with JavaScript execution disabled and external HTTP fetching blocked.
- **FLAG_SECURE**: Configurable screenshot and task-thumbnail masking via `WindowManager.LayoutParams.FLAG_SECURE`.
- **Biometric App Lock**: Standard AndroidX `BiometricPrompt` with device credential fallback (no custom crypto).
- **Anti-Telemetry**: Zero analytics, trackers, ads, or background daemons.

---

## 📁 Architecture Overview

```
android/
├── app/                  # Main Application, MainActivity, Adaptive Navigation (Phone/Tablet), StrictMode, Manifest
├── core/
│   ├── model/            # DocumentItem, DocumentFormat, FileValidationResult
│   ├── security/         # MagicBytesDetector, SafValidator, ZipSecurityValidator, SafeXmlParser, TempFileManager, BiometricAuthManager
│   ├── data/             # Room Database (DocuFlexDatabase, DocumentDao, DocumentEntity), UserPreferencesRepository (DataStore), DocumentRepository
│   ├── theme/            # DocuFlexTheme, Material 3 dynamic color, custom light/dark color schemes, typography
│   └── viewer/           # PdfRendererEngine, DocxTextEngine, XlsxSheetEngine, TextEngine, CsvStreamingEngine, ImageEngine, SafeHtmlEngine
├── feature/
│   ├── home/             # HomeScreen, HomeViewModel, SAF file picker launcher
│   ├── recents/          # RecentFilesScreen, RecentFilesViewModel, search, filters, stale URI handling
│   ├── favorites/        # FavoritesScreen, FavoritesViewModel, star management
│   ├── viewer/           # DocumentViewerScreen, DocumentViewerViewModel, PDF recycling, DOCX/XLSX text previews
│   ├── settings/         # SettingsScreen, FLAG_SECURE switch, Biometrics, save history toggle, clear history/favorites
│   └── legal/            # PrivacyPolicyScreen, TermsAndConditionsScreen, SecuritySafetyScreen, OpenSourceLicensesScreen
├── scripts/
│   ├── check-permissions.sh  # Automated manifest & merged manifest permission audit
│   └── build-apk.sh          # APK compilation runner
├── gradle/
│   ├── libs.versions.toml    # Version Catalog
│   └── verification-metadata.xml # Supply chain dependency verification metadata
└── test-corpus/          # Test documents (valid/corrupted/encrypted/oversized)
```

---

## 🛠️ Build and Installation Instructions

### Prerequisites
1. **JDK 17 or higher** (`java -version`)
2. **Android SDK 35** (`targetSdk = 35`, `minSdk = 26`)
3. **Android Build Tools 35.0.0**

### 1. Permission Audit Check
Run the automated permission inspector to ensure no leaked network permissions:
```bash
./android/scripts/check-permissions.sh
```

### 2. Build Debug APK
```bash
./gradlew assembleDebug
```
The resulting APK will be located at:
```
app/build/outputs/apk/debug/app-debug.apk
```

### 3. Install on Connected Device or Emulator via ADB
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### 4. Build Release APK (R8 Minified)
Configure your signing keystore in `local.properties`:
```properties
RELEASE_STORE_FILE=/path/to/keystore.jks
RELEASE_STORE_PASSWORD=your_keystore_password
RELEASE_KEY_ALIAS=your_key_alias
RELEASE_KEY_PASSWORD=your_key_password
```
Then compile the optimized release build:
```bash
./gradlew assembleRelease
```
