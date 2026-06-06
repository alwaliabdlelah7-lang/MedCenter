# Testing Guide

## Overview

MedCenter HIS uses Vitest for unit and integration testing with React Testing Library for component tests.

## Setup

### Running Tests

```bash
# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test src/__tests__/services/errorService.test.ts

# Watch mode
npm run test -- --watch
```

## Test Structure

Tests are organized in `src/__tests__/` mirroring the source structure:

```
src/__tests__/
├── setup.ts                 # Global test setup
├── utils/
│   └── test-utils.tsx      # Custom render with providers
└── services/
    ├── errorService.test.ts
    ├── apiService.test.ts
    └── entityServiceFactory.test.ts
```

## Writing Tests

### Service Tests

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { errorService } from '@/services/errorService';

describe('ErrorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log messages', () => {
    const spy = vi.spyOn(console, 'log');
    errorService.info('Test message');
    expect(spy).toHaveBeenCalled();
  });
});
```

### Component Tests

```typescript
import { render, screen } from '@/__tests__/utils/test-utils';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });
});
```

### Mocking

```typescript
// Mock Firebase
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
}));

// Mock service
vi.mock('@/services/dataService', () => ({
  dataStore: {
    getAll: vi.fn(),
    find: vi.fn(),
  }
}));
```

## Test Utilities

### Custom Render

The test-utils provides a custom render function that wraps components with required providers:

```typescript
import { render, screen } from '@/__tests__/utils/test-utils';

// Automatically wrapped with AuthProvider and LanguageProvider
render(<MyAuthenticatedComponent />);
```

### Mock Data

Global mock data available in test setup:

```typescript
import { mockData } from '@/__tests__/setup';

const patient = mockData.patient;
const doctor = mockData.doctor;
```

## Coverage

Generate coverage reports:

```bash
npm run test:coverage
```

Coverage reports are generated in `coverage/` directory with HTML reports in `coverage/index.html`.

Target Coverage:
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

## Best Practices

1. Test behavior, not implementation details
2. Use descriptive test names
3. Keep tests focused on single responsibility
4. Mock external dependencies (Firebase, Supabase)
5. Use beforeEach for common setup
6. Clean up after tests with afterEach
7. Use screen queries instead of container
8. Test accessibility with aria attributes
9. Use user-event for user interactions
10. Test error states and edge cases
