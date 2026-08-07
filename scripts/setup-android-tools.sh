#!/bin/bash
set -e

ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-/opt/android-sdk}"

echo "🔧 Kiểm tra và cài đặt môi trường build Android..."

# Cài Node.js nếu chưa có
if ! command -v node &> /dev/null; then
    echo "⬇️  Cài Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo "✅ Node.js đã cài: $(node -v)"
else
    echo "✅ Node.js đã có: $(node -v)"
fi

# Cài Android SDK nếu chưa có
if [ ! -f "${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin/sdkmanager" ]; then
    echo "⬇️  Cài Android SDK Command-line tools..."
    apt-get install -y wget unzip
    mkdir -p "${ANDROID_SDK_ROOT}/cmdline-tools"
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip \
        -O /tmp/cmdline-tools.zip
    unzip -q /tmp/cmdline-tools.zip -d "${ANDROID_SDK_ROOT}/cmdline-tools"
    mv "${ANDROID_SDK_ROOT}/cmdline-tools/cmdline-tools" \
       "${ANDROID_SDK_ROOT}/cmdline-tools/latest"
    rm /tmp/cmdline-tools.zip

    echo "📋 Chấp nhận license Android SDK..."
    yes | "${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin/sdkmanager" --licenses

    echo "📦 Cài SDK packages..."
    "${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin/sdkmanager" \
        "platform-tools" \
        "platforms;android-34" \
        "build-tools;34.0.0"

    echo "✅ Android SDK cài xong tại ${ANDROID_SDK_ROOT}"
else
    echo "✅ Android SDK đã có tại ${ANDROID_SDK_ROOT}"
fi
