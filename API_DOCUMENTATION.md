# API Documentation

## Overview

This document covers the MedCenter HIS API services, entity service factories, and error handling systems.

## Service Architecture

### Entity Services

All entity services are created using the `createEntityService` factory pattern for type-safe CRUD operations.

```typescript
import { createEntityService } from '@/services/entityServiceFactory';

// Create typed service for any entity
const patientsService = createEntityService<Patient>('patients');
const doctorsService = createEntityService<Doctor>('doctors');
```

### Available Services

- **patientsService** - Manage patient records
- **doctorsService** - Manage doctor profiles and credentials
- **appointmentsService** - Handle appointment scheduling
- **clinicalVisitsService** - Track clinical visits
- **pharmacyService** - Manage pharmacy transactions
- **labService** - Laboratory test management
- **radiologyService** - Radiology imaging records
- **transactionsService** - Financial transactions
- **usersService** - User management
- **nursesService** - Nursing staff directory
- **departmentsService** - Department management

### CRUD Operations

All entity services provide standard CRUD methods:

```typescript
// Get all items
const items = await patientsService.getAll();

// Find with criteria
const results = await patientsService.find({ gender: 'male' });

// Get by ID
const patient = await patientsService.getById('patient-123');

// Add new item
const newId = await patientsService.add({
  name: 'Ahmed Mohammed',
  gender: 'male',
  phone: '01234567890'
});

// Update item
const updated = await patientsService.update('patient-123', {
  phone: '01987654321'
});

// Delete item
await patientsService.delete('patient-123');

// Subscribe to changes
patientsService.subscribe((patients) => {
  console.log('Patients updated:', patients);
});
```

## Error Handling

### Error Service

Centralized logging with multiple severity levels:

```typescript
import { errorService } from '@/services/errorService';

// DEBUG level
errorService.debug('Debug message', { context: 'data' });

// INFO level
errorService.info('Operation successful', { userId: '123' });

// WARN level
errorService.warn('Deprecated API usage');

// ERROR level
errorService.error('Failed to fetch', { endpoint: '/api/patients' }, error);

// CRITICAL level
errorService.critical('System failure', { component: 'auth' }, error);
```

## API Interceptors

Request/response interceptor middleware for consistent API handling:

```typescript
import { apiInterceptor } from '@/services/apiInterceptor';

// Add request interceptor
apiInterceptor.addRequestInterceptor((context) => {
  return {
    ...context,
    headers: {
      ...context.headers,
      'Authorization': `Bearer ${getToken()}`
    }
  };
});

// Add response interceptor
apiInterceptor.addResponseInterceptor((context) => {
  console.log('Response:', context.response.status);
  return context;
});

// Add error interceptor
apiInterceptor.addErrorInterceptor((context) => {
  errorService.error('API Error', { url: context.url }, context.error);
});
```

## Best Practices

1. Always use entity services for database operations
2. Handle errors with errorService for consistent logging
3. Use interceptors for cross-cutting concerns (auth, logging)
4. Type all entity services with TypeScript generics
5. Subscribe to services for real-time updates
6. Use feature-based imports from feature index files

## Feature-Based Imports

Each feature module exports its pages and services:

```typescript
// From clinical feature
import { ClinicalVisits, AIDiagnosisAssistant } from '@/features/clinical';

// From admin feature
import { UsersManagement, Reports } from '@/features/admin';

// From services
import { patientsService, doctorsService } from '@/services/entityServiceFactory';
```
