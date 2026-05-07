
# MedCenter — AutoFix CI, Build & Deploy Workflows (قابل للنسخ)

هذا المستند يضيف:
1. Workflow لإصلاح التنسيق/القواعد تلقائياً وإنشاء PR (auto-fix.yml).
2. Workflow لبناء Flutter Web ورفعها إلى GitHub Pages، وبناء Docker للـ backend ودفعها إلى GHCR (ci-deploy.yml).
3. Dependabot config.
4. تعليمات إضافة الملفات، إحداث فرع وفتح PR، وإضافة Secrets المطلوبة.

---

ملاحظة مهمة: بعد إضافة الملفات ورفعها لفرع جديد، سيعمل GitHub Actions تلقائياً. تحتاج إعداد بعض Secrets (في Settings > Secrets and variables > Actions) مثل GHCR_TOKEN (أو استخدام GITHUB_TOKEN إذا منحت صلاحيات للحزمة).

---

1) .github/workflows/auto-fix.yml
- وظيفة: تشغيل linters/formatters، تنفيذ الإصلاحات الآلية (eslint --fix, prettier, dart format) ثم إنشاء Pull Request يحتوي التغييرات إن وُجدت.

نسخ الملف التالي إلى `.github/workflows/auto-fix.yml`:

```yaml
name: Auto Fix & Create PR
on:
  workflow_dispatch: {}
  push:
    branches:
      - main
  schedule:
    - cron: '0 2 * * *' # كل يوم 02:00 UTC

jobs:
  autofix:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Set up Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.7.0'

      - name: Install Prettier & ESLint (if package.json exists)
        run: |
          if [ -f package.json ]; then
            npm ci || npm install
            npm i -g prettier
          fi

      - name: Run ESLint fix
        if: ${{ hashFiles('**/.eslintrc*','**/package.json') != '' }}
        run: |
          if [ -f package.json ]; then
            if npm run -s lint:fix --if-present; then echo "eslint fix done"; else npm run -s lint || true; fi
          fi

      - name: Run Prettier
        if: ${{ hashFiles('**/.prettierrc*','**/package.json') != '' }}
        run: |
          if [ -f package.json ]; then
            npx prettier --write .
          fi

      - name: Dart format (Flutter)
        run: |
          if [ -f pubspec.yaml ]; then
            dart format .
          fi

      - name: Commit and create PR
        uses: peter-evans/create-pull-request@v5
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          commit-message: chore(auto-fix): apply code formatters and lint fixes
          branch: fix/auto-format-${{ github.run_number }}
          title: chore(auto-fix): apply code formatters and lint fixes
          body: |
            This PR was created automatically by the Auto Fix workflow.
            It applies formatting and lint fixes (prettier, eslint --fix, dart format) where possible.
          labels: automated, ci
          signoff: true
```

ملاحظات:
- يتطلب وجود ملفات lint/formatter في المشروع. إذا لا توجد، هذه الخطوة تتخطى نفسها.
- peter-evans/create-pull-request سيقوم بإنشاء PR فقط إذا توجد تغييرات.

---

2) .github/workflows/ci-deploy.yml
- وظيفة: بناء Flutter web، نشره إلى GitHub Pages، بناء صورة Docker للـ backend ودفعها إلى GHCR.

انسخ الملف التالي إلى `.github/workflows/ci-deploy.yml`:

```yaml
name: CI - Build & Deploy

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

env:
  IMAGE_NAME: ghcr.io/${{ github.repository_owner }}/${{ github.event.repository.name }}

jobs:
  build_flutter:
    name: Build Flutter Web
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '11'

      - name: Install Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.7.0'

      - name: Flutter pub get
        run: flutter pub get

      - name: Build web release
        run: flutter build web --release

      - name: Upload web build
        uses: actions/upload-artifact@v4
        with:
          name: flutter-web
          path: build/web

  deploy_pages:
    name: Deploy to GitHub Pages
    runs-on: ubuntu-latest
    needs: build_flutter
    steps:
      - name: Download web build
        uses: actions/download-artifact@v4
        with:
          name: flutter-web
          path: build/web

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./build/web
          publish_branch: gh-pages
          user_name: 'github-actions[bot]'
          user_email: 'github-actions[bot]@users.noreply.github.com'

  build_and_push_backend:
    name: Build and push backend Docker image
    runs-on: ubuntu-latest
    needs: build_flutter
    if: ${{ (hashFiles('backend/**') != '') || (exists('backend/Dockerfile')) }}
    steps:
      - uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v4
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GHCR_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          file: ./backend/Dockerfile
          push: true
          tags: ${{ env.IMAGE_NAME }}-backend:latest
```

