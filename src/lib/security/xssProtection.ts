import { NextApiRequest, NextApiResponse } from 'next';
import DOMPurify from 'isomorphic-dompurify';

export interface CSPDirectives {
  'default-src'?: string[];
  'script-src'?: string[];
  'style-src'?: string[];
  'img-src'?: string[];
  'font-src'?: string[];
  'connect-src'?: string[];
  'frame-src'?: string[];
  'object-src'?: string[];
  'media-src'?: string[];
  'worker-src'?: string[];
  'child-src'?: string[];
  'form-action'?: string[];
  'base-uri'?: string[];
  'manifest-src'?: string[];
  'prefetch-src'?: string[];
  'navigate-to'?: string[];
  'upgrade-insecure-requests'?: boolean;
  'block-all-mixed-content'?: boolean;
  'report-uri'?: string;
  'report-to'?: string;
}

export class XSSProtectionService {
  private static readonly DEFAULT_CSP: CSPDirectives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for Next.js in development
      "'unsafe-eval'", // Required for Next.js in development
      'https://vercel.live',
      'https://cdn.jsdelivr.net',
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for styled-components and CSS-in-JS
      'https://fonts.googleapis.com',
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      'https://*.amazonaws.com', // For S3 uploads
      'https://*.cloudfront.net',
    ],
    'font-src': [
      "'self'",
      'data:',
      'https://fonts.gstatic.com',
    ],
    'connect-src': [
      "'self'",
      'https://api.anthropic.com', // For AI service
      'https://*.vercel.app',
      'wss://*.vercel.app',
    ],
    'frame-src': [
      "'none'",
    ],
    'object-src': [
      "'none'",
    ],
    'media-src': [
      "'self'",
      'https:',
    ],
    'worker-src': [
      "'self'",
      'blob:',
    ],
    'child-src': [
      "'self'",
    ],
    'form-action': [
      "'self'",
    ],
    'base-uri': [
      "'self'",
    ],
    'manifest-src': [
      "'self'",
    ],
    'upgrade-insecure-requests': true,
    'block-all-mixed-content': true,
  };

  private static readonly PRODUCTION_CSP: CSPDirectives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'strict-dynamic'",
      'https://vercel.live',
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com',
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:',
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
    ],
    'connect-src': [
      "'self'",
      'https://api.anthropic.com',
    ],
    'frame-src': [
      "'none'",
    ],
    'object-src': [
      "'none'",
    ],
    'form-action': [
      "'self'",
    ],
    'base-uri': [
      "'self'",
    ],
    'upgrade-insecure-requests': true,
    'block-all-mixed-content': true,
    'report-uri': '/api/security/csp-report',
  };

  static applySecurityHeaders(req: NextApiRequest, res: NextApiResponse): void {
    const isProduction = process.env.NODE_ENV === 'production';
    const csp = isProduction ? this.PRODUCTION_CSP : this.DEFAULT_CSP;

    // Content Security Policy
    res.setHeader('Content-Security-Policy', this.buildCSPHeader(csp));

    // X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // X-Frame-Options
    res.setHeader('X-Frame-Options', 'DENY');

    // X-XSS-Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Strict Transport Security (HSTS)
    if (isProduction) {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    // Permissions Policy
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    );

    // Cross-Origin Policies
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

    // Remove server signature
    res.removeHeader('X-Powered-By');
  }

  static sanitizeHtml(
    html: string,
    options: {
      allowedTags?: string[];
      allowedAttributes?: string[];
      allowedSchemes?: string[];
    } = {}
  ): string {
    const config = {
      ALLOWED_TAGS: options.allowedTags || [
        'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre'
      ],
      ALLOWED_ATTR: options.allowedAttributes || [
        'class', 'id'
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      FORBID_TAGS: ['script', 'object', 'embed', 'link', 'style', 'iframe'],
      FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout', 'onfocus', 'onblur'],
      KEEP_CONTENT: false,
      USE_PROFILES: { html: true },
    };

    return DOMPurify.sanitize(html, config);
  }

  static sanitizeUserInput(input: string): string {
    // Remove script tags and event handlers
    let sanitized = input.replace(/<script[^>]*>.*?<\/script>/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/vbscript:/gi, '');
    sanitized = sanitized.replace(/data:/gi, '');

    // Encode HTML entities
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    return sanitized;
  }

  static validateAndSanitizeJSON(jsonString: string): any {
    try {
      // Parse JSON
      const parsed = JSON.parse(jsonString);

      // Recursively sanitize string values
      return this.sanitizeJSONObject(parsed);
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  }

  static createNonce(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(16).toString('base64');
  }

  static buildCSPWithNonce(nonce: string): string {
    const csp = process.env.NODE_ENV === 'production'
      ? { ...this.PRODUCTION_CSP }
      : { ...this.DEFAULT_CSP };

    // Add nonce to script-src
    if (csp['script-src']) {
      csp['script-src'] = [...csp['script-src'], `'nonce-${nonce}'`];
    }

    return this.buildCSPHeader(csp);
  }

  static detectXSSAttempt(input: string): {
    isXSS: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    patterns: string[];
  } {
    const xssPatterns = [
      {
        pattern: /<script[^>]*>.*?<\/script>/gi,
        level: 'high' as const,
        name: 'Script tag injection',
      },
      {
        pattern: /javascript:/gi,
        level: 'high' as const,
        name: 'JavaScript protocol',
      },
      {
        pattern: /on\w+\s*=\s*["'][^"']*["']/gi,
        level: 'medium' as const,
        name: 'Event handler injection',
      },
      {
        pattern: /<iframe[^>]*>.*?<\/iframe>/gi,
        level: 'high' as const,
        name: 'Iframe injection',
      },
      {
        pattern: /<object[^>]*>.*?<\/object>/gi,
        level: 'high' as const,
        name: 'Object tag injection',
      },
      {
        pattern: /<embed[^>]*>/gi,
        level: 'high' as const,
        name: 'Embed tag injection',
      },
      {
        pattern: /vbscript:/gi,
        level: 'medium' as const,
        name: 'VBScript protocol',
      },
      {
        pattern: /data:text\/html/gi,
        level: 'medium' as const,
        name: 'Data URI HTML',
      },
    ];

    const detectedPatterns: string[] = [];
    let maxRiskLevel: 'low' | 'medium' | 'high' = 'low';

    for (const { pattern, level, name } of xssPatterns) {
      if (pattern.test(input)) {
        detectedPatterns.push(name);
        if (level === 'high' || (level === 'medium' && maxRiskLevel === 'low')) {
          maxRiskLevel = level;
        }
      }
    }

    return {
      isXSS: detectedPatterns.length > 0,
      riskLevel: maxRiskLevel,
      patterns: detectedPatterns,
    };
  }

  private static buildCSPHeader(csp: CSPDirectives): string {
    const directives: string[] = [];

    for (const [directive, value] of Object.entries(csp)) {
      if (typeof value === 'boolean' && value) {
        directives.push(directive);
      } else if (Array.isArray(value) && value.length > 0) {
        directives.push(`${directive} ${value.join(' ')}`);
      } else if (typeof value === 'string') {
        directives.push(`${directive} ${value}`);
      }
    }

    return directives.join('; ');
  }

  private static sanitizeJSONObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeUserInput(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeJSONObject(item));
    }

    if (obj !== null && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = this.sanitizeUserInput(key);
        sanitized[sanitizedKey] = this.sanitizeJSONObject(value);
      }
      return sanitized;
    }

    return obj;
  }
}

// Middleware for automatic XSS protection
export function xssProtectionMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
): void {
  // Apply security headers
  XSSProtectionService.applySecurityHeaders(req, res);

  // Sanitize request body if it exists
  if (req.body && typeof req.body === 'object') {
    try {
      req.body = XSSProtectionService.sanitizeJSONObject(req.body);
    } catch (error) {
      console.error('XSS protection error:', error);
    }
  }

  // Sanitize query parameters
  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        req.query[key] = XSSProtectionService.sanitizeUserInput(value);
      } else if (Array.isArray(value)) {
        req.query[key] = value.map(item =>
          typeof item === 'string'
            ? XSSProtectionService.sanitizeUserInput(item)
            : item
        );
      }
    }
  }

  next();
}

// React component wrapper for XSS protection
export function sanitizeProps<T extends Record<string, any>>(props: T): T {
  const sanitized = { ...props };

  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      sanitized[key] = XSSProtectionService.sanitizeUserInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = XSSProtectionService.sanitizeJSONObject(value);
    }
  }

  return sanitized;
}