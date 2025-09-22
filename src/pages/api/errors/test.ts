import { NextApiRequest, NextApiResponse } from 'next';
import {
  ErrorCode,
  ValidationError,
  AuthenticationError,
  BusinessLogicError,
  SystemError,
  DatabaseError,
  ExternalServiceError,
  SecurityError,
} from '../../../lib/errors/customErrors';
import { withErrorHandling, sendSuccess } from '../../../lib/middleware/errorHandler';
import { logger } from '../../../lib/logging/structuredLogger';
import { errorReporting } from '../../../lib/monitoring/errorReporting';
import UserMessageService from '../../../lib/errors/userMessages';

interface ErrorTestRequest extends NextApiRequest {
  query: {
    type?: string;
    scenario?: string;
    includeUser?: string;
  };
}

interface ErrorTestResult {
  success: boolean;
  testType: string;
  scenario: string;
  results: {
    errorThrown: boolean;
    errorCaught: boolean;
    errorLogged: boolean;
    errorReported: boolean;
    userMessageGenerated: boolean;
    responseStatusCode: number;
    correlationId?: string;
    reportId?: string;
    userMessage?: any;
  };
  timings: {
    errorGeneration: number;
    errorHandling: number;
    logging: number;
    reporting: number;
    total: number;
  };
}

async function testErrorHandling(req: ErrorTestRequest, res: NextApiResponse) {
  const { type = 'validation', scenario = 'basic', includeUser = 'false' } = req.query;
  const startTime = Date.now();

  logger.info('Starting error handling test', {
    metadata: {
      testType: type,
      scenario,
      includeUser: includeUser === 'true',
    },
  });

  const timings = {
    errorGeneration: 0,
    errorHandling: 0,
    logging: 0,
    reporting: 0,
    total: 0,
  };

  let testResult: ErrorTestResult;

  try {
    // Test user setup
    if (includeUser === 'true') {
      errorReporting.setUser({
        id: 'test-user-123',
        email: 'test@example.com',
        role: 'USER',
        plan: 'premium',
      });
    }

    // Add some breadcrumbs for testing
    errorReporting.addBreadcrumb('Test started', 'user', 'testing', { testType: type });
    errorReporting.addBreadcrumb('Preparing to throw error', 'user', 'testing', { scenario });

    // Generate error based on type and scenario
    const errorGenStart = Date.now();
    const error = generateTestError(type, scenario);
    timings.errorGeneration = Date.now() - errorGenStart;

    // Test error reporting
    const reportStart = Date.now();
    const reportId = await errorReporting.reportError(error, {
      url: req.url,
      userAgent: req.headers['user-agent'],
      method: req.method,
    }, includeUser === 'true' ? {
      id: 'test-user-123',
      email: 'test@example.com',
      role: 'USER',
    } : undefined, {
      method: req.method,
      path: req.url,
      query: req.query,
      headers: {
        'user-agent': req.headers['user-agent'],
        'x-forwarded-for': req.headers['x-forwarded-for'],
      },
    });
    timings.reporting = Date.now() - reportStart;

    // Test user message generation
    const userMessage = UserMessageService.getUserMessage(
      error.code,
      {
        userRole: includeUser === 'true' ? 'USER' : undefined,
        isAuthenticated: includeUser === 'true',
        fieldName: scenario === 'field-specific' ? 'email' : undefined,
      }
    );

    // Log the test
    const logStart = Date.now();
    logger.error('Test error generated', error, {
      metadata: {
        testError: true,
        testType: type,
        scenario,
        reportId,
      },
    });
    timings.logging = Date.now() - logStart;

    // Instead of throwing (which would trigger the error handler),
    // we'll create a test result showing what would happen
    testResult = {
      success: true,
      testType: type,
      scenario,
      results: {
        errorThrown: true,
        errorCaught: false, // Would be true if we actually threw
        errorLogged: true,
        errorReported: true,
        userMessageGenerated: true,
        responseStatusCode: error.statusCode,
        correlationId: error.correlationId,
        reportId,
        userMessage,
      },
      timings: {
        ...timings,
        errorHandling: 0, // Would be measured if error was actually thrown
        total: Date.now() - startTime,
      },
    };

    sendSuccess(res, testResult, 'Error handling test completed successfully');

  } catch (actualError) {
    // This catches any real errors that occur during testing
    const handleStart = Date.now();

    logger.error('Unexpected error during error handling test', actualError as Error, {
      metadata: {
        testError: false,
        testType: type,
        scenario,
        unexpected: true,
      },
    });

    timings.errorHandling = Date.now() - handleStart;
    timings.total = Date.now() - startTime;

    testResult = {
      success: false,
      testType: type,
      scenario,
      results: {
        errorThrown: true,
        errorCaught: true,
        errorLogged: true,
        errorReported: false,
        userMessageGenerated: false,
        responseStatusCode: 500,
      },
      timings,
    };

    res.status(500).json({
      success: false,
      error: 'Test failed due to unexpected error',
      testResult,
      actualError: {
        name: (actualError as Error).name,
        message: (actualError as Error).message,
      },
    });
  }
}

