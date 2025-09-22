import { NextApiResponse } from 'next';
import { ZodError } from 'zod';

export interface APIError {
  success: false;
  message: string;
  errors?: string[];
  code?: string;
  retryAfter?: number;
  timestamp: string;
}

export class CustomAPIError extends Error {
  public statusCode: number;
  public code?: string;
  public retryAfter?: number;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    retryAfter?: number
  ) {
    super(message);
    this.name = 'CustomAPIError';
    this.statusCode = statusCode;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

export function handleAPIError(
  error: unknown,
  res: NextApiResponse,
  context: string = 'API operation'
): void {
  console.error(`${context} error:`, error);

  if (error instanceof CustomAPIError) {
    const response: APIError = {
      success: false,
      message: error.message,
      code: error.code,
      retryAfter: error.retryAfter,
      timestamp: new Date().toISOString(),
    };

    if (error.retryAfter) {
      res.setHeader('Retry-After', error.retryAfter.toString());
    }

    return res.status(error.statusCode).json(response);
  }

  if (error instanceof ZodError) {
    const response: APIError = {
      success: false,
      message: 'Validation failed',
      errors: error.errors.map((err) => `${err.path.join('.')}: ${err.message}`),
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString(),
    };

    return res.status(400).json(response);
  }

  if (error instanceof Error) {
    if (error.message.includes('API key')) {
      const response: APIError = {
        success: false,
        message: 'AI service configuration error',
        code: 'API_KEY_ERROR',
        timestamp: new Date().toISOString(),
      };
      return res.status(500).json(response);
    }

    if (error.message.includes('rate limit') || error.message.includes('quota')) {
      const response: APIError = {
        success: false,
        message: 'AI service temporarily unavailable. Please try again later.',
        code: 'SERVICE_RATE_LIMITED',
        retryAfter: 300, // 5 minutes
        timestamp: new Date().toISOString(),
      };
      res.setHeader('Retry-After', '300');
      return res.status(429).json(response);
    }

    if (error.message.includes('token') && error.message.includes('limit')) {
      const response: APIError = {
        success: false,
        message: 'Request too large. Please shorten your message and try again.',
        code: 'TOKEN_LIMIT_EXCEEDED',
        timestamp: new Date().toISOString(),
      };
      return res.status(413).json(response);
    }

    if (error.message.includes('timeout')) {
      const response: APIError = {
        success: false,
        message: 'Request timed out. Please try again.',
        code: 'REQUEST_TIMEOUT',
        timestamp: new Date().toISOString(),
      };
      return res.status(408).json(response);
    }

    if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
      const response: APIError = {
        success: false,
        message: 'Network error. Please check your connection and try again.',
        code: 'NETWORK_ERROR',
        timestamp: new Date().toISOString(),
      };
      return res.status(503).json(response);
    }

    const response: APIError = {
      success: false,
      message: error.message,
      code: 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString(),
    };
    return res.status(500).json(response);
  }

  const response: APIError = {
    success: false,
    message: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
  };
  return res.status(500).json(response);
}

export function createRateLimitError(retryAfter: number): CustomAPIError {
  return new CustomAPIError(
    'Rate limit exceeded. Please try again later.',
    429,
    'RATE_LIMIT_EXCEEDED',
    retryAfter
  );
}

export function createValidationError(message: string): CustomAPIError {
  return new CustomAPIError(message, 400, 'VALIDATION_ERROR');
}

export function createNotFoundError(resource: string): CustomAPIError {
  return new CustomAPIError(`${resource} not found`, 404, 'NOT_FOUND');
}

export function createUnauthorizedError(): CustomAPIError {
  return new CustomAPIError('Unauthorized access', 401, 'UNAUTHORIZED');
}

export function createServiceUnavailableError(service: string): CustomAPIError {
  return new CustomAPIError(
    `${service} is temporarily unavailable`,
    503,
    'SERVICE_UNAVAILABLE',
    300
  );
}

export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  context: string = 'Operation'
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error(`${context} error:`, error);
      throw error;
    }
  };
}

export function logError(
  error: unknown,
  context: string,
  additionalData?: Record<string, any>
): void {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    context,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
    ...additionalData,
  };

  console.error('API Error:', JSON.stringify(logData, null, 2));
}