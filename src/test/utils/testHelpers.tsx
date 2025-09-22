import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApolloProvider } from '@apollo/client';
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';

// Test data factories
export const createMockUser = (overrides = {}) => ({
  _id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'USER',
  permissions: ['read'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  emailVerified: true,
  isActive: true,
  ...overrides,
});

export const createMockTransaction = (overrides = {}) => ({
  _id: 'transaction-123',
  userId: 'user-123',
  amount: 100,
  type: 'EXPENSE' as const,
  category: 'FOOD',
  description: 'Test transaction',
  date: new Date('2024-01-01'),
  tags: ['test'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createMockGoal = (overrides = {}) => ({
  _id: 'goal-123',
  userId: 'user-123',
  name: 'Emergency Fund',
  targetAmount: 10000,
  currentAmount: 5000,
  targetDate: new Date('2024-12-31'),
  category: 'EMERGENCY',
  description: 'Build emergency fund',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createMockBudget = (overrides = {}) => ({
  _id: 'budget-123',
  userId: 'user-123',
  category: 'FOOD',
  limit: 500,
  spent: 250,
  period: 'MONTHLY' as const,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  isActive: true,
  ...overrides,
});

// Apollo Client test utilities
export const createMockApolloClient = (mocks: MockedResponse[] = []) => {
  return new ApolloClient({
    link: createHttpLink({
      uri: '/api/graphql',
      fetch: jest.fn(),
    }),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'all',
      },
      query: {
        errorPolicy: 'all',
      },
    },
  });
};

// Enhanced render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  apolloMocks?: MockedResponse[];
  initialRouterState?: {
    route?: string;
    pathname?: string;
    query?: Record<string, string>;
    asPath?: string;
  };
  user?: any;
  theme?: 'light' | 'dark';
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { user: ReturnType<typeof userEvent.setup> } => {
  const {
    apolloMocks = [],
    initialRouterState = {},
    user: mockUser,
    theme = 'light',
    ...renderOptions
  } = options;

  // Mock router state
  const mockRouter = {
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: jest.fn(),
    pop: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn().mockResolvedValue(undefined),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    isFallback: false,
    isLocaleDomain: true,
    isReady: true,
    isPreview: false,
    ...initialRouterState,
  };

  // Create wrapper with all providers
  const AllProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <MockedProvider mocks={apolloMocks} addTypename={false}>
        <div data-theme={theme}>
          {children}
        </div>
      </MockedProvider>
    );
  };

  const user = userEvent.setup();

  return {
    user,
    ...render(ui, {
      wrapper: AllProviders,
      ...renderOptions,
    }),
  };
};

// API test utilities
export const createMockRequest = (overrides = {}) => ({
  method: 'GET',
  url: '/api/test',
  headers: {
    'content-type': 'application/json',
    'user-agent': 'test-agent',
  },
  body: {},
  query: {},
  cookies: {},
  ...overrides,
});

export const createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    getHeader: jest.fn(),
    removeHeader: jest.fn(),
    end: jest.fn(),
    redirect: jest.fn(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    statusCode: 200,
    headers: {},
  };

  return res;
};

// Authentication test utilities
export const createMockAuthContext = (overrides = {}) => ({
  user: createMockUser(),
  isAuthenticated: true,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  signup: jest.fn(),
  refreshToken: jest.fn(),
  updateProfile: jest.fn(),
  ...overrides,
});

export const createMockSecurityContext = (overrides = {}) => ({
  userId: 'user-123',
  email: 'test@example.com',
  role: 'USER',
  permissions: ['read'],
  sessionId: 'session-123',
  ipAddress: '127.0.0.1',
  userAgent: 'test-agent',
  lastActivity: new Date(),
  mfaVerified: false,
  deviceFingerprint: 'test-fingerprint',
  ...overrides,
});

// Form test utilities
export const fillForm = async (user: ReturnType<typeof userEvent.setup>, formData: Record<string, string>) => {
  for (const [field, value] of Object.entries(formData)) {
    const input = document.querySelector(`[name="${field}"]`) as HTMLInputElement;
    if (input) {
      await user.clear(input);
      await user.type(input, value);
    }
  }
};

export const submitForm = async (user: ReturnType<typeof userEvent.setup>, formSelector = 'form') => {
  const form = document.querySelector(formSelector);
  if (form) {
    const submitButton = form.querySelector('[type="submit"]') as HTMLButtonElement;
    if (submitButton) {
      await user.click(submitButton);
    }
  }
};

// Error testing utilities
export const expectErrorToBeThrown = async (asyncFn: () => Promise<any>, expectedError?: string | RegExp) => {
  await expect(asyncFn()).rejects.toThrow(expectedError);
};

export const expectNoErrors = async (asyncFn: () => Promise<any>) => {
  await expect(asyncFn()).resolves.not.toThrow();
};

// Chart testing utilities
export const mockChartJS = () => {
  const mockChart = {
    destroy: jest.fn(),
    update: jest.fn(),
    render: jest.fn(),
    resize: jest.fn(),
    clear: jest.fn(),
    toBase64Image: jest.fn().mockReturnValue('data:image/png;base64,mock'),
    generateLegend: jest.fn().mockReturnValue('<ul></ul>'),
    getElementAtEvent: jest.fn().mockReturnValue([]),
    getElementsAtEvent: jest.fn().mockReturnValue([]),
    getDatasetAtEvent: jest.fn().mockReturnValue([]),
  };

  (global as any).Chart = jest.fn().mockImplementation(() => mockChart);
  return mockChart;
};

// Date utilities for testing
export const createDateRange = (startDate: string, endDate: string) => ({
  startDate: new Date(startDate),
  endDate: new Date(endDate),
});

export const mockDate = (date: string) => {
  const mockDate = new Date(date);
  jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
  return mockDate;
};

export const restoreDate = () => {
  jest.restoreAllMocks();
};

// Local storage test utilities
export const setLocalStorageItem = (key: string, value: any) => {
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  (window.localStorage.setItem as jest.Mock).mockImplementation((k, v) => {
    if (k === key) return stringValue;
  });
  (window.localStorage.getItem as jest.Mock).mockImplementation((k) => {
    if (k === key) return stringValue;
    return null;
  });
};

export const clearLocalStorage = () => {
  (window.localStorage.clear as jest.Mock).mockClear();
  (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
  (window.localStorage.setItem as jest.Mock).mockClear();
  (window.localStorage.removeItem as jest.Mock).mockClear();
};

// Network request mocking
export const mockFetch = (responses: Array<{ url: string; response: any; status?: number }>) => {
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    const mockResponse = responses.find(r => url.includes(r.url));
    if (mockResponse) {
      return Promise.resolve({
        ok: (mockResponse.status || 200) < 400,
        status: mockResponse.status || 200,
        json: () => Promise.resolve(mockResponse.response),
        text: () => Promise.resolve(JSON.stringify(mockResponse.response)),
      });
    }
    return Promise.reject(new Error(`No mock response found for ${url}`));
  });
};