function generateTestError(type: string, scenario: string): any {
  const correlationId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  switch (type) {
    case 'validation':
      return generateValidationError(scenario, correlationId);

    case 'authentication':
      return generateAuthenticationError(scenario, correlationId);

    case 'business':
      return generateBusinessLogicError(scenario, correlationId);

    case 'system':
      return generateSystemError(scenario, correlationId);

    case 'database':
      return generateDatabaseError(scenario, correlationId);

    case 'external':
      return generateExternalServiceError(scenario, correlationId);

    case 'security':
      return generateSecurityError(scenario, correlationId);

    default:
      return new SystemError(
        ErrorCode.SYSTEM_ERROR,
        'Unknown test error type',
        { testType: type },
        [],
        correlationId
      );
  }
}

function generateValidationError(scenario: string, correlationId: string): ValidationError {
  switch (scenario) {
    case 'missing-field':
      return new ValidationError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Required field validation failed',
        { field: 'email' },
        [{ field: 'email', message: 'Email is required' }],
        correlationId
      );

    case 'invalid-email':
      return new ValidationError(
        ErrorCode.INVALID_EMAIL_FORMAT,
        'Email format validation failed',
        { field: 'email', value: 'invalid-email' },
        [{ field: 'email', message: 'Invalid email format' }],
        correlationId
      );

    case 'weak-password':
      return new ValidationError(
        ErrorCode.PASSWORD_TOO_WEAK,
        'Password strength validation failed',
        { field: 'password' },
        [{ field: 'password', message: 'Password must be at least 8 characters' }],
        correlationId
      );

    case 'invalid-amount':
      return new ValidationError(
        ErrorCode.INVALID_AMOUNT,
        'Amount validation failed',
        { field: 'amount', value: 'abc' },
        [{ field: 'amount', message: 'Amount must be a valid number' }],
        correlationId
      );

    default:
      return new ValidationError(
        ErrorCode.VALIDATION_FAILED,
        'General validation failed',
        { scenario },
        [],
        correlationId
      );
  }
}

function generateAuthenticationError(scenario: string, correlationId: string): AuthenticationError {
  switch (scenario) {
    case 'invalid-credentials':
      return new AuthenticationError(
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid login credentials',
        { attemptCount: 1 },
        [],
        correlationId
      );

    case 'token-expired':
      return new AuthenticationError(
        ErrorCode.TOKEN_EXPIRED,
        'JWT token has expired',
        { expiredAt: new Date(Date.now() - 3600000) },
        [],
        correlationId
      );

    case 'account-locked':
      return new AuthenticationError(
        ErrorCode.ACCOUNT_LOCKED,
        'Account locked due to failed attempts',
        { lockReason: 'too_many_attempts', lockedUntil: new Date(Date.now() + 900000) },
        [],
        correlationId
      );

    default:
      return new AuthenticationError(
        ErrorCode.INVALID_TOKEN,
        'Authentication failed',
        { scenario },
        [],
        correlationId
      );
  }
}

