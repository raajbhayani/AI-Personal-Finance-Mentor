export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  MFA_REQUIRED = 'MFA_REQUIRED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',

  // Validation & Input
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  VALUE_OUT_OF_RANGE = 'VALUE_OUT_OF_RANGE',

  // Database & Resources
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',

  // Business Logic
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  BUDGET_EXCEEDED = 'BUDGET_EXCEEDED',
  GOAL_TARGET_INVALID = 'GOAL_TARGET_INVALID',
  TRANSACTION_LIMIT_EXCEEDED = 'TRANSACTION_LIMIT_EXCEEDED',
  INVALID_OPERATION = 'INVALID_OPERATION',

  // Security
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  CSRF_TOKEN_INVALID = 'CSRF_TOKEN_INVALID',
  XSS_ATTEMPT = 'XSS_ATTEMPT',

  // External Services
  THIRD_PARTY_SERVICE_ERROR = 'THIRD_PARTY_SERVICE_ERROR',
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  PAYMENT_PROCESSOR_ERROR = 'PAYMENT_PROCESSOR_ERROR',
  EMAIL_SERVICE_ERROR = 'EMAIL_SERVICE_ERROR',

  // System & Infrastructure
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',

  // File & Upload
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',

  // Network & API
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_QUOTA_EXCEEDED = 'API_QUOTA_EXCEEDED',
  INVALID_API_VERSION = 'INVALID_API_VERSION',
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  userAgent?: string;
  ipAddress?: string;
  timestamp?: Date;
  correlationId?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorDetails {
  field?: string;
  value?: any;
  constraint?: string;
  location?: string;
  suggestion?: string;
}

