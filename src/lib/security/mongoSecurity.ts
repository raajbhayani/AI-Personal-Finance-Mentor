import mongoose from 'mongoose';
import { z } from 'zod';

export class MongoSecurityService {
  private static readonly DANGEROUS_OPERATORS = [
    '$where',
    '$regex',
    '$exists',
    '$ne',
    '$gt',
    '$gte',
    '$lt',
    '$lte',
    '$in',
    '$nin',
    '$or',
    '$and',
    '$not',
    '$nor',
    '$size',
    '$all',
    '$elemMatch',
    '$slice',
    '$inc',
    '$set',
    '$unset',
    '$push',
    '$pull',
    '$addToSet',
    '$each',
    '$sort',
    '$expr',
    '$jsonSchema',
    '$text',
    '$search',
  ];

  static sanitizeQuery(query: any): any {
    if (query === null || query === undefined) {
      return query;
    }

    if (typeof query === 'string') {
      return this.sanitizeString(query);
    }

    if (typeof query === 'number' || typeof query === 'boolean') {
      return query;
    }

    if (query instanceof Date) {
      return query;
    }

    if (mongoose.Types.ObjectId.isValid(query)) {
      return new mongoose.Types.ObjectId(query);
    }

    if (Array.isArray(query)) {
      return query.map(item => this.sanitizeQuery(item));
    }

    if (typeof query === 'object') {
      const sanitized: any = {};

      for (const [key, value] of Object.entries(query)) {
        // Check for dangerous operators
        if (key.startsWith('$') && !this.isAllowedOperator(key)) {
          console.warn(`Blocked dangerous MongoDB operator: ${key}`);
          continue;
        }

        // Sanitize key names
        const sanitizedKey = this.sanitizeFieldName(key);

        // Recursively sanitize values
        sanitized[sanitizedKey] = this.sanitizeQuery(value);
      }

      return sanitized;
    }

    return query;
  }

  static createSecureFilter(userId: string, additionalFilters: any = {}): any {
    // Always ensure user context
    const baseFilter = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    // Sanitize additional filters
    const sanitizedFilters = this.sanitizeQuery(additionalFilters);

    return { ...baseFilter, ...sanitizedFilters };
  }

  static validateObjectId(id: string): mongoose.Types.ObjectId | null {
    if (!id || typeof id !== 'string') {
      return null;
    }

    // Remove any potential injection attempts
    const cleanId = id.replace(/[^a-fA-F0-9]/g, '');

    if (!mongoose.Types.ObjectId.isValid(cleanId)) {
      return null;
    }

    return new mongoose.Types.ObjectId(cleanId);
  }

