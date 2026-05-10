#!/bin/bash

# Script to build Android App locally
echo "🚀 Starting Android Build Process..."

# 1. Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# 2. Build Web Assets
echo "🏗️ Building web project..."
npm run build

# 3. Sync with Android
echo "Syncing with Capacitor Android..."
npx cap sync android

# 4. Open Android Studio (Optional)
echo "✅ Build complete! You can now open Android Studio to generate the APK:"
echo "npx cap open android"

# 5. Build APK via Command Line (Requires Gradle)
echo "🛠️ Attempting to build APK via Gradle..."
cd android
./gradlew assembleDebug

if [ $? -eq 0 ]; then
    echo "🎉 Success! APK generated at: android/app/build/outputs/apk/debug/app-debug.apk"
else
    echo "❌ Gradle build failed. Please ensure Android SDK and JDK are installed."
fi
