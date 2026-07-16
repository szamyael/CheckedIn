#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if [[ ! -f CheckedIn/Config.plist ]]; then
  cp ../Config.example.plist CheckedIn/Config.plist
  echo "Created CheckedIn/Config.plist — fill in SUPABASE_URL and SUPABASE_ANON_KEY."
fi

if command -v xcodegen >/dev/null 2>&1; then
  xcodegen generate
  echo "Generated CheckedIn.xcodeproj — open it in Xcode."
else
  echo "Install XcodeGen (brew install xcodegen), then re-run this script."
  echo "Or create an iOS App in Xcode and add the CheckedIn/ sources + Supabase package."
fi