ملاحظات:
- نشر الـ frontend إلى GitHub Pages: سيُنشئ فرع gh-pages ويدفع الملفات هناك. لصفحات خاصة بمجلد root، تأكد في إعدادات repo أن صفحة GitHub Pages مصدرها gh-pages branch.
- دفع صور Docker إلى GHCR يتطلب secret GHCR_TOKEN (يمكن إنشاؤه كـ Personal Access Token مع صلاحيّات write:packages). بدلاً من GHCR_TOKEN يمكن استخدام GITHUB_TOKEN إذا منحت أذونات الكتابة للـ packages من settings → Actions → General → Workflow permissions (قد لا تكفي لكل الحالات).

---

3) Dependabot
ضع الملف `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/backend"
    schedule:
      interval: "daily"
  - package-ecosystem: "pub"
    directory: "/"
    schedule:
      interval: "weekly"
```

---

4) إعدادات Lint/Formatter الموصى بها (مقترحات سريعة)
- إضافة ملف `.eslintrc.json` و `.prettierrc` في حالة وجود JavaScript/Node.
- إضافة `analysis_options.yaml` واتباع `dart format` و `flutter analyze` للـ Flutter.

مثال مختصر للـ `.prettierrc`:
{
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100
}

---

5) التعليمات العملية — كيف تضيف هذه الملفات وتدفعها

1) إنشاء فرع جديد:
   git checkout -b feat/ci-autofix

2) أضف الملفات التي نسختها إلى المسارات المشار إليها.

3) أضف commit وادفع:
   git add .github/workflows/auto-fix.yml .github/workflows/ci-deploy.yml .github/dependabot.yml
   git commit -m "ci: add auto-fix workflow, build & deploy, dependabot"
   git push -u origin feat/ci-autofix

4) افتح Pull Request (أو انتظر عمل Auto-fix إذا وجدت push على main حسب تهيئتك):
   gh pr create --title "chore(ci): add auto-fix and ci/deploy workflows" --body "Automated formatting, build & deploy workflows." --base main

---

6) إعدادات Secrets (في Settings > Secrets and variables > Actions)

- GHCR_TOKEN — token لرفع الحزم/الصور إلى ghcr.io. (PAT مع write:packages).
- (اختياري) DOCKERHUB_USERNAME / DOCKERHUB_TOKEN — إن أردت دفعimages إلى Docker Hub بدل GHCR.
- (اختياري) FLY_API_TOKEN أو RAILWAY_TOKEN — إن أردت نشر الـ backend تلقائياً إلى خدمات خارجية.

ملاحظة: نشر الـ frontend إلى GitHub Pages لا يتطلب أي secret إضافي.

---

7) أحتاج منك الآن (لإصلاح الأخطاء بدقة)
- شغّل الأوامر التشخيصية في جذر المستودع وألصق المخرجات هنا:
  git status
  git branch -vv
  git log -n 5 --oneline
  ls -la
  find . -maxdepth 2 -print
  cat package.json (إن وُجد)
  cat pubspec.yaml (إن وُجد)
  cat backend/package.json (إن وُجد)
  cat .github/workflows/* (إن وُجد)

- أو أرفق هنا مخرجات CI (logs) إن فشل أي workflow بالفعل.

بمخرجاتك أستطيع:
- إعداد إصلاحات محددة (تعديلات شفرة، حلول للأخطاء، تحديث تبعيات متوافقة).
- توليد ملفات محددة لكل خطأ (diff/patch) لتنسخها وتدفعها.
- توجيهك خطوة بخطوة لتشغيل Local fixes ثم فتح PR تلقائي عبر workflow.

---

8) ملحوظات أخيرة حول النشر "مجانياً"
- Frontend (Flutter web) → GitHub Pages أو Cloudflare Pages (مجاناً بالنسبة للمستودعات العامة).
- Backend (دائم التشغيل) → يحتاج خدمة استضافة ذات ويب سيرفر. خيارات مجانية محدودة: Fly.io (مستوى مجاني محدود)، Render (خطة مجانية إذا متاحة)، Railway (free credits)، أو استضافة على VPS مجاني إن توفر. GH Actions ليست استضافة دائمة.
- صور Docker يمكن حفظها في GHCR مجاناً للمستودعات العامة.

---

أود الآن:
- أن أنشئ لك أيضاً ملفات lint/formatter (eslintrc, prettier, analysis_options.yaml) وملف Dockerfile/Node الذي يناسب مشروعك — هل تفضّل أن أضعها الآن في المستند لتنسخها مباشرة؟
- أو أن تبدأ أولاً بتشغيل أوامر التشخيص وأرسل لي النتائج حتى أجهز إصلاحات دقيقة للخطأ الفعلي في الشفرة.

اختر: "أضف الملفات الجاهزة الآن" أو "أعطيك مخرجات diagnostics لأرفعها" (وأرسل المخرجات). سأتابع فوراً بالخطوة التالية.