export const mockFetchError = (url: string, error: Error) => {
  (global.fetch as jest.Mock).mockImplementation((requestUrl: string) => {
    if (requestUrl.includes(url)) {
      return Promise.reject(error);
    }
    return Promise.resolve({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal Server Error' }),
    });
  });
};

// Wait utilities
export const waitForElement = async (selector: string, timeout = 5000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const element = document.querySelector(selector);
    if (element) return element;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Element with selector "${selector}" not found within ${timeout}ms`);
};

export const waitForCondition = async (condition: () => boolean, timeout = 5000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (condition()) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Condition not met within ${timeout}ms`);
};

// Performance testing utilities
export const measurePerformance = async (fn: () => Promise<any>) => {
  const start = performance.now();
  await fn();
  const end = performance.now();
  return end - start;
};

export const expectPerformance = async (fn: () => Promise<any>, maxTime: number) => {
  const duration = await measurePerformance(fn);
  expect(duration).toBeLessThan(maxTime);
  return duration;
};

// Accessibility testing utilities
export const checkA11y = async (container: HTMLElement) => {
  // Mock axe-core for accessibility testing
  const violations = []; // In a real implementation, this would use axe-core
  expect(violations).toHaveLength(0);
};

// File upload testing utilities
export const createMockFile = (name: string, size: number, type: string, content = 'file content') => {
  const file = new File([content], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

export const mockFileUpload = async (user: ReturnType<typeof userEvent.setup>, input: HTMLInputElement, files: File[]) => {
  await user.upload(input, files);
};

// Error boundary testing
export const ThrowError = ({ shouldThrow, error }: { shouldThrow: boolean; error?: Error }) => {
  if (shouldThrow) {
    throw error || new Error('Test error');
  }
  return <div>No error</div>;
};

// Export all utilities
export const testUtils = {
  // Factories
  createMockUser,
  createMockTransaction,
  createMockGoal,
  createMockBudget,

  // Apollo
  createMockApolloClient,

  // API testing
  createMockRequest,
  createMockResponse,

  // Auth
  createMockAuthContext,
  createMockSecurityContext,

  // Forms
  fillForm,
  submitForm,

  // Errors
  expectErrorToBeThrown,
  expectNoErrors,

  // Charts
  mockChartJS,

  // Dates
  createDateRange,
  mockDate,
  restoreDate,

  // Storage
  setLocalStorageItem,
  clearLocalStorage,

  // Network
  mockFetch,
  mockFetchError,

  // Waiting
  waitForElement,
  waitForCondition,

  // Performance
  measurePerformance,
  expectPerformance,

  // Accessibility
  checkA11y,

  // Files
  createMockFile,
  mockFileUpload,

  // Error boundaries
  ThrowError,
};

export default testUtils;