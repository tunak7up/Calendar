#!/bin/bash
set -e

ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-/opt/android-sdk}"
export PATH="${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin:${ANDROID_SDK_ROOT}/platform-tools:${PATH}"

echo "📦 Bước 1: Build React web assets..."
cd fe
npm ci
npm run build
echo "✅ Build web xong!"

echo "🔄 Bước 2: Đồng bộ Capacitor sang Android..."
npx cap sync android
echo "✅ Cap sync xong!"

echo "🤖 Bước 3: Build Android Debug APK..."
cd android
chmod +x gradlew
./gradlew assembleDebug -Pandroid.sdk.path="${ANDROID_SDK_ROOT}"

APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -sh "$APK_PATH" | cut -f1)
    echo "✅ Build APK thành công!"
    echo "📱 File: fe/android/${APK_PATH}"
    echo "📏 Size: ${APK_SIZE}"
else
    echo "❌ Không tìm thấy APK output!"
    exit 1
fi
