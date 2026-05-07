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

استبدال أي حالة سواء اقتباسات مفردة أو مزدوجة، أو بدون getDefaultProguardFile لكن هذا النمط الشائع:
perl -0777 -pe "s/getDefaultProguardFile((['"])proguard-android.txt\1)/getDefaultProguardFile('proguard-android-optimize.txt')/gsm" -i android/app/build.gradle

للكثير من الملفات قد يحتوي فقط على النص proguard-android.txt في مكان آخر — استبدل أيضاً النص الصريح:
perl -0777 -pe "s/proguard-android.txt/proguard-android-optimize.txt/gsm" -i android/app/build.gradle

echo "عرض الأسطر المحيطة (1..120) لمراجعتك:"
sed -n '1,120p' android/app/build.gradle

echo "إنشاء فرع git وcommit"
git checkout -b "$BRANCH"
git add android/app/build.gradle
git commit -m "$COMMIT_MSG" || { echo "لا توجد تغييرات للـ commit (ربما التطابق تم مسبقاً)"; git checkout -; exit 0; }
echo "محاولة الدفع إلى الأصل (remote)"
git push -u origin "$BRANCH" || echo "Push فشل أو ليس لديك صلاحية؛ التغييرات محلية على الفرع $BRANCH"

echo "انتهى. نفّذ: cd android && ./gradlew clean && ./gradlew assembleDebug --no-daemon --stacktrace"
أعطِ الأذونات ثم شغّل السكربت:
chmod +x fix-android-proguard-commit.sh
./fix-android-proguard-commit.sh
ماذا يفعل السكربت:

يأخذ نسخة احتياطية من build.gradle،
يستبدل أي استدعاء getDefaultProguardFile('proguard-android.txt') بالنسخة الموصى بها،
ينشئ فرع git commit ويدفعه (إن أمكن).
بعد التشغيل راجع الـ sed output بالأسطر الأولى للتأكد أن السطر الآن:
proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
ثم شغل:
cd android
./gradlew clean
./gradlew assembleDebug --no-daemon --stacktrace

إذا ظهر خطأ جديد ألصق كامل الـ stacktrace هنا (خصوصاً الأسطر الأولى التي تُشير إلى ملف وسطر).

B — إذا فشل git am/التعديل (مشكلة سياق مختلف)
شغّل أولاً لعرض الأسطر المحيطة بالخطأ كما طلب Gradle:
sed -n '1,120p' android/app/build.gradle

ألصق الناتج هنا وسأكوّن لك patch مُعدل بحسب السياق الدقيق.

C — إصلاح تحذير GitHub Actions (Node.js 20 deprecated)
التحذير لا يوقف البناء لكنه يشير إلى أن بعض الـ actions ستُجبر على Node.js 24 لاحقاً. لديك خياران عمليان:

خيار 1 (سريع، مؤقت، يضمن تشغيل الإجراء الآن على Node 24):
أضِف متغيّر بيئة في ملف الـ workflow (على مستوى workflow أو لكل job):

على مستوى workflow (أعلى ملف .github/workflows/<your-workflow>.yml):
env:
FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: "true"

أو على مستوى job:
jobs:
build:

env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: "true"
runs-on: ubuntu-latest
steps:
  ...
هذا يفرض تشغيل actions JavaScript على Node.js 24 فوراً. مثال سريع لإدراج في ملفنا (إن استخدمت .github/workflows/flutter-node-ci.yml):

name: CI - Flutter & Node.js & Docker
env:
FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: "true"
GHCR_IMAGE: ghcr.io/
g
i
t
h
u
b
.
r
e
p
o
s
i
t
o
r
y
o
w
n
e
r
/
github.repository 
o
​
 wner/{{ github.event.repository.name }}
on:
push: ...
خيار 2 (المستدام) — تحديث الإجراء (action) المستخدم إلى نسخة أحدث تدعم Node.js 24:
اذهب إلى الـ actions المذكورة في التحذير (مثال: FirebaseExtended/action-hosting-deploy@v0) وراجع صفحة الـ action على GitHub لمعرفة إذا هناك إصدار جديد (v1 أو v2) يدعم Node 24.
غيّر المرجع في workflow إلى النسخة المدعومة (مثال: FirebaseExtended/action-hosting-deploy@v1) ثم اختبر.
ملاحظات:

الخيار 1 سريع ويحل التحذير فورًا لكن يُعتبر حل مؤقت؛ يُفضّل ترقية الإجراء عندما يكون إصدار رسمي متاح.
يفضّل إضافة env في القمة (global env) داخل ملف الـ workflow واحد ليشمل كل الـ jobs.
D — خطوات التحقق النهائية ومرجعية لما ترسله لي

شغّل السكربت أعلاه وشارك مخرجاته إن ظهرت أخطاء أو لم يتم تغيير السطر.

لو بِنِيَة build.gradle مختلفة: ألصق هنا ناتج:
sed -n '1,160p' android/app/build.gradle

بعد التعديل شغّل:
cd android && ./gradlew clean && ./gradlew assembleDebug --no-daemon --stacktrace

وألصق كامل الـ stacktrace (الأخطاء الأولى ~50 سطر مهمة).
4. لو تريد أيضاً إصلاح الـ workflow تلقائياً (أقوم بإنشاء patch يضيف env إلى الملف .github/workflows/flutter-node-ci.yml) أخبرني إن تفضّل ذلك — سأجهز git-format-patch لك.

خلاصة سريعة:

أصلحنا سبب الفشل الأساسي (proguard) عن طريق استبدال proguard-android.txt → proguard-android-optimize.txt. نفّذ السكربت وشغّل build.
لتفادي تحذيرات الـ Actions أضِف env FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: "true" أو حدّث actions إلى إصدارات تدعم Node.js 24.
