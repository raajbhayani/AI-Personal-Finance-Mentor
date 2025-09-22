import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function globalSetup() {
  console.log('🚀 Setting up test environment...');

  // Start in-memory MongoDB for integration tests
  const mongod = new MongoMemoryServer({
    instance: {
      port: 27017,
      dbName: 'test-finance-app',
    },
    binary: {
      version: '7.0.0',
    },
  });

  await mongod.start();
  const uri = mongod.getUri();

  // Set the MongoDB URI for tests
  process.env.MONGODB_URI = uri;
  process.env.MONGODB_TEST_URI = uri;

  // Store the mongod instance for cleanup
  (global as any).__MONGOD__ = mongod;

  console.log(`📦 MongoDB Memory Server started at: ${uri}`);

  // Set up other test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-only';
  process.env.ACCESS_TOKEN_EXPIRES_IN = '15m';
  process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
  process.env.BCRYPT_SALT_ROUNDS = '4'; // Lower for faster tests
  process.env.SESSION_TIMEOUT = '3600000';
  process.env.MAX_SESSIONS = '5';
  process.env.REQUIRE_MFA = 'false';

  // Mock external service endpoints
  process.env.ANTHROPIC_API_KEY = 'test-api-key';
  process.env.ERROR_REPORTING_ENDPOINT = 'https://test-error-reporting.com/api/errors';
  process.env.ERROR_REPORTING_API_KEY = 'test-error-api-key';
  process.env.LOG_ENDPOINT = 'https://test-logging.com/api/logs';
  process.env.LOG_API_KEY = 'test-log-api-key';

  // Disable external services for tests
  process.env.DISABLE_EXTERNAL_SERVICES = 'true';

  console.log('✅ Test environment setup complete');
}