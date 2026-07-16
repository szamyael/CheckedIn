# CheckedIn iOS (SwiftUI)

Native Swift student app that talks to the same Supabase backend as the Flutter mobile app.

## Requirements

- macOS with Xcode 15+
- iPhone / Simulator (iOS 17+)
- Camera + Location permissions (check-in / check-out)

## Setup (Mac)

1. Credentials are already synced from `apps/mobile/.env` into:
   - `apps/ios/.env`
   - `CheckedIn/CheckedIn/Config.plist`
   Re-sync after changing mobile env:
   ```bash
   # from repo root (PowerShell or bash)
   cp apps/mobile/.env apps/ios/.env
   ```
   Then update `Config.plist` `SUPABASE_URL` / `SUPABASE_ANON_KEY` to match.

2. Generate the Xcode project (recommended):
   ```bash
   cd CheckedIn
   brew install xcodegen   # once
   chmod +x generate_xcode_project.sh
   ./generate_xcode_project.sh
   open CheckedIn.xcodeproj
   ```

3. In Signing & Capabilities, select your Apple Developer team.

4. Run on a physical iPhone for camera / QR / location.

### Installable builds

- **Android APK** builds on Windows/Mac via Flutter → `flutterapk/checkedin-mobile-release.apk`
- **iOS IPA** cannot be built on Windows. On a Mac:
  ```bash
  cd apps/mobile
  flutter build ipa
  # or open apps/ios/CheckedIn in Xcode → Archive → Distribute
  ```
  Copy the `.ipa` into `flutterapk/` when done.

## Features (parity with Flutter student flows)

- Login with Student ID auto-format `XXXX-XXXX`
- Universal full-screen loader during network work
- Events list
- QR scan → check-in (location → OTP → selfie) or **check-out** (QR only, no OTP/selfie)
- Profile sign-out

## Notes

- This folder targets a native Swift rewrite for App Store / TestFlight distribution.
- Flutter iOS under `apps/mobile/ios` remains available if you prefer a single codebase.
