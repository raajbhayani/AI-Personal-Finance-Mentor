export interface Environment {
  // Database Configuration
  MONGODB_URI: string;
  MONGODB_DB_NAME: string;

  // Authentication
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL: string;

  // AI Service Configuration
  ANTHROPIC_API_KEY: string;

  // Application Settings
  NODE_ENV: 'development' | 'production' | 'test';
  NEXT_PUBLIC_APP_URL: string;

  // Email Configuration (Optional)
  EMAIL_SERVER_HOST?: string;
  EMAIL_SERVER_PORT?: string;
  EMAIL_SERVER_USER?: string;
  EMAIL_SERVER_PASSWORD?: string;
  EMAIL_FROM?: string;

  // External APIs (Optional)
  PLAID_CLIENT_ID?: string;
  PLAID_SECRET?: string;
  PLAID_ENV?: 'sandbox' | 'development' | 'production';

  // Security
  BCRYPT_SALT_ROUNDS?: string;

  // Logging
  LOG_LEVEL?: 'error' | 'warn' | 'info' | 'debug';
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Environment {}
  }
}