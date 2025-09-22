# Testing Guide

This document provides comprehensive information about the testing framework and practices for the AI Personal Finance Mentor application.

## Table of Contents

- [Testing Framework Overview](#testing-framework-overview)
- [Test Types](#test-types)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Coverage](#test-coverage)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Testing Framework Overview

Our testing strategy employs multiple layers of testing to ensure comprehensive coverage:

- **Unit Tests**: Test individual components and functions in isolation
- **Integration Tests**: Test API endpoints and database interactions
- **E2E Tests**: Test complete user workflows across the application
- **Performance Tests**: Monitor application performance and Core Web Vitals

### Technologies Used

- **Jest**: JavaScript testing framework for unit and integration tests
- **React Testing Library**: Testing utilities for React components
- **Playwright**: End-to-end testing framework
- **MongoDB Memory Server**: In-memory MongoDB for testing
- **Lighthouse CI**: Performance and accessibility testing

## Test Types

### 1. Unit Tests

Located in `src/**/__tests__/**/*.unit.test.ts` and `src/**/*.unit.test.ts`

**Purpose**: Test individual components, functions, and modules in isolation.

**Examples**:
- Component rendering and behavior
- Utility function logic
- Custom hooks
- Error handling

**Key Features**:
- Fast execution
- Isolated testing environment
- Comprehensive mocking
- High test coverage requirements (>90% for critical modules)

### 2. Integration Tests

Located in `tests/integration/**/*.integration.test.ts`

**Purpose**: Test API endpoints, database interactions, and service integrations.

**Examples**:
- Authentication endpoints
- Transaction CRUD operations
- Error handling middleware
- External service integrations

**Key Features**:
- Real database interactions (MongoDB Memory Server)
- Request/response testing
- Security validation
- Data persistence verification

### 3. End-to-End (E2E) Tests

Located in `e2e/**/*.e2e.test.ts`

**Purpose**: Test complete user workflows and critical business processes.

**Examples**:
- User registration and login flows
- Transaction management workflows
- Goal setting and tracking
- Dashboard functionality

**Key Features**:
- Cross-browser testing
- Real user interactions
- Visual regression testing
- Performance monitoring

### 4. Component Tests

Located in `src/components/**/__tests__/**/*.test.tsx`

**Purpose**: Test React components with user interactions and state management.

**Examples**:
- Form validation and submission
- User interface behavior
- Accessibility compliance
- Responsive design

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers (for E2E tests)
npm run playwright:install
```

### Available Test Commands

```bash
# Run all unit tests
npm run test:unit

# Run all integration tests
npm run test:integration

# Run all component tests
npm run test:components

# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode (visible browser)
npm run test:e2e:headed

# Run all tests
npm run test:all

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# CI test command
npm run test:ci
```

### Test Environment Setup

Tests automatically set up the required environment:

- **Unit/Component Tests**: Use Jest with jsdom environment
- **Integration Tests**: Use MongoDB Memory Server
- **E2E Tests**: Use real browser instances with test database

## Writing Tests

### Unit Test Example

```typescript
// src/lib/utils/__tests__/dateUtils.unit.test.ts
import { formatCurrency, calculateDateDifference } from '../dateUtils';

describe('Date Utilities', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(-500.75)).toBe('-$500.75');
    });
  });

  describe('calculateDateDifference', () => {
    it('should calculate days between dates', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-15');
      expect(calculateDateDifference(date1, date2)).toBe(14);
    });
  });
});
```

### Component Test Example

```typescript
// src/components/__tests__/TransactionForm.test.tsx
import { renderWithProviders } from '../../test/utils/testHelpers';
import { TransactionForm } from '../TransactionForm';

describe('TransactionForm', () => {
  it('should submit form with valid data', async () => {
    const onSubmit = jest.fn();
    const { user } = renderWithProviders(
      <TransactionForm onSubmit={onSubmit} />
    );

    await user.fill('[data-testid="amount-input"]', '100');
    await user.selectOption('[data-testid="type-select"]', 'EXPENSE');
    await user.fill('[data-testid="description-input"]', 'Test expense');
    await user.click('[data-testid="submit-button"]');

    expect(onSubmit).toHaveBeenCalledWith({
      amount: 100,
      type: 'EXPENSE',
      description: 'Test expense',
    });
  });
});
```

### Integration Test Example

```typescript
// tests/integration/api/auth.integration.test.ts
import { createMocks } from 'node-mocks-http';
import loginHandler from '../../../src/pages/api/auth/login';

describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'Password123!',
      },
    });

    await loginHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.data.tokens.accessToken).toBeDefined();
  });
});
```

### E2E Test Example

```typescript
// e2e/auth.e2e.test.ts
import { test, expect } from './fixtures/auth';

