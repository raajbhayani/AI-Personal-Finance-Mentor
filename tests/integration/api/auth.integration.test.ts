import { createMocks } from 'node-mocks-http';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../../../src/models/User';
import loginHandler from '../../../src/pages/api/auth/login';
import signupHandler from '../../../src/pages/api/auth/signup';
import logoutHandler from '../../../src/pages/api/auth/logout';
import refreshHandler from '../../../src/pages/api/auth/refresh';

describe('/api/auth Integration Tests', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();
  });

  afterEach(async () => {
    // Clean up all collections after each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user successfully', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
        },
      });

      await signupHandler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.message).toContain('User created successfully');
      expect(data.data.user.email).toBe('test@example.com');
      expect(data.data.user.name).toBe('Test User');
      expect(data.data.tokens.accessToken).toBeDefined();
      expect(data.data.tokens.refreshToken).toBeDefined();

      // Verify user was created in database
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).toBeTruthy();
      expect(user!.name).toBe('Test User');
      expect(user!.emailVerified).toBe(false);
    });

    it('should hash the password correctly', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
        },
      });

      await signupHandler(req, res);

      const user = await User.findOne({ email: 'test@example.com' });
      expect(user!.password).not.toBe('Password123!');

      const isValidPassword = await bcrypt.compare('Password123!', user!.password);
      expect(isValidPassword).toBe(true);
    });

    it('should return 400 for duplicate email', async () => {
      // Create user first
      await User.create({
        email: 'existing@example.com',
        password: await bcrypt.hash('Password123!', 12),
        name: 'Existing User',
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'existing@example.com',
          password: 'Password123!',
          name: 'Test User',
        },
      });

      await signupHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DUPLICATE_ENTRY');
    });

    it('should return 400 for invalid email format', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'invalid-email',
          password: 'Password123!',
          name: 'Test User',
        },
      });

      await signupHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_EMAIL_FORMAT');
    });

    it('should return 400 for weak password', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: '123',
          name: 'Test User',
        },
      });

      await signupHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('PASSWORD_TOO_WEAK');
    });

    it('should return 400 for missing required fields', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'test@example.com',
          // Missing password and name
        },
      });

      await signupHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('MISSING_REQUIRED_FIELD');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await User.create({
        email: 'test@example.com',
        password: await bcrypt.hash('Password123!', 12),
        name: 'Test User',
        emailVerified: true,
        isActive: true,
      });
    });

    it('should login user with valid credentials', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'Password123!',
        },
      });

      await loginHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.message).toContain('Login successful');
      expect(data.data.user.email).toBe('test@example.com');
      expect(data.data.tokens.accessToken).toBeDefined();
      expect(data.data.tokens.refreshToken).toBeDefined();

      // Verify tokens are valid JWTs
      const accessToken = jwt.decode(data.data.tokens.accessToken) as any;
      expect(accessToken.email).toBe('test@example.com');
      expect(accessToken.type).toBe('access');

      const refreshToken = jwt.decode(data.data.tokens.refreshToken) as any;
      expect(refreshToken.type).toBe('refresh');
    });

    it('should return 401 for invalid email', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'nonexistent@example.com',
          password: 'Password123!',
        },
      });

      await loginHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for invalid password', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'WrongPassword!',
        },
      });

      await loginHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 403 for unverified email', async () => {
      // Create unverified user
      await User.create({
        email: 'unverified@example.com',
        password: await bcrypt.hash('Password123!', 12),
        name: 'Unverified User',
        emailVerified: false,
        isActive: true,
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'unverified@example.com',
          password: 'Password123!',
        },
      });

      await loginHandler(req, res);

      expect(res._getStatusCode()).toBe(403);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('EMAIL_NOT_VERIFIED');
    });

    it('should return 403 for inactive account', async () => {
      // Create inactive user
      await User.create({
        email: 'inactive@example.com',
        password: await bcrypt.hash('Password123!', 12),
        name: 'Inactive User',
        emailVerified: true,
        isActive: false,
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'inactive@example.com',
          password: 'Password123!',
        },
      });

      await loginHandler(req, res);

      expect(res._getStatusCode()).toBe(403);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('ACCOUNT_LOCKED');
    });

    it('should handle rate limiting for failed attempts', async () => {
      const email = 'test@example.com';

      // Make multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            email,
            password: 'WrongPassword!',
          },
          headers: {
            'x-forwarded-for': '192.168.1.1',
          },
        });

        await loginHandler(req, res);

        if (i < 5) {
          expect(res._getStatusCode()).toBe(401);
        } else {
          // 6th attempt should be rate limited
          expect(res._getStatusCode()).toBe(429);
          const data = JSON.parse(res._getData());
          expect(data.error.code).toBe('RATE_LIMIT_EXCEEDED');
        }
      }
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          cookie: 'refreshToken=valid-refresh-token',
        },
      });

      await logoutHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.message).toContain('Logged out successfully');

      // Verify refresh token cookie is cleared
      const cookies = res._getHeaders()['set-cookie'];
      expect(cookies).toEqual(
        expect.arrayContaining([
          expect.stringContaining('refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT')
        ])
      );
    });

    it('should handle logout without refresh token', async () => {
      const { req, res } = createMocks({
        method: 'POST',
      });

      await logoutHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let validRefreshToken: string;
    let user: any;

    beforeEach(async () => {
      // Create a test user
      user = await User.create({
        email: 'test@example.com',
        password: await bcrypt.hash('Password123!', 12),
        name: 'Test User',
        emailVerified: true,
        isActive: true,
        tokenVersion: 0,
      });

      // Generate a valid refresh token
      validRefreshToken = jwt.sign(
        {
          userId: user._id.toString(),
          sessionId: 'test-session-id',
          tokenVersion: 0,
          type: 'refresh',
        },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '7d' }
      );
    });

    it('should refresh tokens with valid refresh token', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          cookie: `refreshToken=${validRefreshToken}`,
        },
      });

      await refreshHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.accessToken).toBeDefined();
      expect(data.data.refreshToken).toBeDefined();

      // Verify new tokens are different
      expect(data.data.refreshToken).not.toBe(validRefreshToken);
    });

    it('should return 401 for missing refresh token', async () => {
      const { req, res } = createMocks({
        method: 'POST',
      });

      await refreshHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('MISSING_TOKEN');
    });

    it('should return 401 for invalid refresh token', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          cookie: 'refreshToken=invalid-token',
        },
      });

      await refreshHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_TOKEN');
    });

    it('should return 401 for expired refresh token', async () => {
      const expiredToken = jwt.sign(
        {
          userId: user._id.toString(),
          sessionId: 'test-session-id',
          tokenVersion: 0,
          type: 'refresh',
        },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          cookie: `refreshToken=${expiredToken}`,
        },
      });

      await refreshHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('TOKEN_EXPIRED');
    });

    it('should return 401 for mismatched token version', async () => {
      // Update user token version
      await User.findByIdAndUpdate(user._id, { tokenVersion: 1 });

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          cookie: `refreshToken=${validRefreshToken}`, // Still version 0
        },
      });

      await refreshHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('Method validation', () => {
    it('should return 405 for invalid HTTP methods', async () => {
      const { req, res } = createMocks({
        method: 'GET', // Should be POST
      });

      await loginHandler(req, res);

      expect(res._getStatusCode()).toBe(405);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('Method not allowed');
      expect(res._getHeaders().allow).toEqual(['POST']);
    });
  });

  describe('Error handling', () => {
    it('should handle database connection errors', async () => {
      // Close the database connection to simulate an error
      await mongoose.connection.close();

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'Password123!',
        },
      });

      await loginHandler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DB_CONNECTION_FAILED');

      // Reconnect for cleanup
      await mongoose.connect((global as any).__MONGO_URI__);
    });

    it('should include correlation ID in error responses', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'invalid-email',
          password: 'Password123!',
        },
        headers: {
          'x-correlation-id': 'test-correlation-123',
        },
      });

      await loginHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error.correlationId).toBeDefined();
      expect(res._getHeaders()['x-correlation-id']).toBeDefined();
    });
  });
});