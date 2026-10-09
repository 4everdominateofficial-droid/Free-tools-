#!/usr/bin/env bash
set -euo pipefail

echo "=================================================="
echo "DocuFlex Android APK Build System"
echo "=================================================="

# Check if Java and Android SDK are installed
if ! command -v javac &> /dev/null; then
    echo "NOTICE: Java Development Kit (JDK 17+) is required but not installed in this environment."
    echo "To build locally on your development machine or CI/CD agent:"
    echo "1. Install JDK 17 (e.g. OpenJDK 17)"
    echo "2. Install Android Command Line Tools & SDK 34"
    echo "3. Run: ./gradlew assembleDebug"
    echo "4. Or for release: ./gradlew assembleRelease"
    exit 0
fi

# Run permission audit before building
./android/scripts/check-permissions.sh

echo "Building Debug APK..."
./gradlew assembleDebug

echo "Debug APK built at: android/app/build/outputs/apk/debug/app-debug.apk"
echo "To install via adb: adb install -r android/app/build/outputs/apk/debug/app-debug.apk"
