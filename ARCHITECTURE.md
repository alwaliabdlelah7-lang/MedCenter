# MedCenter HIS - System Architecture

## Overview

MedCenter is a comprehensive Hospital Information System built with React 19, Express.js, and dual-database support (Firebase Firestore + Supabase PostgreSQL). The system manages clinical operations, patient care, pharmacy, laboratory, and administrative functions.

## Directory Structure

### New Modular Architecture (Phase 1 - Complete)

```
src/
├── features/                    # Feature-based modules
│   ├── clinical/               # Clinical operations
│   │   ├── pages/
│   │   │   ├── ClinicalVisits.tsx
│   │   │   ├── AIDiagnosisAssistant.tsx
│   │   │   ├── QueueManagement.tsx
│   │   │   └── Appointments.tsx
│   │   └── index.ts
│   ├── pharmacy/               # Pharmacy management
│   ├── lab/                    # Laboratory testing
│   ├── radiology/              # Radiology operations
│   ├── inpatient/              # Inpatient management
│   ├── billing/                # Transactions and receipts
│   ├── admin/                  # Administration
│   ├── directories/            # Directories and listings
│   ├── auth/                   # Authentication pages
│   └── dashboard/              # Dashboard and main views
│
├── components/                  # Shared components
│   ├── common/                 # Reusable UI components
│   ├── forms/                  # Form components
│   ├── tables/                 # Table components
│   ├── modals/                 # Modal dialogs
│   ├── layouts/                # Layout wrappers
│   ├── Layout.tsx              # Main app layout
│   └── CommandSearch.tsx        # Global search
│
├── services/                    # Business logic and API
│   ├── dataService.ts          # Data storage abstraction
│   ├── errorService.ts         # Error handling and logging
│   ├── apiService.ts           # API client with caching
│   ├── geminiService.ts        # Google Gemini API
│   └── notificationService.ts  # Notifications
│
├── contexts/                    # React Context providers
│   ├── AuthContext.tsx         # Authentication state
│   └── LanguageContext.tsx     # Language/i18n state
│
├── lib/                         # Utilities and helpers
│   ├── firebase.ts             # Firebase configuration
│   ├── supabase.ts             # Supabase configuration
│   ├── firestoreErrorHandler.ts
│   ├── utils.ts                # General utilities
│   ├── exportUtils.ts          # Export/PDF utilities
│   └── themes.ts               # UI themes
│
├── data/                        # Data and seed data
│   └── seedData.ts
│
├── types.ts                     # Global type definitions
├── App.tsx                      # Root component
├── main.tsx                     # Entry point
└── index.css                    # Global styles
```

## Core Systems

### 1. Authentication System (AuthContext)
- **Provider**: Firebase Authentication / Custom
- **Features**:
  - User login/logout
  - Role-based access control (RBAC)
  - Permission checking
  - Persistent sessions

### 2. Data Storage Layer (dataService)
- **Dual Provider Support**:
  - Firebase Firestore (primary cloud)
  - Supabase PostgreSQL (alternative)
  - LocalStorage (fallback)
- **Operations**: CRUD, real-time subscriptions, batch operations
- **Collections**:
  - Patients, Doctors, Nurses, Users
  - Appointments, Clinical Visits, Diagnoses
  - Pharmacy items, Lab tests, Radiology scans
  - Transactions, Receipts, Reports

### 3. API Layer (apiService)
- **Features**:
  - Centralized fetch wrapper
  - Automatic retries with exponential backoff
  - Response caching
  - Error handling
  - Request/response interceptors ready

### 4. Error Handling & Logging (errorService)
- **Log Levels**: DEBUG, INFO, WARN, ERROR, CRITICAL
- **Features**:
  - Structured logging
  - Log aggregation
  - Exportable logs
  - Browser console integration

### 5. Feature Modules

#### Clinical Module
- **Pages**: Clinical Visits, Queue Management, Appointments, AI Diagnosis
- **Features**:
  - Patient queue management
  - Clinical visit recording
  - AI-powered diagnosis assistance
  - Real-time patient flow

#### Pharmacy Module  
- **Pages**: Pharmacy dashboard
- **Features**:
  - Medication inventory
  - Prescription management
  - Stock tracking
  - Expiry monitoring

#### Laboratory Module
- **Pages**: Laboratory dashboard
- **Features**:
  - Test requests
  - Result tracking
  - Quality control
  - Report generation

#### Admin Module
- **Pages**: Users, Doctors, Reports, Settings, Clinics
- **Features**:
  - User management
  - Role assignments
  - System configuration
  - Audit logging

#### Directories Module
- **Pages**: All directory listings (doctors, nurses, departments, etc.)
- **Features**:
  - Staff directory
  - Department organization
  - Service listings
  - Resource allocation

### 6. Real-time Features
- **Socket.io Integration**: Staff chat system
- **Firebase Real-time**: Data subscriptions
- **Database Sync**: Automatic updates across clients

## Build & Optimization

### Bundle Optimization (Phase 2)
- **Manual Chunks**:
  - `vendor.js`: React, Router DOM
  - `firebase.js`: Firebase dependencies
  - `ui.js`: Lucide icons, Motion library
  - `supabase.js`: Supabase client
  - `index.js`: Application code

