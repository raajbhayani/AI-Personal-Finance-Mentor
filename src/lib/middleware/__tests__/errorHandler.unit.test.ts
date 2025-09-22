import { NextApiRequest, NextApiResponse } from 'next';
import {
  ApiErrorHandler,
  errorHandlingMiddleware,
  asyncHandler,
  createValidationError,
  createAuthError,
  createAuthzError,
  createBusinessError,
  createSecurityError,
  sendSuccess,
  sendPaginatedSuccess,
  withErrorHandling,
} from '../errorHandler';
import {
  BaseError,
  ErrorCode,
  ValidationError,
  AuthenticationError,
  BusinessLogicError,
  SystemError,
  DatabaseError,
} from '../../errors/customErrors';
import { createMockRequest, createMockResponse } from '../../../test/utils/testHelpers';

// Mock the logger
jest.mock('../../logging/structuredLogger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
  createRequestLogger: jest.fn(() => ({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    audit: jest.fn(),
    performance: jest.fn(),
    correlationId: 'test-correlation-id',
  })),
}));

describe('ApiErrorHandler', () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockReq = createMockRequest({
      url: '/api/test',
      method: 'POST',
      headers: {
        'user-agent': 'test-agent',
        'x-forwarded-for': '192.168.1.1',
      },
    });
    mockRes = createMockResponse();

    // Add request logger mock
    mockReq.requestLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      audit: jest.fn(),
      performance: jest.fn(),
      correlationId: 'test-correlation-id',
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleError', () => {
    it('should handle BaseError correctly', () => {
      const error = new ValidationError(
        ErrorCode.VALIDATION_FAILED,
        'Validation failed',
        { field: 'email' },
        [{ field: 'email', message: 'Invalid email' }],
        'test-correlation-id'
      );

      ApiErrorHandler.handleError(error, mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_FAILED,
          message: 'Validation failed',
          userMessage: error.userMessage,
          correlationId: 'test-correlation-id',
          timestamp: expect.any(String),
          statusCode: 400,
        },
        meta: {
          requestId: mockReq.correlationId,
          traceId: 'test-correlation-id',
        },
      });
    });

    it('should convert regular Error to BaseError', () => {
      const error = new Error('Regular error message');

      ApiErrorHandler.handleError(error, mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCode.SYSTEM_ERROR,
            message: 'An unexpected error occurred',
          }),
        })
      );
    });

    it('should handle MongoDB errors', () => {
      const mongoError = new Error('Connection failed');
      mongoError.name = 'MongoError';

      ApiErrorHandler.handleError(mongoError, mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCode.DB_CONNECTION_FAILED,
          }),
        })
      );
    });

    it('should handle JWT errors', () => {
      const jwtError = new Error('Invalid token');
      jwtError.name = 'JsonWebTokenError';

      ApiErrorHandler.handleError(jwtError, mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCode.INVALID_TOKEN,
          }),
        })
      );
    });

    it('should handle TokenExpiredError', () => {
      const expiredError = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';

      ApiErrorHandler.handleError(expiredError, mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCode.TOKEN_EXPIRED,
          }),
        })
      );
    });

    it('should set security headers', () => {
      const error = new SystemError(
        ErrorCode.SYSTEM_ERROR,
        'Test error',
        {},
        [],
        'test-correlation-id'
      );

      ApiErrorHandler.handleError(error, mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
    });

    it('should log performance metrics for slow requests', () => {
      mockReq.startTime = Date.now() - 6000; // 6 seconds ago

      const error = new SystemError(
        ErrorCode.SYSTEM_ERROR,
        'Test error',
        {},
        [],
        'test-correlation-id'
      );

      ApiErrorHandler.handleError(error, mockReq, mockRes);

      expect(mockReq.requestLogger.performance).toHaveBeenCalledWith(
        'slow_request',
        expect.any(Number),
        expect.objectContaining({
          metadata: expect.objectContaining({
            slow: true,
            errorOccurred: true,
          }),
        })
      );
    });

    it('should include error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new ValidationError(
        ErrorCode.VALIDATION_FAILED,
        'Test error',
        { test: true },
        [{ field: 'test', message: 'test' }],
        'test-correlation-id'
      );

      ApiErrorHandler.handleError(error, mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            details: expect.objectContaining({
              context: { test: true },
              details: [{ field: 'test', message: 'test' }],
              stack: expect.any(String),
            }),
          }),
        })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });
});

describe('errorHandlingMiddleware', () => {
  let mockReq: any;
  let mockRes: any;
  let nextMock: jest.Mock;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    nextMock = jest.fn();
  });

  it('should add correlation ID and request logger', () => {
    errorHandlingMiddleware(mockReq, mockRes, nextMock);

    expect(mockReq.correlationId).toBeDefined();
    expect(mockReq.requestLogger).toBeDefined();
    expect(mockReq.startTime).toBeDefined();
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Correlation-ID', mockReq.correlationId);
    expect(nextMock).toHaveBeenCalled();
  });

  it('should use existing correlation ID from headers', () => {
    mockReq.headers['x-correlation-id'] = 'existing-correlation-id';

    errorHandlingMiddleware(mockReq, mockRes, nextMock);

    expect(mockReq.correlationId).toBe('existing-correlation-id');
  });

  it('should override res.json to track performance', () => {
    errorHandlingMiddleware(mockReq, mockRes, nextMock);

    const originalJson = mockRes.json;
    mockRes.json({ test: 'data' });

    expect(originalJson).toHaveBeenCalledWith({ test: 'data' });
    expect(mockReq.requestLogger.performance).toHaveBeenCalled();
  });
});

