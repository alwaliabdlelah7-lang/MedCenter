# Contributing to MedCenter HIS

Thank you for your interest in contributing to MedCenter Hospital Information System! This guide will help you get started.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Coding Standards](#coding-standards)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Testing](#testing)
8. [Documentation](#documentation)

## Code of Conduct

- Be respectful and professional
- Provide constructive feedback
- Help others learn
- Report issues responsibly

## Getting Started

### Prerequisites

- Node.js 18+ or higher
- npm or yarn or pnpm
- Git
- Basic understanding of React, TypeScript, and Express.js

### Fork and Clone

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/your-username/MedCenter.git
cd MedCenter

# Add upstream remote
git remote add upstream https://github.com/alwaliabdlelah7-lang/MedCenter.git
```

## Development Setup

### Install Dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

### Environment Variables

Create `.env.local` file:

```env
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
GEMINI_API_KEY=your_gemini_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

### Running the Project

```bash
# Development server
npm run dev

# Open browser
# Visit http://localhost:5173

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run lint

# Test
npm run test
```

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Always provide explicit type annotations for functions
- Use interfaces for object shapes
- Avoid `any` type

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  // ...
}

// Bad
function getUser(id: any): any {
  // ...
}
```

### React Components

- Use functional components with hooks
- Use proper TypeScript types for props
- Keep components focused and small
- Extract complex logic to custom hooks

```typescript
// Good
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export function Button({ onClick, children, disabled }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

// Bad
export function Button(props: any) {
  // ...
}
```

### Naming Conventions

- Use `camelCase` for variables and functions
- Use `PascalCase` for components and classes
- Use `UPPER_SNAKE_CASE` for constants
- Use descriptive names

```typescript
// Good
const maxRetries = 3;
const getUserData = () => {};

interface UserProfile {
  // ...
}

class ErrorHandler {
  // ...
}

// Bad
const mr = 3;
const get = () => {};

interface UP {
  // ...
}

class EH {
  // ...
}
```

### File Structure

```
src/features/clinical/
├── pages/
│   ├── ClinicalVisits.tsx
│   └── Appointments.tsx
├── components/
│   ├── VisitForm.tsx
│   └── VisitList.tsx
├── services/
│   └── clinicalService.ts
├── types.ts
└── index.ts
```

### Error Handling

- Always handle errors in async operations
- Use the errorService for logging
- Provide user-friendly error messages

```typescript
// Good
try {
  const patient = await patientsService.getById(id);
  return patient;
} catch (error) {
  errorService.error('Failed to fetch patient', { id }, error as Error);
  throw error;
}

// Bad
const patient = await patientsService.getById(id);
return patient;
```

## Commit Guidelines

### Message Format

```
<type>: <subject>

<body>

<footer>
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `refactor`: Code refactoring
- `docs`: Documentation changes
- `test`: Adding tests
- `chore`: Build, ci, dependencies
- `style`: Code style changes

### Examples

```
feat: add patient appointment scheduling

- Implement appointment creation form
- Add appointment database schema
- Create appointment notifications

Closes #123
```

```
fix: resolve patient data sync issue

The dataStore was not properly syncing with Firebase
when switching between providers.

Closes #456
```

### Rules

- Use present tense ("add" not "added")
- Capitalize subject line
- Keep subject under 50 characters
- Separate subject from body with blank line
- Wrap body at 72 characters
- Reference issues in footer with "Closes #123"

## Pull Request Process

### Before Submitting

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Update documentation if needed
5. Ensure TypeScript compiles: `npm run lint`
6. Ensure tests pass (if applicable)
7. Commit with proper messages
8. Push to your fork

### Submitting

1. Go to the GitHub repository
2. Click "New Pull Request"
3. Select your branch
4. Fill in the PR template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested the changes

## Checklist
- [ ] Code follows style guidelines
- [ ] TypeScript compiles without errors
- [ ] Documentation updated
- [ ] Tests added (if applicable)
- [ ] No new warnings introduced
```

### Review Process

- At least one approval required
- All CI checks must pass
- Requested changes must be addressed
- Maintainers will merge when ready

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run coverage

# Watch mode
npm run test:watch

# Specific test file
npm run test -- PatientManagement
```

### Writing Tests

```typescript
// Good test structure
describe('patientsService', () => {
  it('should fetch all patients', async () => {
    const patients = await patientsService.getAll();
    expect(patients).toBeInstanceOf(Array);
  });

  it('should create a new patient', async () => {
    const newPatient = await patientsService.create({
      name: 'John Doe',
      phone: '1234567890'
    });
    expect(newPatient.id).toBeDefined();
  });
});
```

## Documentation

### Updating ARCHITECTURE.md

- Update when changing directory structure
- Document new services
- Explain new architectural decisions

### Adding API Documentation

```typescript
/**
 * Fetch a patient by ID
 * @param id - Patient ID
 * @returns Patient object or null if not found
 * @throws Error if database operation fails
 * @example
 * const patient = await patientsService.getById('123');
 */
export async function getPatientById(id: string): Promise<Patient | null> {
  // ...
}
```

### Inline Comments

```typescript
// Good
// Calculate the discount based on purchase amount
const discount = amount > 1000 ? 0.1 : 0;

// Bad
// i is the index
for (let i = 0; i < arr.length; i++) {
  // ...
}
```

## Common Tasks

### Adding a New Feature

1. Create feature folder in `src/features/`
2. Add pages, components, types, services
3. Create `index.ts` with exports
4. Update App.tsx routing
5. Add tests
6. Update documentation

### Creating a New Service

1. Create `src/services/serviceName.ts`
2. Export singleton instance
3. Add error handling with errorService
4. Document with JSDoc
5. Add tests

### Updating Types

1. Update `src/types.ts` for global types
2. Or create feature-specific `types.ts`
3. Use interfaces for object shapes
4. Document complex types

## Troubleshooting

### TypeScript Errors

```bash
# Clear cache and rebuild
rm -rf dist node_modules/.vite
npm run lint

# Check specific file
npm run lint -- src/myfile.tsx
```

### Build Issues

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist
npm run build
```

### Git Issues

```bash
# Update fork
git fetch upstream
git rebase upstream/main

# Squash commits
git rebase -i HEAD~3
```

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Vite Guide](https://vitejs.dev/guide)
- [Conventional Commits](https://www.conventionalcommits.org)
- [Git Flow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)

## Getting Help

- Check existing GitHub issues
- Read the ARCHITECTURE.md guide
- Review similar code patterns
- Ask in discussions section
- Open an issue with details

## License

By contributing, you agree that your contributions will be licensed under the project's license.

---

Thank you for contributing to MedCenter HIS!
