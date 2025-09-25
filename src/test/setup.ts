import '@testing-library/jest-dom';
import React from 'react';

// Extend Jest matchers
import 'jest-extended';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
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
    };
  },
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-finance-app';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';

// Global test configuration
global.console = {
  ...console,
  // Uncomment to suppress specific log levels during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Mock window.matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

// Mock ResizeObserver
class MockResizeObserver {
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: MockResizeObserver,
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock crypto for Node.js environment
const crypto = require('crypto');

Object.defineProperty(global.self, 'crypto', {
  value: {
    getRandomValues: (arr: any) => crypto.randomBytes(arr.length),
    subtle: {
      importKey: jest.fn(),
      exportKey: jest.fn(),
      generateKey: jest.fn(),
      sign: jest.fn(),
      verify: jest.fn(),
      encrypt: jest.fn(),
      decrypt: jest.fn(),
    },
  },
});

// Mock File and FileReader for file upload tests
global.File = class File {
  constructor(
    public chunks: BlobPart[],
    public name: string,
    public options?: FilePropertyBag
  ) {
    this.size = chunks.reduce((acc, chunk) => {
      if (typeof chunk === 'string') return acc + chunk.length;
      if (chunk instanceof ArrayBuffer) return acc + chunk.byteLength;
      return acc + (chunk as any).size || 0;
    }, 0);
    this.type = options?.type || '';
    this.lastModified = options?.lastModified || Date.now();
  }
  size: number;
  type: string;
  lastModified: number;

  stream() {
    return new ReadableStream();
  }

  async text() {
    return this.chunks.join('');
  }

  async arrayBuffer() {
    return new ArrayBuffer(this.size);
  }

  slice() {
    return new File([], this.name);
  }
};

global.FileReader = class FileReader extends EventTarget {
  readyState = 0;
  result = null;
  error = null;

  readAsText = jest.fn().mockImplementation(() => {
    this.readyState = 2;
    this.result = 'file content';
    this.dispatchEvent(new Event('load'));
  });

  readAsDataURL = jest.fn().mockImplementation(() => {
    this.readyState = 2;
    this.result = 'data:text/plain;base64,ZmlsZSBjb250ZW50';
    this.dispatchEvent(new Event('load'));
  });

  readAsArrayBuffer = jest.fn().mockImplementation(() => {
    this.readyState = 2;
    this.result = new ArrayBuffer(8);
    this.dispatchEvent(new Event('load'));
  });

  abort = jest.fn();
} as any;

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Mock canvas for chart.js tests
HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn().mockReturnValue({
    data: new Uint8ClampedArray(4),
  }),
  putImageData: jest.fn(),
  createImageData: jest.fn().mockReturnValue([]),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  fillText: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn().mockReturnValue({ width: 0 }),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
});

// Mock chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
    defaults: {
      global: {
        responsive: true,
      },
    },
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  BarElement: jest.fn(),
  LineElement: jest.fn(),
  PointElement: jest.fn(),
  ArcElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
  Filler: jest.fn(),
}));

// Mock react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  Bar: () => ({ type: 'div', props: { 'data-testid': 'bar-chart' } }),
  Line: () => ({ type: 'div', props: { 'data-testid': 'line-chart' } }),
  Pie: () => ({ type: 'div', props: { 'data-testid': 'pie-chart' } }),
  Doughnut: () => ({ type: 'div', props: { 'data-testid': 'doughnut-chart' } }),
}));

// Global test helpers
global.createMockEvent = (overrides = {}) => ({
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  target: { value: '' },
  currentTarget: { value: '' },
  ...overrides,
});

global.createMockFormData = (data: Record<string, any> = {}) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
};

// Mock timers setup
global.setupTimers = () => {
  jest.useFakeTimers();
  return {
    advanceBy: (ms: number) => jest.advanceTimersByTime(ms),
    runAll: () => jest.runAllTimers(),
    restore: () => jest.useRealTimers(),
  };
};

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  localStorage.clear();
  sessionStorage.clear();

  // Reset fetch mock
  if (global.fetch) {
    (global.fetch as jest.Mock).mockClear();
  }
});

// Global test timeout
jest.setTimeout(30000);

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Suppress specific console warnings in tests
const originalConsoleError = console.error;
console.error = (...args) => {
  // Suppress specific warnings that are expected in tests
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is deprecated') ||
     args[0].includes('Warning: An invalid form control') ||
     args[0].includes('act(() => ...)'))
  ) {
    return;
  }
  originalConsoleError.call(console, ...args);
};

// Export test utilities
export const testUtils = {
  createMockEvent: global.createMockEvent,
  createMockFormData: global.createMockFormData,
  setupTimers: global.setupTimers,
  localStorageMock,
  sessionStorageMock,
};

export default testUtils;