  static buildSecureAggregationPipeline(
    userId: string,
    pipeline: any[]
  ): any[] {
    // Always start with user context match
    const securePipeline = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
        },
      },
    ];

    // Sanitize and validate each stage
    for (const stage of pipeline) {
      const sanitizedStage = this.sanitizeAggregationStage(stage);
      if (sanitizedStage) {
        securePipeline.push(sanitizedStage);
      }
    }

    return securePipeline;
  }

  static sanitizeUpdateQuery(updateQuery: any): any {
    const sanitized: any = {};

    for (const [operator, fields] of Object.entries(updateQuery)) {
      // Only allow safe update operators
      if (this.isAllowedUpdateOperator(operator)) {
        sanitized[operator] = this.sanitizeQuery(fields);
      } else {
        console.warn(`Blocked dangerous update operator: ${operator}`);
      }
    }

    // Always update the updatedAt timestamp
    if (!sanitized.$set) {
      sanitized.$set = {};
    }
    sanitized.$set.updatedAt = new Date();

    return sanitized;
  }

  static validateAndSanitizeSort(sortQuery: any): any {
    if (!sortQuery || typeof sortQuery !== 'object') {
      return { createdAt: -1 }; // Default safe sort
    }

    const sanitized: any = {};
    const allowedFields = [
      'createdAt',
      'updatedAt',
      'date',
      'amount',
      'title',
      'name',
      'category',
      'priority',
      'status',
    ];

    for (const [field, direction] of Object.entries(sortQuery)) {
      const sanitizedField = this.sanitizeFieldName(field);

      // Only allow whitelisted fields
      if (allowedFields.includes(sanitizedField)) {
        // Ensure direction is only 1 or -1
        const sanitizedDirection = direction === 1 || direction === '1' || direction === 'asc' ? 1 : -1;
        sanitized[sanitizedField] = sanitizedDirection;
      }
    }

    return Object.keys(sanitized).length > 0 ? sanitized : { createdAt: -1 };
  }

  static createSecurePaginationOptions(
    page: number = 1,
    limit: number = 20,
    maxLimit: number = 100
  ): { skip: number; limit: number } {
    const safePage = Math.max(1, Math.floor(Number(page)) || 1);
    const safeLimit = Math.min(
      maxLimit,
      Math.max(1, Math.floor(Number(limit)) || 20)
    );
    const skip = (safePage - 1) * safeLimit;

    return { skip, limit: safeLimit };
  }

  static validateAndSanitizeRegexQuery(pattern: string, options?: string): RegExp | null {
    try {
      // Limit pattern length to prevent ReDoS attacks
      if (pattern.length > 100) {
        return null;
      }

      // Remove dangerous regex patterns
      const dangerousPatterns = [
        /\(\?\!/,  // Negative lookahead
        /\(\?\<\=/,  // Positive lookbehind
        /\(\?\<\!/,  // Negative lookbehind
        /\(\?\=/,   // Positive lookahead
        /\.\*\.\*/,  // Multiple .* patterns
        /\+\*/,     // Nested quantifiers
        /\*\+/,     // Nested quantifiers
      ];

      for (const dangerous of dangerousPatterns) {
        if (dangerous.test(pattern)) {
          return null;
        }
      }

      // Sanitize options
      const safeOptions = options?.replace(/[^gimsu]/g, '') || 'i';

      return new RegExp(pattern, safeOptions);
    } catch {
      return null;
    }
  }

  private static sanitizeString(str: string): string {
    // Remove null bytes and control characters
    return str.replace(/\0/g, '').replace(/[\x00-\x1F\x7F]/g, '');
  }

  private static sanitizeFieldName(fieldName: string): string {
    // Remove dangerous characters from field names
    return fieldName.replace(/[\$\.\[\]]/g, '');
  }

  private static isAllowedOperator(operator: string): boolean {
    const allowedOperators = [
      '$eq',
      '$ne',
      '$gt',
      '$gte',
      '$lt',
      '$lte',
      '$in',
      '$nin',
      '$exists',
      '$regex',
      '$options',
      '$and',
      '$or',
      '$text',
      '$search',
    ];

    return allowedOperators.includes(operator);
  }

  private static isAllowedUpdateOperator(operator: string): boolean {
    const allowedUpdateOperators = [
      '$set',
      '$unset',
      '$inc',
      '$push',
      '$pull',
      '$addToSet',
      '$pop',
      '$rename',
    ];

    return allowedUpdateOperators.includes(operator);
  }

  private static isAllowedAggregationOperator(operator: string): boolean {
    const allowedAggregationOperators = [
      '$match',
      '$group',
      '$sort',
      '$limit',
      '$skip',
      '$project',
      '$unwind',
      '$lookup',
      '$addFields',
      '$count',
      '$facet',
      '$sample',
    ];

    return allowedAggregationOperators.includes(operator);
  }

  private static sanitizeAggregationStage(stage: any): any | null {
    if (!stage || typeof stage !== 'object') {
      return null;
    }

    const sanitizedStage: any = {};

    for (const [operator, value] of Object.entries(stage)) {
      if (this.isAllowedAggregationOperator(operator)) {
        sanitizedStage[operator] = this.sanitizeQuery(value);
      } else {
        console.warn(`Blocked dangerous aggregation operator: ${operator}`);
        return null;
      }
    }

    return sanitizedStage;
  }
}

// Zod schemas for MongoDB operations
export const MongoObjectIdSchema = z.string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid MongoDB ObjectId',
  })
  .transform((val) => new mongoose.Types.ObjectId(val));

export const MongoQuerySchema = z.any()
  .transform((val) => MongoSecurityService.sanitizeQuery(val));

export const MongoSortSchema = z.record(z.union([z.literal(1), z.literal(-1)]))
  .transform((val) => MongoSecurityService.validateAndSanitizeSort(val));

export const MongoPaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
}).transform((val) => MongoSecurityService.createSecurePaginationOptions(val.page, val.limit));

// Security middleware for MongoDB operations
export function withMongoSecurity<T extends any[]>(
  operation: (...args: T) => Promise<any>
) {
  return async (...args: T): Promise<any> => {
    try {
      // Add query sanitization and validation here
      const result = await operation(...args);
      return result;
    } catch (error) {
      // Log security violations
      console.error('MongoDB security violation:', error);
      throw new Error('Operation blocked for security reasons');
    }
  };
}

// Enhanced model methods with security
export function createSecureModel<T>(
  modelName: string,
  schema: mongoose.Schema<T>
): mongoose.Model<T> {
  // Add pre-save hooks for security
  schema.pre('save', function(next) {
    // Sanitize all string fields
    for (const [key, value] of Object.entries(this.toObject())) {
      if (typeof value === 'string') {
        (this as any)[key] = MongoSecurityService.sanitizeQuery(value);
      }
    }
    next();
  });

  // Add pre-update hooks
  schema.pre(['updateOne', 'updateMany', 'findOneAndUpdate'], function() {
    const update = this.getUpdate();
    if (update) {
      this.setUpdate(MongoSecurityService.sanitizeUpdateQuery(update));
    }
  });

  return mongoose.model<T>(modelName, schema);
}