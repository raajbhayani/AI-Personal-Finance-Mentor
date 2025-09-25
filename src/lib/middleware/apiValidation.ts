import { NextApiRequest, NextApiResponse } from 'next';
import { ZodSchema, ZodError } from 'zod';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiValidationResult {
  success: boolean;
  data?: any;
  errors?: ValidationError[];
  message?: string;
}

// Middleware function for API route validation
export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: (req: NextApiRequest, res: NextApiResponse, validatedData: T) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Validate request body
      const validatedData = schema.parse(req.body);

      // Call the actual handler with validated data
      await handler(req, res, validatedData);
    } catch (error) {
      if (error instanceof ZodError) {
        // Format validation errors
        const errors: ValidationError[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        } as ApiValidationResult);
      }

      // Handle other errors
      console.error('API Validation Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: [{ field: 'general', message: 'An unexpected error occurred' }],
      } as ApiValidationResult);
    }
  };
}

// Helper function to validate data without middleware
export function validateData<T>(schema: ZodSchema<T>, data: any): ApiValidationResult {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: ValidationError[] = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return {
        success: false,
        message: 'Validation failed',
        errors,
      };
    }

    return {
      success: false,
      message: 'Validation error',
      errors: [{ field: 'general', message: 'An unexpected error occurred' }],
    };
  }
}

// Rate limiting middleware
export function withRateLimit(
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
      const key = Array.isArray(ip) ? ip[0] : ip;
      const now = Date.now();

      // Clean up old entries
      for (const [k, v] of requests.entries()) {
        if (now > v.resetTime) {
          requests.delete(k);
        }
      }

      // Check current request count
      const current = requests.get(key) || { count: 0, resetTime: now + windowMs };

      if (current.count >= maxRequests && now < current.resetTime) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests',
          errors: [{ field: 'general', message: 'Rate limit exceeded. Please try again later.' }],
        } as ApiValidationResult);
      }

      // Update request count
      current.count++;
      requests.set(key, current);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current.count).toString());
      res.setHeader('X-RateLimit-Reset', Math.ceil(current.resetTime / 1000).toString());

      await handler(req, res);
    };
  };
}

// CSRF protection middleware
export function withCSRF(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Only check CSRF for state-changing methods
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method || '')) {
      const token = req.headers['x-csrf-token'] || req.body.csrfToken;

      if (!token) {
        return res.status(403).json({
          success: false,
          message: 'CSRF token missing',
          errors: [{ field: 'general', message: 'CSRF token is required' }],
        } as ApiValidationResult);
      }

      // In a real application, you would validate the CSRF token here
      // For this example, we'll just check if it exists
    }

    await handler(req, res);
  };
}

// Combined middleware for comprehensive API protection
export function withApiProtection<T>(
  schema: ZodSchema<T>,
  options: {
    rateLimit?: { maxRequests?: number; windowMs?: number };
    requireCSRF?: boolean;
  } = {}
) {
  return (handler: (req: NextApiRequest, res: NextApiResponse, validatedData: T) => Promise<void> | void) => {
    let protectedHandler = handler;

    // Apply validation
    protectedHandler = withValidation(schema, protectedHandler);

    // Apply CSRF protection if requested
    if (options.requireCSRF) {
      protectedHandler = withCSRF(protectedHandler);
    }

    // Apply rate limiting if specified
    if (options.rateLimit) {
      protectedHandler = withRateLimit(
        options.rateLimit.maxRequests,
        options.rateLimit.windowMs
      )(protectedHandler);
    }

    return protectedHandler;
  };
}

// Sanitization helpers
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>\"']/g, '') // Remove potentially dangerous characters
    .trim()
    .slice(0, 1000); // Limit length
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeInput(value) as T[keyof T];
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key as keyof T] = sanitizeObject(value) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value;
    }
  }

  return sanitized;
}