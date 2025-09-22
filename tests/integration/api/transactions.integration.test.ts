import { createMocks } from 'node-mocks-http';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../../../src/models/User';
import Transaction from '../../../src/models/Transaction';
import transactionsHandler from '../../../src/pages/api/transactions';
import transactionByIdHandler from '../../../src/pages/api/transactions/[id]';

describe('/api/transactions Integration Tests', () => {
  let mongod: MongoMemoryServer;
  let testUser: any;
  let validAccessToken: string;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();
  });

  beforeEach(async () => {
    // Clean up collections
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }

    // Create test user
    testUser = await User.create({
      email: 'test@example.com',
      password: 'hashedpassword',
      name: 'Test User',
      emailVerified: true,
      isActive: true,
    });

    // Generate valid access token
    validAccessToken = jwt.sign(
      {
        userId: testUser._id.toString(),
        email: testUser.email,
        role: 'USER',
        permissions: ['read', 'write'],
        sessionId: 'test-session-id',
        type: 'access',
      },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );
  });

  describe('GET /api/transactions', () => {
    beforeEach(async () => {
      // Create test transactions
      await Transaction.create([
        {
          userId: testUser._id,
          amount: 100,
          type: 'EXPENSE',
          category: 'FOOD',
          description: 'Grocery shopping',
          date: new Date('2024-01-15'),
          tags: ['groceries', 'weekly'],
        },
        {
          userId: testUser._id,
          amount: 50,
          type: 'EXPENSE',
          category: 'TRANSPORT',
          description: 'Bus fare',
          date: new Date('2024-01-16'),
          tags: ['transport'],
        },
        {
          userId: testUser._id,
          amount: 1000,
          type: 'INCOME',
          category: 'SALARY',
          description: 'Monthly salary',
          date: new Date('2024-01-01'),
          tags: ['salary', 'monthly'],
        },
      ]);

      // Create transaction for different user (should not be returned)
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'hashedpassword',
        name: 'Other User',
      });

      await Transaction.create({
        userId: otherUser._id,
        amount: 200,
        type: 'EXPENSE',
        category: 'FOOD',
        description: 'Other user transaction',
        date: new Date('2024-01-15'),
      });
    });

    it('should return user transactions with authentication', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: `Bearer ${validAccessToken}`,
        },
      });

      await transactionsHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.transactions).toHaveLength(3);
      expect(data.data.transactions[0].userId.toString()).toBe(testUser._id.toString());
    });

    it('should filter transactions by type', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { type: 'EXPENSE' },
        headers: {
          authorization: `Bearer ${validAccessToken}`,
        },
      });

      await transactionsHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.data.transactions).toHaveLength(2);
      expect(data.data.transactions.every((t: any) => t.type === 'EXPENSE')).toBe(true);
    });

    it('should filter transactions by category', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { category: 'FOOD' },
        headers: {
          authorization: `Bearer ${validAccessToken}`,
        },
      });

      await transactionsHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.data.transactions).toHaveLength(1);
      expect(data.data.transactions[0].category).toBe('FOOD');
    });

    it('should filter transactions by date range', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          startDate: '2024-01-15',
          endDate: '2024-01-16',
        },
        headers: {
          authorization: `Bearer ${validAccessToken}`,
        },
      });

      await transactionsHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.data.transactions).toHaveLength(2);
    });

    it('should search transactions by description', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { search: 'grocery' },
        headers: {
          authorization: `Bearer ${validAccessToken}`,
        },
      });

      await transactionsHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.data.transactions).toHaveLength(1);
      expect(data.data.transactions[0].description).toContain('Grocery');
    });

    it('should paginate transactions', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { page: '1', limit: '2' },
        headers: {
          authorization: `Bearer ${validAccessToken}`,
        },
      });

      await transactionsHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.data.transactions).toHaveLength(2);
      expect(data.data.pagination.page).toBe(1);
      expect(data.data.pagination.limit).toBe(2);
      expect(data.data.pagination.total).toBe(3);
      expect(data.data.pagination.totalPages).toBe(2);
    });

    it('should sort transactions by date descending by default', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: `Bearer ${validAccessToken}`,
        },
      });

      await transactionsHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      const dates = data.data.transactions.map((t: any) => new Date(t.date));

      // Should be sorted newest first
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1] >= dates[i]).toBe(true);
      }
    });

    it('should return 401 without authentication', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      });

      await transactionsHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('MISSING_TOKEN');
    });

    it('should return 401 with invalid token', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      await transactionsHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('POST /api/transactions', () => {
    it('should create a new transaction', async () => {
      const transactionData = {
        amount: 75.50,
        type: 'EXPENSE',
        category: 'ENTERTAINMENT',
        description: 'Movie tickets',
        date: '2024-01-20',
        tags: ['movies', 'weekend'],
      };

      const { req, res } = createMocks({
        method: 'POST',
        body: transactionData,
        headers: {
          authorization: `Bearer ${validAccessToken}`,
        },
      });

      await transactionsHandler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.transaction.amount).toBe(75.50);
      expect(data.data.transaction.type).toBe('EXPENSE');
      expect(data.data.transaction.category).toBe('ENTERTAINMENT');
      expect(data.data.transaction.userId.toString()).toBe(testUser._id.toString());

      // Verify transaction was saved in database
      const savedTransaction = await Transaction.findById(data.data.transaction._id);
      expect(savedTransaction).toBeTruthy();
      expect(savedTransaction!.description).toBe('Movie tickets');
    });

    it('should return 400 for invalid amount', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          amount: -50, // Negative amount
          type: 'EXPENSE',
          category: 'FOOD',
          description: 'Invalid transaction',
          date: '2024-01-20',
        },
        headers: {
          authorization: `Bearer ${validAccessToken}`,
        },
      });

      await transactionsHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_AMOUNT');
    });

    it('should return 400 for invalid transaction type', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          amount: 50,
          type: 'INVALID_TYPE',
          category: 'FOOD',
          description: 'Invalid transaction',
          date: '2024-01-20',
        },
        headers: {
          authorization: `Bearer ${validAccessToken}`,
        },
      });

      await transactionsHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_FAILED');
    });

    it('should return 400 for missing required fields', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          amount: 50,
          // Missing type, category, description
        },
        headers: {
          authorization: `Bearer ${validAccessToken}`,
        },
      });

      await transactionsHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('MISSING_REQUIRED_FIELD');
    });

    it('should return 400 for future date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          amount: 50,
          type: 'EXPENSE',
          category: 'FOOD',
          description: 'Future transaction',
          date: futureDate.toISOString(),
        },
        headers: {
          authorization: `Bearer ${validAccessToken}`,
        },
      });

      await transactionsHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_TRANSACTION_DATE');
    });
  });

  describe('GET /api/transactions/[id]', () => {
    let testTransaction: any;

    beforeEach(async () => {
      testTransaction = await Transaction.create({
        userId: testUser._id,
        amount: 100,
        type: 'EXPENSE',
        category: 'FOOD',
        description: 'Test transaction',
        date: new Date('2024-01-15'),
        tags: ['test'],
      });
    });

    it('should return specific transaction by ID', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { id: testTransaction._id.toString() },
        headers: {
          authorization: `Bearer ${validAccessToken}`,
        },
      });

      await transactionByIdHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.transaction._id).toBe(testTransaction._id.toString());
      expect(data.data.transaction.description).toBe('Test transaction');
    });

    it('should return 404 for non-existent transaction', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: nonExistentId.toString() },
        headers: {
          authorization: `Bearer ${validAccessToken}`,
        },
      });

      await transactionByIdHandler(req, res);

      expect(res._getStatusCode()).toBe(404);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('should return 403 for transaction belonging to different user', async () => {
      // Create transaction for different user
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'hashedpassword',
        name: 'Other User',
      });

      const otherTransaction = await Transaction.create({
        userId: otherUser._id,
        amount: 200,
        type: 'EXPENSE',
        category: 'FOOD',
        description: 'Other user transaction',
        date: new Date('2024-01-15'),
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: otherTransaction._id.toString() },
        headers: {
          authorization: `Bearer ${validAccessToken}`,
        },
      });

      await transactionByIdHandler(req, res);

      expect(res._getStatusCode()).toBe(403);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('RESOURCE_ACCESS_DENIED');
    });
  });

  describe('PUT /api/transactions/[id]', () => {
    let testTransaction: any;

    beforeEach(async () => {
      testTransaction = await Transaction.create({
        userId: testUser._id,
        amount: 100,
        type: 'EXPENSE',
        category: 'FOOD',
        description: 'Original description',
        date: new Date('2024-01-15'),
        tags: ['original'],
      });
    });

    it('should update transaction successfully', async () => {
      const updateData = {
        amount: 150,
        description: 'Updated description',
        tags: ['updated', 'test'],
      };

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: testTransaction._id.toString() },
        body: updateData,
        headers: {
          authorization: `Bearer ${validAccessToken}`,
        },
      });

      await transactionByIdHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.transaction.amount).toBe(150);
      expect(data.data.transaction.description).toBe('Updated description');
      expect(data.data.transaction.tags).toEqual(['updated', 'test']);

      // Verify update in database
      const updatedTransaction = await Transaction.findById(testTransaction._id);
      expect(updatedTransaction!.amount).toBe(150);
      expect(updatedTransaction!.description).toBe('Updated description');
    });

    it('should return 400 for invalid update data', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: testTransaction._id.toString() },
        body: {
          amount: -50, // Invalid negative amount
        },
        headers: {
          authorization: `Bearer ${validAccessToken}`,
        },
      });

      await transactionByIdHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_AMOUNT');
    });
  });

  describe('DELETE /api/transactions/[id]', () => {
    let testTransaction: any;

    beforeEach(async () => {
      testTransaction = await Transaction.create({
        userId: testUser._id,
        amount: 100,
        type: 'EXPENSE',
        category: 'FOOD',
        description: 'To be deleted',
        date: new Date('2024-01-15'),
      });
    });

    it('should delete transaction successfully', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: testTransaction._id.toString() },
        headers: {
          authorization: `Bearer ${validAccessToken}`,
        },
      });

      await transactionByIdHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.message).toContain('deleted successfully');

      // Verify deletion in database
      const deletedTransaction = await Transaction.findById(testTransaction._id);
      expect(deletedTransaction).toBeNull();
    });

    it('should return 404 when deleting non-existent transaction', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: nonExistentId.toString() },
        headers: {
          authorization: `Bearer ${validAccessToken}`,
        },
      });

      await transactionByIdHandler(req, res);

      expect(res._getStatusCode()).toBe(404);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('RESOURCE_NOT_FOUND');
    });
  });

  describe('Method validation', () => {
    it('should return 405 for unsupported methods on /api/transactions', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
        headers: {
          authorization: `Bearer ${validAccessToken}`,
        },
      });

      await transactionsHandler(req, res);

      expect(res._getStatusCode()).toBe(405);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('Method not allowed');
    });

    it('should return 405 for unsupported methods on /api/transactions/[id]', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'some-id' },
        headers: {
          authorization: `Bearer ${validAccessToken}`,
        },
      });

      await transactionByIdHandler(req, res);

      expect(res._getStatusCode()).toBe(405);
    });
  });
});