describe('asyncHandler', () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();

    // Add required properties for error handler
    mockReq.requestLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      audit: jest.fn(),
      performance: jest.fn(),
      correlationId: 'test-correlation-id',
    };
  });

  it('should handle successful async functions', async () => {
    const successHandler = asyncHandler(async (req, res) => {
      res.status(200).json({ success: true });
    });

    await successHandler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ success: true });
  });

  it('should catch and handle async errors', async () => {
    const errorHandler = asyncHandler(async (req, res) => {
      throw new ValidationError(
        ErrorCode.VALIDATION_FAILED,
        'Async validation failed',
        {},
        [],
        'test-correlation-id'
      );
    });

    await errorHandler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: ErrorCode.VALIDATION_FAILED,
        }),
      })
    );
  });

  it('should catch and handle synchronous errors', async () => {
    const errorHandler = asyncHandler((req, res) => {
      throw new Error('Sync error');
    });

    await errorHandler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
  });
});

describe('error helper functions', () => {
  describe('createValidationError', () => {
    it('should create a validation error with correct properties', () => {
      const error = createValidationError(
        'Email is required',
        'email',
        '',
        'Email cannot be empty',
        'test-correlation-id'
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.code).toBe(ErrorCode.VALIDATION_FAILED);
      expect(error.message).toBe('Email is required');
      expect(error.context).toEqual({ field: 'email', value: '' });
      expect(error.details).toEqual([{ field: 'email', message: 'Email cannot be empty' }]);
      expect(error.correlationId).toBe('test-correlation-id');
    });
  });

  describe('createAuthError', () => {
    it('should create an authentication error', () => {
      const error = createAuthError(
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid login',
        { attemptCount: 1 },
        'test-correlation-id'
      );

      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.code).toBe(ErrorCode.INVALID_CREDENTIALS);
      expect(error.context).toEqual({ attemptCount: 1 });
    });
  });

  describe('createAuthzError', () => {
    it('should create an authorization error', () => {
      const error = createAuthzError(
        'Access denied',
        'ADMIN',
        'write',
        'test-correlation-id'
      );

      expect(error.code).toBe(ErrorCode.INSUFFICIENT_PERMISSIONS);
      expect(error.context).toEqual({
        requiredRole: 'ADMIN',
        requiredPermission: 'write',
      });
    });
  });

  describe('createBusinessError', () => {
    it('should create a business logic error', () => {
      const error = createBusinessError(
        ErrorCode.INSUFFICIENT_BALANCE,
        'Not enough funds',
        'You do not have sufficient balance',
        { balance: 100, required: 200 },
        'test-correlation-id'
      );

      expect(error).toBeInstanceOf(BusinessLogicError);
      expect(error.userMessage).toBe('You do not have sufficient balance');
    });
  });

  describe('createSecurityError', () => {
    it('should create a security error', () => {
      const error = createSecurityError(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        'Too many requests',
        { limit: 100, current: 101 },
        'test-correlation-id'
      );

      expect(error.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
    });
  });
});

describe('response helpers', () => {
  let mockRes: any;

  beforeEach(() => {
    mockRes = createMockResponse();
  });

  describe('sendSuccess', () => {
    it('should send a successful response', () => {
      const data = { user: { id: 1, name: 'Test' } };

      sendSuccess(mockRes, data, 'User retrieved', 200, { extra: 'meta' });

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'User retrieved',
        data,
        timestamp: expect.any(String),
        meta: { extra: 'meta' },
      });
    });

    it('should use default values', () => {
      sendSuccess(mockRes, { test: true });

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Operation successful',
        data: { test: true },
        timestamp: expect.any(String),
      });
    });
  });

  describe('sendPaginatedSuccess', () => {
    it('should send a paginated response', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      };

      sendPaginatedSuccess(mockRes, data, pagination, 'Data retrieved');

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Data retrieved',
        data,
        pagination,
        timestamp: expect.any(String),
      });
    });
  });
});

describe('withErrorHandling', () => {
  it('should wrap handler with error handling', async () => {
    const mockHandler = jest.fn().mockResolvedValue(undefined);
    const wrappedHandler = withErrorHandling(mockHandler);

    const mockReq = createMockRequest();
    const mockRes = createMockResponse();

    await wrappedHandler(mockReq, mockRes);

    expect(mockHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationId: expect.any(String),
        requestLogger: expect.any(Object),
        startTime: expect.any(Number),
      }),
      mockRes
    );
  });

  it('should handle errors thrown by wrapped handler', async () => {
    const mockHandler = jest.fn().mockRejectedValue(new Error('Handler error'));
    const wrappedHandler = withErrorHandling(mockHandler);

    const mockReq = createMockRequest();
    const mockRes = createMockResponse();

    // Add request logger mock for error handling
    mockReq.requestLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      audit: jest.fn(),
      performance: jest.fn(),
      correlationId: 'test-correlation-id',
    };

    await wrappedHandler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: ErrorCode.SYSTEM_ERROR,
        }),
      })
    );
  });
});