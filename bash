#!/bin/bash
set -e

echo "1. تحديث وتثبيت الحزم..."
npm install

echo "2. تحديث إضافات Capacitor إلى آخر إصدار متوافق..."
npm install @capacitor/core@latest @capacitor/android@latest @capacitor/cli@latest

echo "3. مزامنة منصة Capacitor..."
npx cap sync android

echo "4. تنظيف بناء أندرويد..."
cd android
./gradlew clean

echo "5. محاولة بناء التطبيق..."
./gradlew assembleDebug

echo "تم التنفيذ بنجاح! إذا استمر الخطأ، اعرض سجل البناء الكامل أو أرسل ملف build.gradle هنا."