export abstract class BaseError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context: ErrorContext;
  public readonly details: ErrorDetails[];
  public readonly userMessage: string;
  public readonly timestamp: Date;
  public readonly correlationId: string;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number,
    userMessage?: string,
    context: ErrorContext = {},
    details: ErrorDetails[] = [],
    isOperational: boolean = true
  ) {
    super(message);

    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = {
      timestamp: new Date(),
      correlationId: this.generateCorrelationId(),
      ...context,
    };
    this.details = details;
    this.userMessage = userMessage || this.getDefaultUserMessage();
    this.timestamp = new Date();
    this.correlationId = this.context.correlationId!;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  private generateCorrelationId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultUserMessage(): string {
    const userMessages: Record<ErrorCode, string> = {
      [ErrorCode.UNAUTHORIZED]: 'Please log in to access this feature.',
      [ErrorCode.FORBIDDEN]: 'You don\'t have permission to perform this action.',
      [ErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
      [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password. Please try again.',
      [ErrorCode.MFA_REQUIRED]: 'Multi-factor authentication is required.',
      [ErrorCode.ACCOUNT_LOCKED]: 'Your account has been temporarily locked.',
      [ErrorCode.ACCOUNT_SUSPENDED]: 'Your account has been suspended.',

      [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again.',
      [ErrorCode.INVALID_INPUT]: 'The information provided is not valid.',
      [ErrorCode.MISSING_REQUIRED_FIELD]: 'Please fill in all required fields.',
      [ErrorCode.INVALID_FORMAT]: 'Please check the format of your input.',
      [ErrorCode.VALUE_OUT_OF_RANGE]: 'The value is outside the allowed range.',

      [ErrorCode.RESOURCE_NOT_FOUND]: 'The requested item could not be found.',
      [ErrorCode.RESOURCE_ALREADY_EXISTS]: 'This item already exists.',
      [ErrorCode.DATABASE_ERROR]: 'A database error occurred. Please try again.',
      [ErrorCode.CONNECTION_ERROR]: 'Connection error. Please check your internet connection.',
      [ErrorCode.TRANSACTION_FAILED]: 'The transaction could not be completed.',

      [ErrorCode.INSUFFICIENT_FUNDS]: 'Insufficient funds for this transaction.',
      [ErrorCode.BUDGET_EXCEEDED]: 'This transaction would exceed your budget.',
      [ErrorCode.GOAL_TARGET_INVALID]: 'The goal target amount is not valid.',
      [ErrorCode.TRANSACTION_LIMIT_EXCEEDED]: 'Transaction limit exceeded.',
      [ErrorCode.INVALID_OPERATION]: 'This operation is not allowed.',

      [ErrorCode.SECURITY_VIOLATION]: 'Security policy violation detected.',
      [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later.',
      [ErrorCode.SUSPICIOUS_ACTIVITY]: 'Suspicious activity detected.',
      [ErrorCode.CSRF_TOKEN_INVALID]: 'Security token is invalid. Please refresh the page.',
      [ErrorCode.XSS_ATTEMPT]: 'Invalid content detected.',

      [ErrorCode.THIRD_PARTY_SERVICE_ERROR]: 'External service is temporarily unavailable.',
      [ErrorCode.AI_SERVICE_UNAVAILABLE]: 'AI assistant is temporarily unavailable.',
      [ErrorCode.PAYMENT_PROCESSOR_ERROR]: 'Payment processing is temporarily unavailable.',
      [ErrorCode.EMAIL_SERVICE_ERROR]: 'Email service is temporarily unavailable.',

      [ErrorCode.INTERNAL_SERVER_ERROR]: 'An unexpected error occurred. Please try again.',
      [ErrorCode.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable.',
      [ErrorCode.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
      [ErrorCode.CONFIGURATION_ERROR]: 'System configuration error.',
      [ErrorCode.MAINTENANCE_MODE]: 'System is under maintenance.',

      [ErrorCode.FILE_TOO_LARGE]: 'File size is too large.',
      [ErrorCode.INVALID_FILE_TYPE]: 'File type is not supported.',
      [ErrorCode.UPLOAD_FAILED]: 'File upload failed. Please try again.',
      [ErrorCode.FILE_NOT_FOUND]: 'File not found.',

      [ErrorCode.NETWORK_ERROR]: 'Network error. Please check your connection.',
      [ErrorCode.API_QUOTA_EXCEEDED]: 'API quota exceeded. Please try again later.',
      [ErrorCode.INVALID_API_VERSION]: 'API version is not supported.',
      [ErrorCode.METHOD_NOT_ALLOWED]: 'HTTP method not allowed.',
    };

    return userMessages[this.code] || 'An unexpected error occurred.';
  }

  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      userMessage: this.userMessage,
      context: this.context,
      details: this.details,
      timestamp: this.timestamp,
      correlationId: this.correlationId,
      isOperational: this.isOperational,
      stack: this.stack,
    };
  }

  public toResponse() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.userMessage,
        details: this.details,
        correlationId: this.correlationId,
        timestamp: this.timestamp,
      },
    };
  }
}

// Authentication and Authorization Errors
export class AuthenticationError extends BaseError {
  constructor(
    message: string = 'Authentication failed',
    code: ErrorCode = ErrorCode.UNAUTHORIZED,
    userMessage?: string,
    context?: ErrorContext,
    details?: ErrorDetails[]
  ) {
    super(message, code, 401, userMessage, context, details);
  }
}

export class AuthorizationError extends BaseError {
  constructor(
    message: string = 'Access denied',
    code: ErrorCode = ErrorCode.FORBIDDEN,
    userMessage?: string,
    context?: ErrorContext,
    details?: ErrorDetails[]
  ) {
    super(message, code, 403, userMessage, context, details);
  }
}

// Validation Errors
export class ValidationError extends BaseError {
  constructor(
    message: string = 'Validation failed',
    details: ErrorDetails[] = [],
    context?: ErrorContext,
    userMessage?: string
  ) {
    super(
      message,
      ErrorCode.VALIDATION_ERROR,
      400,
      userMessage,
      context,
      details
    );
  }

  static fromZodError(zodError: any, context?: ErrorContext): ValidationError {
    const details: ErrorDetails[] = zodError.errors?.map((err: any) => ({
      field: err.path.join('.'),
      value: err.received,
      constraint: err.code,
      suggestion: err.message,
    })) || [];

    return new ValidationError(
      'Input validation failed',
      details,
      context,
      'Please check your input and try again.'
    );
  }
}

// Database and Resource Errors
export class DatabaseError extends BaseError {
  constructor(
    message: string = 'Database operation failed',
    code: ErrorCode = ErrorCode.DATABASE_ERROR,
    userMessage?: string,
    context?: ErrorContext
  ) {
    super(message, code, 500, userMessage, context, [], false);
  }
}

export class ResourceNotFoundError extends BaseError {
  constructor(
    resource: string,
    identifier?: string,
    context?: ErrorContext
  ) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;

    super(
      message,
      ErrorCode.RESOURCE_NOT_FOUND,
      404,
      `The requested ${resource.toLowerCase()} could not be found.`,
      context
    );
  }
}

export class ResourceConflictError extends BaseError {
  constructor(
    resource: string,
    reason: string = 'already exists',
    context?: ErrorContext
  ) {
    super(
      `${resource} ${reason}`,
      ErrorCode.RESOURCE_ALREADY_EXISTS,
      409,
      `This ${resource.toLowerCase()} ${reason}.`,
      context
    );
  }
}

// Business Logic Errors
export class BusinessLogicError extends BaseError {
  constructor(
    message: string,
    code: ErrorCode,
    userMessage?: string,
    context?: ErrorContext,
    details?: ErrorDetails[]
  ) {
    super(message, code, 422, userMessage, context, details);
  }
}

export class InsufficientFundsError extends BusinessLogicError {
  constructor(
    availableAmount: number,
    requestedAmount: number,
    context?: ErrorContext
  ) {
    super(
      `Insufficient funds: available ${availableAmount}, requested ${requestedAmount}`,
      ErrorCode.INSUFFICIENT_FUNDS,
      `Insufficient funds. You have $${availableAmount.toFixed(2)} available.`,
      context,
      [
        {
          field: 'amount',
          value: requestedAmount,
          constraint: 'insufficient_funds',
          suggestion: `Maximum available amount is $${availableAmount.toFixed(2)}`,
        },
      ]
    );
  }
}

