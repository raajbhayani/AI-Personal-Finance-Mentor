#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Validates that all required environment variables are set for the current environment
 */

const path = require('path');
const fs = require('fs');

// Required environment variables for each environment
const ENV_REQUIREMENTS = {
  development: {
    required: [
      'NODE_ENV',
      'NEXT_PUBLIC_APP_ENV',
      'NEXT_PUBLIC_SITE_URL',
      'MONGODB_URI',
      'JWT_SECRET',
      'NEXTAUTH_SECRET',
      'ANTHROPIC_API_KEY',
    ],
    optional: [
      'REDIS_URL',
      'SENDGRID_API_KEY',
      'GOOGLE_CLIENT_ID',
      'STRIPE_PUBLISHABLE_KEY',
      'PLAID_CLIENT_ID',
    ],
  },
  staging: {
    required: [
      'NODE_ENV',
      'NEXT_PUBLIC_APP_ENV',
      'NEXT_PUBLIC_SITE_URL',
      'MONGODB_URI',
      'JWT_SECRET',
      'NEXTAUTH_SECRET',
      'ANTHROPIC_API_KEY',
      'REDIS_URL',
      'SENDGRID_API_KEY',
    ],
    optional: [
      'GOOGLE_CLIENT_ID',
      'STRIPE_PUBLISHABLE_KEY',
      'PLAID_CLIENT_ID',
      'SENTRY_DSN',
    ],
  },
  production: {
    required: [
      'NODE_ENV',
      'NEXT_PUBLIC_APP_ENV',
      'NEXT_PUBLIC_SITE_URL',
      'MONGODB_URI',
      'JWT_SECRET',
      'NEXTAUTH_SECRET',
      'ANTHROPIC_API_KEY',
      'REDIS_URL',
      'SENDGRID_API_KEY',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'STRIPE_PUBLISHABLE_KEY',
      'STRIPE_SECRET_KEY',
      'SENTRY_DSN',
    ],
    optional: [
      'PLAID_CLIENT_ID',
      'TWILIO_ACCOUNT_SID',
      'AWS_ACCESS_KEY_ID',
    ],
  },
};

// Security validation patterns
const SECURITY_PATTERNS = {
  JWT_SECRET: {
    minLength: 32,
    pattern: /^[A-Za-z0-9+/=]+$/,
    description: 'JWT secret should be at least 32 characters and base64-like',
  },
  NEXTAUTH_SECRET: {
    minLength: 32,
    pattern: /^[A-Za-z0-9+/=]+$/,
    description: 'NextAuth secret should be at least 32 characters',
  },
  ENCRYPTION_KEY: {
    minLength: 32,
    maxLength: 32,
    pattern: /^[A-Za-z0-9]{32}$/,
    description: 'Encryption key should be exactly 32 alphanumeric characters',
  },
  MONGODB_URI: {
    pattern: /^mongodb(\+srv)?:\/\/.+$/,
    description: 'MongoDB URI should start with mongodb:// or mongodb+srv://',
  },
  REDIS_URL: {
    pattern: /^redis(s)?:\/\/.+$/,
    description: 'Redis URL should start with redis:// or rediss://',
  },
};

class EnvValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.currentEnv = process.env.NODE_ENV || 'development';
    this.appEnv = process.env.NEXT_PUBLIC_APP_ENV || this.currentEnv;
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m',
    };

    const prefix = {
      info: 'ℹ',
      success: '✓',
      warning: '⚠',
      error: '✗',
    };

    console.log(`${colors[type]}${prefix[type]} ${message}${colors.reset}`);
  }

  validateRequired() {
    this.log(`Validating environment: ${this.appEnv}`);

    const requirements = ENV_REQUIREMENTS[this.appEnv];
    if (!requirements) {
      this.errors.push(`Unknown environment: ${this.appEnv}`);
      return;
    }

    // Check required variables
    requirements.required.forEach((varName) => {
      const value = process.env[varName];
      if (!value) {
        this.errors.push(`Missing required environment variable: ${varName}`);
      } else {
        this.validateSecurity(varName, value);
      }
    });

    // Check optional variables
    requirements.optional.forEach((varName) => {
      const value = process.env[varName];
      if (!value) {
        this.warnings.push(`Optional environment variable not set: ${varName}`);
      } else {
        this.validateSecurity(varName, value);
      }
    });
  }

  validateSecurity(varName, value) {
    const pattern = SECURITY_PATTERNS[varName];
    if (!pattern) return;

    // Check minimum length
    if (pattern.minLength && value.length < pattern.minLength) {
      this.errors.push(
        `${varName} is too short (${value.length} chars, minimum ${pattern.minLength}): ${pattern.description}`
      );
    }

    // Check maximum length
    if (pattern.maxLength && value.length > pattern.maxLength) {
      this.errors.push(
        `${varName} is too long (${value.length} chars, maximum ${pattern.maxLength}): ${pattern.description}`
      );
    }

    // Check pattern
    if (pattern.pattern && !pattern.pattern.test(value)) {
      this.errors.push(`${varName} format is invalid: ${pattern.description}`);
    }
  }

  validateProduction() {
    if (this.appEnv !== 'production') return;

    // Production-specific validations
    const prodChecks = [
      {
        condition: process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https://'),
        message: 'NEXT_PUBLIC_SITE_URL must use HTTPS in production',
      },
      {
        condition: process.env.NEXTAUTH_URL?.startsWith('https://'),
        message: 'NEXTAUTH_URL must use HTTPS in production',
      },
      {
        condition: process.env.DATABASE_SSL !== 'false',
        message: 'DATABASE_SSL should be enabled in production',
      },
      {
        condition: process.env.NODE_ENV === 'production',
        message: 'NODE_ENV must be "production" in production environment',
      },
      {
        condition: process.env.NEXT_PUBLIC_DEV_MODE !== 'true',
        message: 'NEXT_PUBLIC_DEV_MODE should be disabled in production',
      },
    ];

    prodChecks.forEach((check) => {
      if (!check.condition) {
        this.errors.push(check.message);
      }
    });
  }

  validateDevelopment() {
    if (this.appEnv !== 'development') return;

    // Development-specific warnings
    if (!process.env.REDIS_URL) {
      this.warnings.push('Consider setting up Redis for caching in development');
    }

    if (!process.env.SENDGRID_API_KEY) {
      this.warnings.push('Email functionality will be limited without SENDGRID_API_KEY');
    }
  }

  checkEnvFile() {
    const envFiles = ['.env.local', '.env'];
    let foundEnvFile = false;

    envFiles.forEach((file) => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        foundEnvFile = true;
        this.log(`Found environment file: ${file}`, 'success');
      }
    });

    if (!foundEnvFile) {
      this.warnings.push('No .env file found. Create .env.local for local development');
    }

    // Check if .env.example exists and is up to date
    const examplePath = path.join(process.cwd(), '.env.example');
    if (fs.existsSync(examplePath)) {
      this.log('Found .env.example file', 'success');
    } else {
      this.warnings.push('.env.example file not found');
    }
  }

  generateReport() {
    this.log('\\n=== Environment Validation Report ===');
    this.log(`Environment: ${this.appEnv}`);
    this.log(`Node Environment: ${this.currentEnv}`);

    if (this.warnings.length > 0) {
      this.log('\\nWarnings:');
      this.warnings.forEach((warning) => this.log(warning, 'warning'));
    }

    if (this.errors.length > 0) {
      this.log('\\nErrors:');
      this.errors.forEach((error) => this.log(error, 'error'));
      this.log(`\\nValidation failed with ${this.errors.length} error(s)`, 'error');
      return false;
    } else {
      this.log('\\nAll required environment variables are valid!', 'success');
      if (this.warnings.length > 0) {
        this.log(`Note: ${this.warnings.length} warning(s) found`, 'warning');
      }
      return true;
    }
  }

  run() {
    this.log('Starting environment validation...', 'info');

    this.checkEnvFile();
    this.validateRequired();
    this.validateProduction();
    this.validateDevelopment();

    const isValid = this.generateReport();
    process.exit(isValid ? 0 : 1);
  }
}

// Run if called directly
if (require.main === module) {
  const validator = new EnvValidator();
  validator.run();
}

module.exports = EnvValidator;