#!/usr/bin/env bash
set -euo pipefail

BRANCH="fix/android-proguard"
COMMIT_MSG="fix(android): use proguard-android-optimize.txt for R8 compatibility"

if [ ! -f "android/app/build.gradle" ]; then
echo "ERROR: android/app/build.gradle not found. شغّل هذا السكربت من جذر المستودع."
exit 1
fi

echo "عمل نسخة احتياطية من android/app/build.gradle ..."
cp android/app/build.gradle android/app/build.gradle.bak.$(date +%s)

echo "البحث والاستبدال المرن لأي وجود لـ proguard-android.txt ..."