export class BudgetExceededError extends BusinessLogicError {
  constructor(
    budgetLimit: number,
    currentSpent: number,
    newAmount: number,
    context?: ErrorContext
  ) {
    const totalAfterTransaction = currentSpent + newAmount;
    const excess = totalAfterTransaction - budgetLimit;

    super(
      `Budget exceeded: limit ${budgetLimit}, current ${currentSpent}, new transaction ${newAmount}`,
      ErrorCode.BUDGET_EXCEEDED,
      `This transaction would exceed your budget by $${excess.toFixed(2)}.`,
      context,
      [
        {
          field: 'amount',
          value: newAmount,
          constraint: 'budget_exceeded',
          suggestion: `Reduce amount by $${excess.toFixed(2)} to stay within budget`,
        },
      ]
    );
  }
}

// Security Errors
export class SecurityError extends BaseError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.SECURITY_VIOLATION,
    userMessage?: string,
    context?: ErrorContext
  ) {
    super(message, code, 403, userMessage, context, [], true);
  }
}

export class RateLimitError extends SecurityError {
  constructor(
    limit: number,
    windowMs: number,
    retryAfter?: number,
    context?: ErrorContext
  ) {
    super(
      `Rate limit exceeded: ${limit} requests per ${windowMs}ms`,
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Too many requests. Please try again later.',
      {
        ...context,
        additionalData: {
          limit,
          windowMs,
          retryAfter,
        },
      }
    );
  }
}

// External Service Errors
export class ExternalServiceError extends BaseError {
  constructor(
    service: string,
    message: string,
    code: ErrorCode = ErrorCode.THIRD_PARTY_SERVICE_ERROR,
    context?: ErrorContext
  ) {
    super(
      `External service error (${service}): ${message}`,
      code,
      502,
      `${service} is temporarily unavailable. Please try again later.`,
      context,
      [],
      false
    );
  }
}

export class AIServiceError extends ExternalServiceError {
  constructor(message: string, context?: ErrorContext) {
    super('AI Service', message, ErrorCode.AI_SERVICE_UNAVAILABLE, context);
  }
}

// System Errors
export class SystemError extends BaseError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
    context?: ErrorContext
  ) {
    super(message, code, 500, undefined, context, [], false);
  }
}

export class ConfigurationError extends SystemError {
  constructor(configKey: string, context?: ErrorContext) {
    super(
      `Configuration error: ${configKey} is not properly configured`,
      ErrorCode.CONFIGURATION_ERROR,
      context
    );
  }
}

// File and Upload Errors
export class FileError extends BaseError {
  constructor(
    message: string,
    code: ErrorCode,
    userMessage?: string,
    context?: ErrorContext,
    details?: ErrorDetails[]
  ) {
    super(message, code, 400, userMessage, context, details);
  }
}

export class FileSizeError extends FileError {
  constructor(
    actualSize: number,
    maxSize: number,
    context?: ErrorContext
  ) {
    super(
      `File size ${actualSize} exceeds maximum ${maxSize}`,
      ErrorCode.FILE_TOO_LARGE,
      `File is too large. Maximum size is ${(maxSize / (1024 * 1024)).toFixed(1)}MB.`,
      context,
      [
        {
          field: 'file',
          value: actualSize,
          constraint: 'max_size',
          suggestion: `Reduce file size to under ${(maxSize / (1024 * 1024)).toFixed(1)}MB`,
        },
      ]
    );
  }
}

// Utility functions for error handling
export function isOperationalError(error: Error): boolean {
  if (error instanceof BaseError) {
    return error.isOperational;
  }
  return false;
}

export function getErrorContext(req?: any): ErrorContext {
  if (!req) return {};

  return {
    endpoint: req.url,
    method: req.method,
    userAgent: req.headers?.['user-agent'],
    ipAddress: getClientIP(req),
    userId: req.user?.userId,
    sessionId: req.sessionId,
    requestId: req.headers?.['x-request-id'],
  };
}

function getClientIP(req: any): string {
  return (
    req.headers?.['x-forwarded-for']?.split(',')[0] ||
    req.headers?.['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

// Error factory functions
export const ErrorFactory = {
  unauthorized: (message?: string, context?: ErrorContext) =>
    new AuthenticationError(message, ErrorCode.UNAUTHORIZED, undefined, context),

  forbidden: (message?: string, context?: ErrorContext) =>
    new AuthorizationError(message, ErrorCode.FORBIDDEN, undefined, context),

  validation: (details: ErrorDetails[], context?: ErrorContext) =>
    new ValidationError('Validation failed', details, context),

  notFound: (resource: string, identifier?: string, context?: ErrorContext) =>
    new ResourceNotFoundError(resource, identifier, context),

  conflict: (resource: string, reason?: string, context?: ErrorContext) =>
    new ResourceConflictError(resource, reason, context),

  rateLimited: (limit: number, windowMs: number, context?: ErrorContext) =>
    new RateLimitError(limit, windowMs, undefined, context),

  internal: (message?: string, context?: ErrorContext) =>
    new SystemError(message || 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR, context),

  external: (service: string, message: string, context?: ErrorContext) =>
    new ExternalServiceError(service, message, ErrorCode.THIRD_PARTY_SERVICE_ERROR, context),
};