# Build a Fresh CheckedIn APK

This guide builds a fresh Android APK from `apps/mobile` on Windows. It covers a local test APK and explains what must change before creating a store-ready release APK.

## Prerequisites

Install and verify:

- Flutter 3.11 or newer
- Android Studio and the Android SDK
- Android SDK Platform Tools (`adb`)
- Java 17
- An Android phone with USB debugging enabled, or an Android emulator
- Access to the Supabase project used by the app

From PowerShell, verify the toolchain:

```powershell
flutter doctor
flutter devices
```

Resolve any Android licenses or missing SDK items reported by `flutter doctor` before building.

## 1. Configure the mobile environment

From the repository root:

```powershell
Set-Location .\apps\mobile
Copy-Item .env.example .env
```

Open `apps/mobile/.env` and set the real project values:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

Do not commit `.env`. It is ignored by Git. The Veryfi values belong in Supabase Edge Function secrets and are not needed to build the APK.

## 2. Start from a clean project state

Run these commands from `apps/mobile`:

```powershell
flutter clean
Remove-Item -Recurse -Force .dart_tool, build -ErrorAction SilentlyContinue
flutter pub get
```

If the Android Gradle cache is behaving incorrectly, also remove the project Gradle cache and run `flutter pub get` again:

```powershell
Remove-Item -Recurse -Force .\android\.gradle -ErrorAction SilentlyContinue
flutter pub get
```

## 3. Build a local test APK

For a quickly installable development APK:

```powershell
flutter build apk --debug
```

For a smaller architecture-specific APK set:

```powershell
flutter build apk --debug --split-per-abi
```

Flutter normally writes the output under one of these locations:

```text
apps/mobile/build/app/outputs/flutter-apk/app-debug.apk
apps/mobile/build/app/outputs/flutter-apk/app-armeabi-v7a-debug.apk
apps/mobile/build/app/outputs/flutter-apk/app-arm64-v8a-debug.apk
apps/mobile/build/app/outputs/flutter-apk/app-x86_64-debug.apk
```

To locate the actual output if the build directory is customized:

```powershell
Get-ChildItem -Path ..\.. -Filter *.apk -Recurse | Select-Object FullName, Length, LastWriteTime
```

## 4. Install and test the APK

Connect a device or start an emulator, then verify that Android can see it:

```powershell
adb devices
```

Install the APK:

```powershell
adb install -r .\build\app\outputs\flutter-apk\app-debug.apk
```

If the APK is in a different output directory, use the path printed by the `Get-ChildItem` command. Open the CheckedIn app and test at least:

- Sign in and sign out
- Loading notifications and announcements
- QR event scanning
- Location permission
- Camera/selfie permission
- Check-in completion and feedback
- Offline/reconnect behavior where applicable

## 5. Build a release APK for internal distribution

The current Android configuration uses the debug signing key for the `release` build. This is acceptable for internal testing only, not for Google Play or production distribution.

To create that currently configured release APK:

```powershell
flutter build apk --release
```

Expected output:

```text
apps/mobile/build/app/outputs/flutter-apk/app-release.apk
```

Install it with:

```powershell
adb install -r .\build\app\outputs\flutter-apk\app-release.apk
```

## 6. Before publishing to Google Play

A production APK or Android App Bundle must use a private upload key. Before publishing:

1. Create a keystore outside the repository.
2. Create `apps/mobile/android/key.properties` locally with the keystore path and passwords.
3. Configure `apps/mobile/android/app/build.gradle.kts` with a real `signingConfigs.release` entry.
4. Change the release build type from the debug signing key to the release signing key.
5. Keep `key.properties` and the keystore out of Git.
6. Prefer an Android App Bundle for Google Play:

```powershell
flutter build appbundle --release
```

The bundle is normally written to:

```text
apps/mobile/build/app/outputs/bundle/release/app-release.aab
```

Never share the keystore, keystore password, or upload key in source control or chat.

## 7. Update the app version

Edit the `version` line in `apps/mobile/pubspec.yaml` before distributing a new build:

```yaml
version: 1.0.0+1
```

The format is:

```text
version: MAJOR.MINOR.PATCH+BUILD_NUMBER
```

Increase the build number for every Android upload. Then run `flutter pub get` and rebuild.

## Troubleshooting

### Flutter cannot find a device

```powershell
flutter devices
adb devices
```

Enable USB debugging on the phone, accept the computer authorization prompt, or start an Android emulator from Android Studio.

### Build uses stale files

Run:

```powershell
flutter clean
Remove-Item -Recurse -Force .dart_tool, build -ErrorAction SilentlyContinue
flutter pub get
flutter build apk --debug
```

### The app opens but cannot connect

Check `apps/mobile/.env`, confirm the Supabase URL and anon key are correct, and rebuild after changing the file.

### Release signing fails

Confirm the keystore path and credentials in `android/key.properties`, verify that the release signing configuration is loaded by `android/app/build.gradle.kts`, and make sure the keystore exists outside the repository.