test('should login successfully', async ({ page }) => {
  await page.goto('/login');

  await page.fill('[data-testid="email-input"]', 'test@example.com');
  await page.fill('[data-testid="password-input"]', 'Password123!');
  await page.click('[data-testid="login-submit"]');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
});
```

## Test Coverage

### Coverage Requirements

- **Critical modules** (security, auth, errors): 90%+
- **Business logic**: 85%+
- **Components**: 80%+
- **Overall project**: 80%+

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# Open coverage report in browser
npm run coverage:open

# Serve coverage report on localhost:8080
npm run coverage:serve
```

### Coverage Configuration

Coverage is configured in `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
  './src/lib/errors/': {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90,
  },
}
```

## CI/CD Integration

### GitHub Actions Workflows

1. **Test Suite** (`.github/workflows/test.yml`):
   - Runs on every push and PR
   - Executes all test types
   - Generates coverage reports
   - Performs security audits

2. **Deploy** (`.github/workflows/deploy.yml`):
   - Triggers after successful tests
   - Builds and deploys application
   - Runs smoke tests
   - Monitors performance

### Test Environments

- **Unit/Integration**: In-memory database
- **E2E**: Isolated test environment
- **CI**: Containerized environment with MongoDB service

### Quality Gates

All tests must pass before deployment:

- ✅ Unit tests (90%+ coverage for critical modules)
- ✅ Integration tests (API functionality)
- ✅ E2E tests (Critical user flows)
- ✅ Security audit (No high-severity vulnerabilities)
- ✅ Performance tests (Lighthouse scores >80)

## Best Practices

### General Testing Guidelines

1. **Follow the Testing Pyramid**:
   - Many unit tests (fast, isolated)
   - Fewer integration tests (medium speed)
   - Few E2E tests (slow, comprehensive)

2. **Write Tests First** (TDD):
   - Red: Write failing test
   - Green: Make test pass
   - Refactor: Improve code quality

3. **Test Behavior, Not Implementation**:
   - Focus on what the code does
   - Avoid testing internal details
   - Test user-facing functionality

### Naming Conventions

```typescript
// Describe blocks: what is being tested
describe('UserService', () => {
  describe('createUser', () => {
    // Test cases: what should happen
    it('should create user with valid data', () => {});
    it('should throw error for duplicate email', () => {});
    it('should hash password before saving', () => {});
  });
});
```

### Test Data Management

```typescript
// Use factories for consistent test data
const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  ...overrides,
});

// Use test-specific data
const testUser = createMockUser({ email: 'specific@test.com' });
```

### Async Testing

```typescript
// Always await async operations
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});

// Use proper timeouts for slow operations
it('should handle slow operations', async () => {
  await expect(slowFunction()).resolves.toBeDefined();
}, 10000); // 10 second timeout
```

### Error Testing

```typescript
// Test error conditions
it('should handle errors gracefully', async () => {
  await expect(functionThatThrows()).rejects.toThrow('Expected error');
});

// Test error boundaries
it('should catch component errors', () => {
  const ThrowError = () => { throw new Error('Test error'); };

  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});
```

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Issues

```bash
# Solution: Ensure MongoDB Memory Server is properly configured
# Check globalSetup.ts and globalTeardown.ts
```

#### 2. Jest Timeout Errors

```javascript
// Increase timeout for slow tests
jest.setTimeout(30000); // 30 seconds
```

#### 3. Playwright Browser Issues

```bash
# Reinstall browsers
npm run playwright:install

# Install system dependencies
npm run playwright:install-deps
```

#### 4. Mock Issues

```typescript
// Clear mocks between tests
afterEach(() => {
  jest.clearAllMocks();
});

// Reset modules for clean state
afterEach(() => {
  jest.resetModules();
});
```

### Debug Mode

```bash
# Debug Jest tests
npm run test -- --debug

# Debug Playwright tests
npm run test:e2e:debug

# Run specific test file
npm run test -- auth.test.ts

# Run tests matching pattern
npm run test -- --testNamePattern="should login"
```

### Environment Variables

Ensure these environment variables are set for testing:

```bash
NODE_ENV=test
MONGODB_URI=mongodb://localhost:27017/test-finance-app
JWT_SECRET=test-jwt-secret
JWT_REFRESH_SECRET=test-jwt-refresh-secret
```

### Performance Optimization

1. **Parallel Test Execution**:
   ```javascript
   // jest.config.js
   maxWorkers: '50%'
   ```

2. **Test Isolation**:
   ```typescript
   // Clean up after each test
   afterEach(async () => {
     await cleanup();
   });
   ```

3. **Selective Test Running**:
   ```bash
   # Run only changed files
   npm run test -- --onlyChanged

   # Run related tests
   npm run test -- --findRelatedTests src/components/Button.tsx
   ```

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

For questions or issues with testing, please refer to this guide or create an issue in the project repository.