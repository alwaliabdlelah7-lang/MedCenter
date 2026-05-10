#!/bin/bash

# Script to build Android App locally
# This script automates the process of building the web assets and syncing them with the Android project.

set -e # Exit on any error

echo "------------------------------------------"
echo "🚀 Starting Android Build Process..."
echo "------------------------------------------"

# 1. Install dependencies
echo "📦 Step 1: Checking/Installing npm dependencies..."
npm install

# 2. Build Web Assets
echo "🏗️ Step 2: Building web project (Vite)..."
npm run build

# 3. Sync with Android
echo "📲 Step 3: Syncing with Capacitor Android..."
# Ensure the android platform is added if missing
if [ ! -d "android" ]; then
    echo "🏗️ Android platform not found, adding it..."
    npx cap add android
fi
npx cap sync android

# 4. Permissions and Wrapper check
echo "🔑 Step 4: Setting executable permissions for Gradle and checking wrapper..."
if [ -d "android" ]; then
    chmod +x android/gradlew
    
    # Try to detect if wrapper is broken and fix if gradle is available
    if ! (cd android && ./gradlew --version > /dev/null 2>&1); then
        echo "⚠️ Gradle wrapper seems broken. Attempting to repair..."
        if command -v gradle >/dev/null 2>&1; then
            (cd android && gradle wrapper)
            chmod +x android/gradlew
        else
            echo "❌ Error: Gradle wrapper is broken and 'gradle' command not found. Please install Gradle."
        fi
    fi
else
    echo "❌ Error: 'android' directory not found. Please run 'npx cap add android' first."
    exit 1
fi

# 5. Build APK via Command Line
echo "🛠️ Step 5: Building Debug APK via Gradle..."
cd android

# Check if JAVA_HOME is set
if [ -z "$JAVA_HOME" ]; then
    echo "⚠️ Warning: JAVA_HOME is not set. The build might fail if Java is not in your PATH."
fi

./gradlew assembleDebug

if [ $? -eq 0 ]; then
    echo "------------------------------------------"
    echo "🎉 Success! Android build completed."
    echo "📂 APK generated at: android/app/build/outputs/apk/debug/app-debug.apk"
    echo "------------------------------------------"
    echo "💡 To open the project in Android Studio, run:"
    echo "   npx cap open android"
else
    echo "------------------------------------------"
    echo "❌ Error: Gradle build failed."
    echo "Check if you have Android SDK and JDK 17 installed."
    echo "------------------------------------------"
fi

