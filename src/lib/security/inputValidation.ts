import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

interface SanitizationOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
  stripTags?: boolean;
  maxLength?: number;
}

export class SecurityValidationService {
  private static readonly DANGEROUS_PATTERNS = [
    // JavaScript injection patterns
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload=/gi,
    /onclick=/gi,
    /onerror=/gi,
    /onmouseover=/gi,

    // SQL injection patterns
    /('|(\\')|(;)|(\\;)|(\|)|(\\|)|(\*)|(\s*or\s+)|(union\s+select)|(\s*and\s+)|(\s*drop\s+)|(\s*delete\s+)|(\s*insert\s+)|(\s*update\s+)/gi,

    // NoSQL injection patterns
    /\$where/gi,
    /\$ne/gi,
    /\$gt/gi,
    /\$lt/gi,
    /\$regex/gi,
    /\$exists/gi,

    // Path traversal
    /\.\.\//gi,
    /\.\.\\/gi,

    // Command injection
    /\||\&|\;|\$|\`/gi,
  ];

  private static readonly FINANCIAL_PATTERNS = {
    // Credit card numbers (basic validation)
    creditCard: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})$/,

    // Bank account patterns (US format)
    bankAccount: /^\d{8,17}$/,

    // SSN patterns
    ssn: /^\d{3}-?\d{2}-?\d{4}$/,

    // Routing numbers
    routingNumber: /^\d{9}$/,
  };

  static sanitizeInput(input: unknown, options: SanitizationOptions = {}): string {
    if (typeof input !== 'string') {
      input = String(input);
    }

    let sanitized = input as string;

    // Apply length restrictions
    if (options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }

    // Strip or escape HTML tags
    if (options.stripTags) {
      sanitized = validator.stripLow(sanitized);
      sanitized = this.stripHtmlTags(sanitized);
    } else {
      sanitized = DOMPurify.sanitize(sanitized, {
        ALLOWED_TAGS: options.allowedTags || [],
        ALLOWED_ATTR: options.allowedAttributes || [],
      });
    }

    // Escape dangerous characters
    sanitized = validator.escape(sanitized);

    // Remove null bytes and control characters
    sanitized = sanitized.replace(/\0/g, '').replace(/[\x00-\x1F\x7F]/g, '');

    return sanitized.trim();
  }

  static validateAndSanitizeObject(obj: Record<string, any>, schema: z.ZodSchema): {
    isValid: boolean;
    sanitizedData?: any;
    errors?: string[];
    securityViolations?: string[];
  } {
    const securityViolations: string[] = [];
    const sanitizedObj: Record<string, any> = {};

    // First pass: sanitize all string values and check for security violations
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Check for dangerous patterns
        const violations = this.detectSecurityViolations(value);
        if (violations.length > 0) {
          securityViolations.push(`${key}: ${violations.join(', ')}`);
        }

        // Sanitize the value
        sanitizedObj[key] = this.sanitizeInput(value, {
          stripTags: true,
          maxLength: this.getMaxLengthForField(key),
        });
      } else if (Array.isArray(value)) {
        sanitizedObj[key] = value.map(item =>
          typeof item === 'string'
            ? this.sanitizeInput(item, { stripTags: true, maxLength: 500 })
            : item
        );
      } else {
        sanitizedObj[key] = value;
      }
    }

    // Return early if security violations detected
    if (securityViolations.length > 0) {
      return {
        isValid: false,
        securityViolations,
      };
    }

    // Second pass: validate against schema
    try {
      const validatedData = schema.parse(sanitizedObj);
      return {
        isValid: true,
        sanitizedData: validatedData,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
        };
      }
      return {
        isValid: false,
        errors: ['Validation failed'],
      };
    }
  }

  static detectSecurityViolations(input: string): string[] {
    const violations: string[] = [];

    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(input)) {
        violations.push('Potentially malicious content detected');
        break;
      }
    }

    // Check for financial data exposure
    for (const [type, pattern] of Object.entries(this.FINANCIAL_PATTERNS)) {
      if (pattern.test(input.replace(/\s/g, ''))) {
        violations.push(`Potential ${type} detected - use secure fields for sensitive data`);
      }
    }

    return violations;
  }

  static validateEmail(email: string): boolean {
    return validator.isEmail(email) && !this.isDisposableEmail(email);
  }

  static validatePassword(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length < 8) {
      feedback.push('Password must be at least 8 characters long');
    } else if (password.length >= 12) {
      score += 2;
    } else {
      score += 1;
    }

    if (!/[a-z]/.test(password)) {
      feedback.push('Password must contain lowercase letters');
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      feedback.push('Password must contain uppercase letters');
    } else {
      score += 1;
    }

    if (!/[0-9]/.test(password)) {
      feedback.push('Password must contain numbers');
    } else {
      score += 1;
    }

    if (!/[^a-zA-Z0-9]/.test(password)) {
      feedback.push('Password must contain special characters');
    } else {
      score += 1;
    }

    // Check against common passwords
    if (this.isCommonPassword(password)) {
      feedback.push('Password is too common');
      score = Math.max(0, score - 2);
    }

    // Check for sequential or repeated characters
    if (this.hasSequentialChars(password) || this.hasRepeatedChars(password)) {
      feedback.push('Avoid sequential or repeated characters');
      score = Math.max(0, score - 1);
    }

    return {
      isValid: feedback.length === 0 && score >= 4,
      score: Math.max(0, Math.min(5, score)),
      feedback,
    };
  }

  static sanitizeFilename(filename: string): string {
    // Remove path traversal attempts
    let sanitized = filename.replace(/[\/\\:*?"<>|]/g, '');

    // Remove hidden file indicators
    sanitized = sanitized.replace(/^\.+/, '');

    // Limit length
    sanitized = sanitized.substring(0, 255);

    // Ensure it's not empty
    if (!sanitized) {
      sanitized = 'file';
    }

    return sanitized;
  }

  static validateFileUpload(file: {
    name: string;
    size: number;
    type: string;
  }, allowedTypes: string[], maxSize: number): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate file size
    if (file.size > maxSize) {
      errors.push(`File size exceeds maximum limit of ${maxSize / (1024 * 1024)}MB`);
    }

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    // Validate filename
    const sanitizedName = this.sanitizeFilename(file.name);
    if (sanitizedName !== file.name) {
      errors.push('Invalid characters in filename');
    }

    // Check for executable file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.js', '.vbs', '.jar'];
    const extension = file.name.toLowerCase().split('.').pop();
    if (extension && dangerousExtensions.includes(`.${extension}`)) {
      errors.push('Executable file types are not allowed');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static sanitizeUrl(url: string): string | null {
    try {
      const parsed = new URL(url);

      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return null;
      }

      // Block localhost and private IP ranges in production
      if (process.env.NODE_ENV === 'production') {
        const hostname = parsed.hostname.toLowerCase();
        if (
          hostname === 'localhost' ||
          hostname === '127.0.0.1' ||
          hostname === '::1' ||
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.startsWith('172.')
        ) {
          return null;
        }
      }

      return parsed.toString();
    } catch {
      return null;
    }
  }

  private static stripHtmlTags(input: string): string {
    return input.replace(/<[^>]*>/g, '');
  }

  private static getMaxLengthForField(fieldName: string): number {
    const fieldLimits: Record<string, number> = {
      email: 254,
      password: 128,
      firstName: 50,
      lastName: 50,
      description: 1000,
      notes: 2000,
      title: 200,
      address: 500,
      phone: 20,
      default: 500,
    };

    return fieldLimits[fieldName] || fieldLimits.default;
  }

  private static isDisposableEmail(email: string): boolean {
    const disposableDomains = [
      '10minutemail.com',
      'tempmail.org',
      'guerrillamail.com',
      'mailinator.com',
      'throwaway.email',
    ];

    const domain = email.split('@')[1]?.toLowerCase();
    return disposableDomains.includes(domain);
  }

  private static isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', '1234567890', 'abc123',
    ];

    return commonPasswords.includes(password.toLowerCase());
  }

  private static hasSequentialChars(password: string): boolean {
    const sequences = ['abcdefghijklmnopqrstuvwxyz', '0123456789', 'qwertyuiop'];

    for (const sequence of sequences) {
      for (let i = 0; i <= sequence.length - 3; i++) {
        const subseq = sequence.substring(i, i + 3);
        if (password.toLowerCase().includes(subseq) || password.toLowerCase().includes(subseq.split('').reverse().join(''))) {
          return true;
        }
      }
    }

    return false;
  }

  private static hasRepeatedChars(password: string): boolean {
    return /(.)\1{2,}/.test(password);
  }
}

// Enhanced Zod schemas with security validation
export const SecureStringSchema = z.string()
  .transform((val) => SecurityValidationService.sanitizeInput(val, { stripTags: true }))
  .refine((val) => {
    const violations = SecurityValidationService.detectSecurityViolations(val);
    return violations.length === 0;
  }, { message: 'Input contains potentially dangerous content' });

export const SecureEmailSchema = z.string()
  .email('Invalid email format')
  .transform((val) => SecurityValidationService.sanitizeInput(val, { stripTags: true }))
  .refine((val) => SecurityValidationService.validateEmail(val), {
    message: 'Invalid or disposable email address',
  });

export const SecurePasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .refine((val) => {
    const validation = SecurityValidationService.validatePassword(val);
    return validation.isValid;
  }, { message: 'Password does not meet security requirements' });

export const SecureUrlSchema = z.string()
  .url('Invalid URL format')
  .transform((val) => SecurityValidationService.sanitizeUrl(val))
  .refine((val) => val !== null, { message: 'Invalid or unsafe URL' });

export const SecureFilenameSchema = z.string()
  .transform((val) => SecurityValidationService.sanitizeFilename(val))
  .refine((val) => val.length > 0 && val.length <= 255, {
    message: 'Invalid filename',
  });