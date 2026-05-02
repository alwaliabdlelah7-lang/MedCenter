# MedCenter HIS - Hospital Information System (نظام ايداع الطبي)

## Project Overview
A comprehensive Hospital Information System (HIS) — Arabic-language, dark-themed — built as a full-stack web application. Manages patient registration, appointments, clinical workflows, laboratory, pharmacy, radiology, inpatient wards, staff chat, reports, and more.

## Architecture

### Full-Stack Single Server
- **Backend**: Express.js + Socket.io (`server.ts`, port 5000)
- **Frontend**: React 19 + Vite 6 + Tailwind CSS 4 (served by Vite middleware in dev; static `dist/` in production)
- **Database (primary)**: Firebase Firestore (`src/lib/firebase.ts`)
- **Database (fallback)**: localStorage (auto-seeded with demo data on first run)
- **Auth**: Firebase Auth (email/password + Google OAuth) with legacy admin fallback (admin / 123)
- **AI**: Google Gemini 2.0 Flash (`src/services/geminiService.ts`) — lazy init, safe when key is absent
- **Mobile**: Capacitor configured (`capacitor.config.ts` + `android/`)

### Port Configuration
- **Development**: Port 5000 (Express serves both frontend and backend)
- **Production**: Port 5000

### Key Files
| File | Purpose |
|------|---------|
| `server.ts` | Express + Socket.io entry point |
| `vite.config.ts` | Vite: React, Tailwind, process.env shim for GEMINI_API_KEY |
| `src/main.tsx` | React root render |
| `src/App.tsx` | BrowserRouter + route tree + calls `dataStore.seedLocalIfEmpty()` on startup |
| `src/contexts/AuthContext.tsx` | Firebase auth with 6s timeout → localStorage fallback |
| `src/services/dataService.ts` | Unified data layer: firebase / supabase / local |
| `src/data/seedData.ts` | Initial demo data for all collections |
| `src/api/routes.ts` | Express REST API (Firebase Admin backed) |
| `src/api/seeding.ts` | Server-side Firebase batch seeding |
| `src/services/geminiService.ts` | Gemini AI (lazy init, no crash when key absent) |
| `src/lib/firebase.ts` | Firebase client init (Auth + Firestore with long-polling) |
| `src/pages/` | All page components |
| `src/components/` | Layout, Sidebar, shared UI |

## Environment Variables
| Variable | Required | Purpose |
|----------|----------|---------|
| `GEMINI_API_KEY` | Optional | Enables AI diagnosis assistant |
| `FIREBASE_SERVICE_ACCOUNT` | Optional | Firebase Admin SDK (server-side seeding) |
| `VITE_GOOGLE_CLIENT_ID` | Optional | Google OAuth |
| `VITE_SUPABASE_URL` | Optional | Supabase alternative DB |
| `VITE_SUPABASE_ANON_KEY` | Optional | Supabase auth |

## Login Credentials
- **Demo admin**: `admin` / `123` (works offline via localStorage fallback)
- **Firebase email**: `admin@medcenter.com` / `123`
- **Google OAuth**: Any Google account (auto-creates profile)

## Data Providers (switchable at runtime in Settings)
1. `firebase` — Firestore (default; auto-seeds on first admin login)
2. `local` — localStorage (auto-seeds on first app load; `hospital_seeded` flag guards re-seeding)
3. `supabase` — Supabase Postgres (requires env vars)

## Development
```bash
npm run dev       # starts Express + Vite on port 5000
npm run build     # production build to dist/
npm run start     # serve production build
```

## Bug Fixes Applied (2026-05-02)
1. **Critical crash fixed** — `geminiService.ts` threw `Error: An API Key must be set` at module load when `GEMINI_API_KEY` was absent. Now lazy-initialized; model updated to `gemini-2.0-flash`.
2. **Auth infinite spinner fixed** — Added 6-second timeout in `AuthContext.tsx`; falls back to `localStorage` session if Firebase doesn't respond.
3. **Local data seeding** — `dataStore.seedLocalIfEmpty()` called at app startup; seeds all collections to localStorage on first run.
4. **Cloud seeding fixed** — `autoSeed()` now works for both local and cloud providers; `INITIAL_APPOINTMENTS`, `nurses`, `operations` added to seed map.
5. **Seeding import fixed** — Removed `.ts` extension from dynamic import in `src/api/seeding.ts`.

## Deployment
- Target: VM (Socket.io requires persistent connections — not serverless)
- Build command: `npm run build`
- Run command: `npm run start`
