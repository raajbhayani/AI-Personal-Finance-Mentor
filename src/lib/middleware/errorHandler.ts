import { NextApiRequest, NextApiResponse } from 'next';
import {
  BaseError,
  ErrorCode,
  SystemError,
  DatabaseError,
  ExternalServiceError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  BusinessLogicError,
  SecurityError
} from '../errors/customErrors';
import { logger, createRequestLogger } from '../logging/structuredLogger';

export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    userMessage: string;
    details?: any;
    correlationId: string;
    timestamp: string;
    statusCode: number;
  };
  meta?: {
    requestId?: string;
    traceId?: string;
  };
}

export interface ApiRequest extends NextApiRequest {
  correlationId?: string;
  requestLogger?: ReturnType<typeof createRequestLogger>;
  startTime?: number;
}

export interface ApiResponse extends NextApiResponse {
  // Custom response methods will be added via middleware
}

export class ApiErrorHandler {
  static handleError(
    error: Error | BaseError,
    req: ApiRequest,
    res: NextApiResponse
  ): void {
    const requestLogger = req.requestLogger || createRequestLogger(req);
    const correlationId = req.correlationId || requestLogger.correlationId;

    // Convert non-BaseError to appropriate BaseError
    const baseError = error instanceof BaseError
      ? error
      : this.convertToBaseError(error, correlationId);

    // Log the error with appropriate level
    if (baseError.isOperational) {
      if (baseError.statusCode >= 500) {
        requestLogger.error('Operational error occurred', baseError);
      } else {
        requestLogger.warn('Client error occurred', baseError);
      }
    } else {
      requestLogger.error('System error occurred', baseError, {
        metadata: {
          critical: true,
          requiresImmediateAttention: true
        }
      });
    }

    // Security monitoring for certain error types
    if (baseError instanceof SecurityError) {
      requestLogger.audit('security_violation', false, {
        resource: 'api_endpoint',
        resourceId: req.url,
        metadata: {
          securityViolation: true,
          errorCode: baseError.code,
          ipAddress: this.getClientIP(req),
          userAgent: req.headers['user-agent'],
        }
      });
    }

    // Performance monitoring for slow requests
    if (req.startTime) {
      const duration = Date.now() - req.startTime;
      if (duration > 5000) { // Log slow requests (>5s)
        requestLogger.performance('slow_request', duration, {
          metadata: {
            slow: true,
            errorOccurred: true,
            endpoint: req.url
          }
        });
      }
    }

    // Send error response
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: baseError.code,
        message: baseError.message,
        userMessage: baseError.userMessage,
        correlationId: baseError.correlationId,
        timestamp: baseError.timestamp.toISOString(),
        statusCode: baseError.statusCode,
        ...(process.env.NODE_ENV !== 'production' && {
          details: {
            context: baseError.context,
            details: baseError.details,
            stack: baseError.stack,
          }
        })
      },
      meta: {
        requestId: req.correlationId,
        traceId: correlationId,
      }
    };

    // Set security headers
    this.setSecurityHeaders(res);

    // Set appropriate status code and send response
    res.status(baseError.statusCode).json(errorResponse);
  }

  private static convertToBaseError(error: Error, correlationId: string): BaseError {
    // MongoDB/Database errors
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return new DatabaseError(
        ErrorCode.DB_CONNECTION_FAILED,
        'Database operation failed',
        { originalError: error.message },
        [],
        correlationId
      );
    }

    // Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationDetails = (error as any).errors
        ? Object.keys((error as any).errors).map(key => ({
            field: key,
            message: (error as any).errors[key].message,
          }))
        : [];

      return new ValidationError(
        ErrorCode.VALIDATION_FAILED,
        'Data validation failed',
        { mongoose: true },
        validationDetails,
        correlationId
      );
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return new AuthenticationError(
        error.name === 'TokenExpiredError' ? ErrorCode.TOKEN_EXPIRED : ErrorCode.INVALID_TOKEN,
        'Authentication failed',
        { jwtError: true },
        [],
        correlationId
      );
    }

    // Network/HTTP errors
    if (error.name === 'FetchError' || error.message.includes('ECONNREFUSED')) {
      return new ExternalServiceError(
        ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
        'External service unavailable',
        { network: true },
        [],
        correlationId
      );
    }

    // Timeout errors
    if (error.message.includes('timeout') || error.name === 'TimeoutError') {
      return new ExternalServiceError(
        ErrorCode.EXTERNAL_SERVICE_TIMEOUT,
        'Request timeout',
        { timeout: true },
        [],
        correlationId
      );
    }

    // Rate limiting errors
    if (error.message.includes('rate limit') || error.message.includes('429')) {
      return new SecurityError(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        'Rate limit exceeded',
        { rateLimited: true },
        [],
        correlationId
      );
    }

    // File system errors
    if (error.name === 'ENOENT' || error.message.includes('no such file')) {
      return new SystemError(
        ErrorCode.SYSTEM_ERROR,
        'File system error',
        { fileSystem: true },
        [],
        correlationId
      );
    }

    // Memory errors
    if (error.message.includes('out of memory') || error.name === 'RangeError') {
      return new SystemError(
        ErrorCode.SYSTEM_ERROR,
        'System resource error',
        { memory: true },
        [],
        correlationId
      );
    }

    // Default to system error for unknown errors
    return new SystemError(
      ErrorCode.SYSTEM_ERROR,
      'An unexpected error occurred',
      {
        originalError: error.message,
        originalName: error.name,
        originalStack: error.stack
      },
      [],
      correlationId
    );
  }

  private static setSecurityHeaders(res: NextApiResponse): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  private static getClientIP(req: NextApiRequest): string {
    return (
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.connection?.remoteAddress ||
      'unknown'
    );
  }
}

