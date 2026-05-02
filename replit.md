# نظام ايداع الطبي — Hospital Information System

## Project Overview
A comprehensive, Arabic-language, dark-themed Hospital Information System (HIS) built as a full-stack web application. Manages patient registration, appointments, clinical workflows, laboratory, pharmacy, radiology, inpatient wards, staff chat, reports, and more.

## Architecture

### Full-Stack Single Server
- **Backend**: Express.js + Socket.io (`server.ts`, port 5000)
- **Frontend**: React 19 + Vite 6 + Tailwind CSS 4 (served by Vite middleware in dev; static `dist/` in production)
- **Database (default)**: localStorage (auto-seeded with comprehensive demo data on first run)
- **Database (cloud)**: Firebase Firestore (optional, switchable in Settings — requires Firebase security rules)
- **Database (alt)**: Supabase Postgres (optional, requires env vars)
- **Auth**: Legacy local users (admin/123) + Firebase Auth (email/password + Google OAuth)
- **AI**: Google Gemini 2.0 Flash (`src/services/geminiService.ts`) — lazy init, safe when key absent

### Port Configuration
- **Development**: Port 5000 (Express serves both frontend and backend)
- **Production**: Port 5000

## Login Credentials (Local / Offline Mode)
| Username | Password | Role |
|----------|----------|------|
| admin | 123 | مدير النظام |
| doctor | 123 | طبيب |
| nurse | 123 | تمريض |
| pharmacy | 123 | صيدلاني |
| lab | 123 | فني مختبر |
| reception | 123 | استقبال |

Firebase email/password: `admin@medcenter.com` / `123`

## Data Providers (switchable in Settings)
| Provider | When to use |
|----------|-------------|
| `local` (default) | Offline / demo / development — auto-seeded on first run |
| `firebase` | Cloud sync — requires Firebase security rules to be configured |
| `supabase` | Alternative cloud — requires VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY |

## Seed Data (Auto-populated to localStorage on first run)
- 25 patients (Arabic Yemeni names, full medical history)
- 10 doctors (10 specializations across 10 departments)
- 10 departments + 10 clinics
- 25 appointments (today + history, mixed statuses)
- 20 receipts
- 11 lab tests (CBC, RBS, LFT, KFT, etc.)
- 6 radiology scans
- 3 clinical visits with full vitals + diagnosis
- 3 prescriptions
- 5 inpatients
- 6 nurses, 10 operations, 14 services, 20 medicines

## Key Files
| File | Purpose |
|------|---------|
| `server.ts` | Express + Socket.io entry point |
| `vite.config.ts` | Vite: React, Tailwind, process.env shim |
| `src/main.tsx` | React root render |
| `src/App.tsx` | BrowserRouter + route tree + startup seeding |
| `src/contexts/AuthContext.tsx` | Auth: Firebase + legacy local users; legacy login forces `local` provider |
| `src/services/dataService.ts` | Unified data layer; default provider = `local` |
| `src/data/seedData.ts` | Comprehensive seed data for all 19 collections |
| `src/lib/firestoreErrorHandler.ts` | Logs Firebase errors; does NOT throw (graceful fallback) |
| `src/pages/` | All 20+ page components |
| `src/services/geminiService.ts` | Gemini AI — lazy init |
| `public/sw.js` | Service worker for PWA offline support |
| `public/manifest.json` | PWA manifest (Arabic, RTL, standalone) |
| `capacitor.config.ts` | Capacitor config for Android (appId: com.alwali.medcenter) |
| `electron-main.cjs` | Electron config for Windows desktop |

## Build Commands
```bash
# Development
npm run dev              # Express + Vite dev server (port 5000)

# Production Web
npm run build            # Build to dist/
npm run start            # Serve production build

# Android (requires Android Studio)
npm run build:android    # Build + Capacitor sync + open Android Studio
npm run build:android:apk # Build + Capacitor sync (no open)

# Windows Desktop (Electron)
npm run build:windows    # Build + Electron portable .exe

# Linux Desktop (Electron)
npm run build:linux      # Build + Electron AppImage + .deb

# macOS Desktop (Electron)
npm run build:mac        # Build + Electron .dmg
```

## Platform Support
| Platform | Method | Status |
|----------|--------|--------|
| Web Browser | Vite PWA | ✅ Ready |
| Android | Capacitor 8 | ✅ Project exists in `android/` |
| Windows | Electron + `electron-builder --win --portable` | ✅ Config ready |
| Linux | Electron + `electron-builder --linux` | ✅ Config ready |
| macOS | Electron + `electron-builder --mac` | ✅ Config ready |
| iOS/iPad | PWA from Safari | ✅ (via manifest + meta tags) |
| Windows PWA | Edge / Chrome install | ✅ (via manifest) |

## Environment Variables
| Variable | Required | Purpose |
|----------|----------|---------|
| `GEMINI_API_KEY` | Optional | AI diagnosis assistant |
| `FIREBASE_SERVICE_ACCOUNT` | Optional | Firebase Admin SDK (server-side seeding) |
| `VITE_SUPABASE_URL` | Optional | Supabase |
| `VITE_SUPABASE_ANON_KEY` | Optional | Supabase auth |
| `VITE_GOOGLE_CLIENT_ID` | Optional | Google OAuth |

## Bug Fixes Applied (2026-05-02 Session 2)
1. **Firestore error handler no longer throws** — `firestoreErrorHandler.ts` previously threw on permission-denied, breaking the localStorage fallback. Now it only logs a warning.
2. **Default provider changed to `local`** — `dataStore` defaults to localStorage so the app works immediately without Firebase credentials.
3. **Legacy login forces local provider** — `admin/123` login now explicitly sets provider to `local` and triggers `seedLocalIfEmpty()`.
4. **Comprehensive seed data** — `seedData.ts` rewritten with 19 fully-populated collections (25 patients, 10 doctors, 25 appointments, 20 receipts, etc.).
5. **InpatientManagement upgraded** — Now uses `dataStore` (getAll / addItem / updateItem / deleteItem) instead of raw localStorage.
6. **PWA manifest** — Arabic name, RTL, proper icons, service worker registered.
7. **Service worker** — `public/sw.js` caches static assets for offline PWA support.
8. **Corrupted character fixed** — `DoctorManagement.tsx` had an Arabic character prepended to the first line.
9. **index.html upgraded** — Arabic lang/dir, PWA meta tags, service worker registration.
