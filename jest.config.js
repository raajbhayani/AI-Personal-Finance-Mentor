const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Setup files to run before each test
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],

  // Test environment
  testEnvironment: 'jest-environment-jsdom',

  // Module name mapping for absolute imports and aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@/styles/(.*)$': '<rootDir>/src/styles/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/test/(.*)$': '<rootDir>/src/test/$1',
  },

  // Test file patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.(test|spec).{js,jsx,ts,tsx}',
    '<rootDir>/tests/**/*.{js,jsx,ts,tsx}',
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/',
  ],

  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/pages/_app.tsx',
    '!src/pages/_document.tsx',
    '!src/pages/api/**/*.ts', // Covered by integration tests
    '!src/test/**/*',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.config.{js,jsx,ts,tsx}',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Specific thresholds for critical components
    './src/lib/errors/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/lib/security/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/lib/auth/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },

  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json',
    'clover',
  ],

  // Coverage directory
  coverageDirectory: '<rootDir>/coverage',

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Global setup and teardown
  globalSetup: '<rootDir>/src/test/globalSetup.ts',
  globalTeardown: '<rootDir>/src/test/globalTeardown.ts',

  // Test timeout
  testTimeout: 30000,

  // Max workers for parallel testing
  maxWorkers: '50%',

  // Error on deprecated features
  errorOnDeprecated: true,

  // Force exit after tests complete
  forceExit: false,

  // Detect open handles
  detectOpenHandles: true,

  // Detect leaks
  detectLeaks: false,

  // Extensions to treat as ESM
  extensionsToTreatAsEsm: ['.ts', '.tsx'],

  // Preset for additional Jest extensions
  preset: undefined,

  // Custom resolver
  resolver: undefined,

  // Snapshot serializers
  snapshotSerializers: [],

  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],

  // Projects for multi-project configuration
  projects: [
    {
      displayName: 'Unit Tests',
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.unit.{js,jsx,ts,tsx}',
        '<rootDir>/src/**/*.unit.(test|spec).{js,jsx,ts,tsx}',
      ],
      setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
    },
    {
      displayName: 'Integration Tests',
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.integration.{js,jsx,ts,tsx}',
        '<rootDir>/src/**/*.integration.(test|spec).{js,jsx,ts,tsx}',
        '<rootDir>/tests/integration/**/*.{js,jsx,ts,tsx}',
      ],
      setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
      testEnvironment: 'node',
    },
    {
      displayName: 'Component Tests',
      testMatch: [
        '<rootDir>/src/components/**/__tests__/**/*.{js,jsx,ts,tsx}',
        '<rootDir>/src/components/**/*.(test|spec).{js,jsx,ts,tsx}',
      ],
      setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
      testEnvironment: 'jest-environment-jsdom',
    },
  ],

  // Report configuration
  reporters: [
    'default',
    [
      'jest-junit',
      {
        suiteName: 'AI Personal Finance Mentor Tests',
        outputDirectory: '<rootDir>/test-results',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
    [
      'jest-html-reporters',
      {
        publicPath: '<rootDir>/test-results',
        filename: 'test-report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'Test Report',
        logoImgPath: undefined,
        inlineSource: false,
      },
    ],
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);