### Code Splitting Strategy
- **Route-based**: Lazy load feature modules
- **Vendor splitting**: Separate third-party libraries
- **Async imports**: Dynamic feature loading
- **Target Bundle Size**: <2.5MB gzipped

### Performance Targets
- **Initial Load**: <2 seconds
- **Time to Interactive**: <3 seconds
- **Largest Contentful Paint**: <2.5 seconds
- **Cumulative Layout Shift**: <0.1

## Type Safety

### TypeScript Configuration
- **Mode**: Strict (`strict: true`)
- **Target**: ES2020
- **Module Resolution**: Node
- **JSX**: React 19

### Type Organization
- **Global Types**: `src/types.ts`
- **Feature Types**: `src/features/*/types.ts` (when needed)
- **API Types**: Defined with request/response contracts
- **Validation**: Ready for runtime validation with zod

## Development Workflow

### Running Locally
```bash
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # TypeScript check
npm run preview      # Preview production build
```

### Building for Production
```bash
npm run build        # Creates optimized dist/
# Output includes:
# - Minified JS/CSS
# - Service worker (PWA)
# - Source maps
# - Server bundle (Express)
```

### Testing (Ready for Phase 5)
```bash
npm run test         # Run tests with Vitest
npm run coverage     # Code coverage report
```

## Database Schema

### Collections/Tables

**Users**
- id, email, password, role, createdAt, permissions

**Patients**
- id, name, phone, address, medicalHistory, createdAt

**Doctors**
- id, name, specialization, phone, clinic, schedule

**Appointments**
- id, patientId, doctorId, time, type, status

**Clinical Visits**
- id, patientId, doctorId, notes, diagnosis, prescriptions

**Transactions**
- id, userId, amount, type, description, date

And 15+ other collections for pharmacy, lab, radiology, etc.

## Security

### Authentication & Authorization
- **JWT-based sessions** (Firebase Auth)
- **Role-based access control** (RBAC)
- **Protected routes** with permission checks
- **Secure data validation** on client and server

### Data Protection
- **HTTPS only** in production
- **Environment variables** for secrets
- **CORS configuration** for cross-origin requests
- **Rate limiting** ready (apiService)
- **Input sanitization** via React

### Server Security (Express)
- **Middleware stack**: CORS, helmet, compression
- **Error handling**: Custom error responses
- **Logging**: Request/response tracking
- **Authentication**: Token verification

## Deployment

### Supported Platforms
1. **Vercel** (recommended): Zero-config deployment
2. **Google Cloud Run**: Serverless container
3. **AWS**: EC2, Elastic Beanstalk, Lambda
4. **Docker**: Any cloud provider
5. **Traditional VPS**: Linux server hosting
6. **Heroku**: Simple deployment
7. **Self-hosted**: Express server

### Environment Variables
```
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_API_KEY
GEMINI_API_KEY
SUPABASE_URL
SUPABASE_ANON_KEY
```

### PWA Configuration
- **Service Worker**: Offline support
- **Web Manifest**: App installation
- **Precaching**: Static asset caching
- **Workbox**: Advanced caching strategies

## Monitoring & Logging

### Error Tracking
- `errorService`: Client-side error logging
- **Console integration**: Browser dev tools
- **Log export**: JSON export for analysis
- **Error recovery**: Graceful degradation

### Performance Monitoring (Ready)
- **Core Web Vitals**: LCP, INP, CLS tracking
- **Bundle analysis**: Asset breakdown
- **Runtime metrics**: Component render times

## Future Enhancements

### Phase 3: API Refactoring
- Entity-specific service modules
- Request/response interceptors
- Advanced caching strategies
- Offline-first data sync

### Phase 4: Testing
- Unit tests with Vitest
- Integration tests
- Component tests
- E2E tests with Playwright

### Phase 5: Documentation
- API documentation
- Component storybook
- Contributing guidelines
- Troubleshooting guide

### Phase 6: Additional Features
- Advanced reporting
- Analytics dashboard
- Mobile app (Capacitor)
- Desktop app (Electron)
- Multi-tenant support

## Contributing

### Code Standards
- TypeScript strict mode required
- Component composition over inheritance
- Proper error handling in all async operations
- Accessibility compliance (WCAG 2.1)

### Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: Feature branches
- `bugfix/*`: Bug fix branches

### Pull Request Process
1. Create feature branch
2. Make changes with tests
3. Submit PR with description
4. Code review by team
5. Merge to develop
6. Release to main

## Troubleshooting

### Build Issues
- Clear `node_modules` and reinstall
- Check Node version (18+)
- Verify environment variables
- Review console for specific errors

### Runtime Issues
- Check browser console for errors
- Verify Firebase/Supabase connection
- Check network requests (DevTools)
- Review error logs in errorService

### Performance Issues
- Analyze bundle with `npm run build` output
- Check large chunks in DevTools
- Review component render counts
- Profile with Chrome DevTools

## Resources

- [React 19 Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Firebase Docs](https://firebase.google.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Last Updated**: June 6, 2026
**Architecture Version**: 2.0 (Modular Features)
**Status**: Production Ready
