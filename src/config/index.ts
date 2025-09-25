function validateEnv() {
  const requiredVars = ['MONGODB_URI', 'JWT_SECRET', 'ANTHROPIC_API_KEY'];
  const missing = requiredVars.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

validateEnv();

export const config = {
  app: {
    name: 'AI Personal Finance Mentor',
    description: 'Your intelligent personal finance advisor - Developed by Raj',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
    version: '1.0.0',
    developer: 'Raj',
  },
  database: {
    uri: process.env.MONGODB_URI!,
    name: process.env.MONGODB_DB_NAME || 'ai-finance-mentor',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    nextAuthSecret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET!,
    nextAuthUrl: process.env.NEXTAUTH_URL || 'http://localhost:3001',
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  },
  ai: {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
  },
  email: {
    host: process.env.EMAIL_SERVER_HOST,
    port: process.env.EMAIL_SERVER_PORT ? parseInt(process.env.EMAIL_SERVER_PORT, 10) : undefined,
    user: process.env.EMAIL_SERVER_USER,
    password: process.env.EMAIL_SERVER_PASSWORD,
    from: process.env.EMAIL_FROM,
  },
  plaid: {
    clientId: process.env.PLAID_CLIENT_ID,
    secret: process.env.PLAID_SECRET,
    env: process.env.PLAID_ENV as 'sandbox' | 'development' | 'production' || 'sandbox',
  },
  features: {
    enableSignup: true,
    enablePasswordReset: true,
    enableEmailVerification: false,
    enableGoogleAuth: false,
    enableAppleAuth: false,
  },
  limits: {
    maxTransactionsPerDay: 100,
    maxBudgetsPerUser: 20,
    maxGoalsPerUser: 10,
    maxChatMessagesPerDay: 50,
  },
  defaults: {
    currency: 'USD',
    language: 'en',
    timezone: 'UTC',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
} as const;

export default config;