import { NextApiRequest, NextApiResponse } from 'next';
import { ZodSchema, ZodError } from 'zod';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

export function validateRequestBody<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        errors: error.errors.map((err) => `${err.path.join('.')}: ${err.message}`),
      };
    }
    return {
      success: false,
      errors: ['Invalid request data'],
    };
  }
}

export function validateQueryParams<T>(
  schema: ZodSchema<T>,
  query: NextApiRequest['query']
): ValidationResult<T> {
  try {
    const processedQuery = processQueryParams(query);
    const validatedData = schema.parse(processedQuery);
    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        errors: error.errors.map((err) => `${err.path.join('.')}: ${err.message}`),
      };
    }
    return {
      success: false,
      errors: ['Invalid query parameters'],
    };
  }
}

function processQueryParams(query: NextApiRequest['query']): Record<string, any> {
  const processed: Record<string, any> = {};

  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      processed[key] = value;
    } else if (value !== undefined) {
      if (key.includes('Date') || key === 'date') {
        processed[key] = new Date(value);
      } else if (key.includes('Min') || key.includes('Max') || key === 'amount' || key === 'page' || key === 'limit') {
        const numValue = Number(value);
        processed[key] = isNaN(numValue) ? value : numValue;
      } else if (value === 'true' || value === 'false') {
        processed[key] = value === 'true';
      } else if (key === 'tags' && typeof value === 'string') {
        processed[key] = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      } else {
        processed[key] = value;
      }
    }
  });

  return processed;
}

export function createValidationMiddleware<T>(schema: ZodSchema<T>) {
  return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    const validation = validateRequestBody(schema, req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    (req as any).validatedData = validation.data;
    next();
  };
}

export function createQueryValidationMiddleware<T>(schema: ZodSchema<T>) {
  return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    const validation = validateQueryParams(schema, req.query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Query validation failed',
        errors: validation.errors,
      });
    }

    (req as any).validatedQuery = validation.data;
    next();
  };
}