function generateBusinessLogicError(scenario: string, correlationId: string): BusinessLogicError {
  switch (scenario) {
    case 'insufficient-balance':
      return new BusinessLogicError(
        ErrorCode.INSUFFICIENT_BALANCE,
        'Insufficient account balance',
        { currentBalance: 100, requestedAmount: 200 },
        [],
        correlationId,
        'You don\'t have enough funds for this transaction.'
      );

    case 'budget-exceeded':
      return new BusinessLogicError(
        ErrorCode.BUDGET_EXCEEDED,
        'Transaction exceeds budget limit',
        { budgetLimit: 500, currentSpent: 450, transactionAmount: 100 },
        [],
        correlationId,
        'This transaction would exceed your budget limit.'
      );

    case 'goal-not-achievable':
      return new BusinessLogicError(
        ErrorCode.GOAL_NOT_ACHIEVABLE,
        'Financial goal not achievable',
        { goalAmount: 10000, timeframe: 12, monthlyIncome: 3000 },
        [],
        correlationId,
        'This goal may not be realistic with your current income.'
      );

    default:
      return new BusinessLogicError(
        ErrorCode.BUSINESS_LOGIC_ERROR,
        'Business rule violation',
        { scenario },
        [],
        correlationId
      );
  }
}

function generateSystemError(scenario: string, correlationId: string): SystemError {
  switch (scenario) {
    case 'out-of-memory':
      return new SystemError(
        ErrorCode.SYSTEM_ERROR,
        'System out of memory',
        { memoryUsage: process.memoryUsage(), scenario: 'memory' },
        [],
        correlationId
      );

    case 'file-system':
      return new SystemError(
        ErrorCode.SYSTEM_ERROR,
        'File system error',
        { error: 'ENOENT', path: '/tmp/test.txt' },
        [],
        correlationId
      );

    default:
      return new SystemError(
        ErrorCode.SYSTEM_ERROR,
        'General system error',
        { scenario },
        [],
        correlationId
      );
  }
}

function generateDatabaseError(scenario: string, correlationId: string): DatabaseError {
  switch (scenario) {
    case 'connection-failed':
      return new DatabaseError(
        ErrorCode.DB_CONNECTION_FAILED,
        'Database connection failed',
        { host: 'localhost', port: 27017, database: 'finance-app' },
        [],
        correlationId
      );

    case 'duplicate-key':
      return new DatabaseError(
        ErrorCode.DUPLICATE_ENTRY,
        'Duplicate key error',
        { collection: 'users', field: 'email', value: 'test@example.com' },
        [],
        correlationId
      );

    default:
      return new DatabaseError(
        ErrorCode.DB_QUERY_FAILED,
        'Database query failed',
        { scenario },
        [],
        correlationId
      );
  }
}

function generateExternalServiceError(scenario: string, correlationId: string): ExternalServiceError {
  switch (scenario) {
    case 'ai-timeout':
      return new ExternalServiceError(
        ErrorCode.AI_SERVICE_ERROR,
        'AI service timeout',
        { service: 'ai-service', timeout: 30000 },
        [],
        correlationId
      );

    case 'payment-failed':
      return new ExternalServiceError(
        ErrorCode.PAYMENT_GATEWAY_ERROR,
        'Payment processing failed',
        { gateway: 'stripe', errorCode: 'card_declined' },
        [],
        correlationId
      );

    default:
      return new ExternalServiceError(
        ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
        'External service unavailable',
        { scenario },
        [],
        correlationId
      );
  }
}

function generateSecurityError(scenario: string, correlationId: string): SecurityError {
  switch (scenario) {
    case 'rate-limit':
      return new SecurityError(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        'Rate limit exceeded',
        { limit: 100, window: '15m', current: 101 },
        [],
        correlationId
      );

    case 'suspicious-activity':
      return new SecurityError(
        ErrorCode.SUSPICIOUS_ACTIVITY,
        'Suspicious activity detected',
        { patterns: ['rapid_requests', 'unusual_location'], confidence: 85 },
        [],
        correlationId
      );

    default:
      return new SecurityError(
        ErrorCode.SECURITY_VIOLATION,
        'Security violation detected',
        { scenario },
        [],
        correlationId
      );
  }
}

// Test error metrics endpoint
async function getErrorMetrics(req: NextApiRequest, res: NextApiResponse) {
  try {
    const metrics = await errorReporting.getErrorMetrics('24h');
    sendSuccess(res, metrics, 'Error metrics retrieved successfully');
  } catch (error) {
    logger.error('Failed to get error metrics', error as Error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve error metrics',
    });
  }
}

// Main handler
async function handler(req: ErrorTestRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    if (req.query.metrics === 'true') {
      return getErrorMetrics(req, res);
    }
    return testErrorHandling(req, res);
  }

  res.setHeader('Allow', ['GET']);
  res.status(405).json({
    success: false,
    error: 'Method not allowed',
    allowedMethods: ['GET'],
  });
}

export default withErrorHandling(handler);