// Global error handling middleware
export function errorHandlingMiddleware(
  req: ApiRequest,
  res: NextApiResponse,
  next: () => void
): void {
  // Add correlation ID and request logger
  req.correlationId = req.headers['x-correlation-id'] as string ||
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.requestLogger = createRequestLogger(req);
  req.startTime = Date.now();

  // Set correlation ID header for response
  res.setHeader('X-Correlation-ID', req.correlationId);

  // Override res.json to handle errors automatically
  const originalJson = res.json.bind(res);
  res.json = function(body: any) {
    if (req.startTime) {
      const duration = Date.now() - req.startTime;
      req.requestLogger?.performance('api_request', duration, {
        statusCode: res.statusCode,
        method: req.method,
        url: req.url,
      });
    }

    return originalJson(body);
  };

  next();
}

// Async error wrapper for API routes
export function asyncHandler<T extends NextApiRequest, R extends NextApiResponse>(
  fn: (req: T, res: R) => Promise<void | R> | void | R
) {
  return async (req: T, res: R) => {
    try {
      await fn(req, res);
    } catch (error) {
      ApiErrorHandler.handleError(error as Error, req as ApiRequest, res);
    }
  };
}

// Validation error helper
export function createValidationError(
  message: string,
  field: string,
  value: any,
  constraint: string,
  correlationId?: string
): ValidationError {
  return new ValidationError(
    ErrorCode.VALIDATION_FAILED,
    message,
    { field, value },
    [{ field, message: constraint }],
    correlationId
  );
}

// Authentication error helper
export function createAuthError(
  code: ErrorCode,
  message: string,
  context: any = {},
  correlationId?: string
): AuthenticationError {
  return new AuthenticationError(code, message, context, [], correlationId);
}

// Authorization error helper
export function createAuthzError(
  message: string,
  requiredRole?: string,
  requiredPermission?: string,
  correlationId?: string
): AuthorizationError {
  return new AuthorizationError(
    ErrorCode.INSUFFICIENT_PERMISSIONS,
    message,
    { requiredRole, requiredPermission },
    [],
    correlationId
  );
}

// Business logic error helper
export function createBusinessError(
  code: ErrorCode,
  message: string,
  userMessage: string,
  context: any = {},
  correlationId?: string
): BusinessLogicError {
  return new BusinessLogicError(code, message, context, [], correlationId, userMessage);
}

// Security error helper
export function createSecurityError(
  code: ErrorCode,
  message: string,
  context: any = {},
  correlationId?: string
): SecurityError {
  return new SecurityError(code, message, context, [], correlationId);
}

// HTTP status code to error code mapping
export const statusCodeToErrorCode: Record<number, ErrorCode> = {
  400: ErrorCode.VALIDATION_FAILED,
  401: ErrorCode.INVALID_CREDENTIALS,
  403: ErrorCode.INSUFFICIENT_PERMISSIONS,
  404: ErrorCode.USER_NOT_FOUND,
  409: ErrorCode.DUPLICATE_ENTRY,
  422: ErrorCode.VALIDATION_FAILED,
  429: ErrorCode.RATE_LIMIT_EXCEEDED,
  500: ErrorCode.SYSTEM_ERROR,
  502: ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
  503: ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
  504: ErrorCode.EXTERNAL_SERVICE_TIMEOUT,
};

// Success response helper
export function sendSuccess<T = any>(
  res: NextApiResponse,
  data: T,
  message: string = 'Operation successful',
  statusCode: number = 200,
  meta?: Record<string, any>
): void {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    ...(meta && { meta }),
  });
}

// Pagination response helper
export function sendPaginatedSuccess<T = any>(
  res: NextApiResponse,
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
  message: string = 'Data retrieved successfully'
): void {
  res.status(200).json({
    success: true,
    message,
    data,
    pagination,
    timestamp: new Date().toISOString(),
  });
}

// Error middleware for Next.js API routes
export function withErrorHandling(handler: any) {
  return asyncHandler(async (req: ApiRequest, res: NextApiResponse) => {
    // Apply error handling middleware
    errorHandlingMiddleware(req, res, () => {});

    // Execute the actual handler
    await handler(req, res);
  });
}

// Development-only error details
export function getErrorDetails(error: BaseError): any {
  if (process.env.NODE_ENV === 'production') {
    return undefined;
  }

  return {
    stack: error.stack,
    context: error.context,
    details: error.details,
    isOperational: error.isOperational,
    timestamp: error.timestamp,
  };
}