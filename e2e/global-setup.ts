import { chromium, FullConfig } from '@playwright/test';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User';
import Transaction from '../src/models/Transaction';
import Goal from '../src/models/Goal';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up E2E test environment...');

  // Start in-memory MongoDB for E2E tests
  const mongod = new MongoMemoryServer({
    instance: {
      port: 27018, // Different port from unit tests
      dbName: 'e2e-finance-app',
    },
  });

  await mongod.start();
  const uri = mongod.getUri();

  // Connect to MongoDB
  await mongoose.connect(uri);

  // Store mongod instance for cleanup
  (global as any).__E2E_MONGOD__ = mongod;

  // Set environment variables for E2E tests
  // process.env.NODE_ENV = 'test'; // NODE_ENV is read-only in some environments
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = 'e2e-test-jwt-secret';
  process.env.JWT_REFRESH_SECRET = 'e2e-test-jwt-refresh-secret';
  process.env.NEXTAUTH_SECRET = 'e2e-test-nextauth-secret';
  process.env.NEXTAUTH_URL = 'http://localhost:3000';

  // Create test users and data
  await seedTestData();

  console.log(`📦 E2E MongoDB started at: ${uri}`);
  console.log('✅ E2E test environment setup complete');
}

async function seedTestData() {
  console.log('🌱 Seeding test data...');

  // Create test users
  const testUser = await User.create({
    email: 'test@example.com',
    password: await bcrypt.hash('Password123!', 10),
    name: 'Test User',
    emailVerified: true,
    isActive: true,
    role: 'USER',
    permissions: ['read', 'write'],
  });

  const adminUser = await User.create({
    email: 'admin@example.com',
    password: await bcrypt.hash('AdminPass123!', 10),
    name: 'Admin User',
    emailVerified: true,
    isActive: true,
    role: 'ADMIN',
    permissions: ['*'],
  });

  // Create sample transactions for test user
  const transactions = [
    {
      userId: testUser._id,
      amount: 2500,
      type: 'INCOME',
      category: 'SALARY',
      description: 'Monthly salary',
      date: new Date('2024-01-01'),
      tags: ['salary', 'monthly'],
    },
    {
      userId: testUser._id,
      amount: 150,
      type: 'EXPENSE',
      category: 'FOOD',
      description: 'Grocery shopping',
      date: new Date('2024-01-05'),
      tags: ['groceries', 'weekly'],
    },
    {
      userId: testUser._id,
      amount: 50,
      type: 'EXPENSE',
      category: 'TRANSPORT',
      description: 'Gas for car',
      date: new Date('2024-01-08'),
      tags: ['gas', 'car'],
    },
    {
      userId: testUser._id,
      amount: 80,
      type: 'EXPENSE',
      category: 'ENTERTAINMENT',
      description: 'Movie and dinner',
      date: new Date('2024-01-12'),
      tags: ['movies', 'dinner', 'weekend'],
    },
    {
      userId: testUser._id,
      amount: 200,
      type: 'EXPENSE',
      category: 'UTILITIES',
      description: 'Electricity bill',
      date: new Date('2024-01-15'),
      tags: ['bills', 'utilities'],
    },
    {
      userId: testUser._id,
      amount: 1000,
      type: 'INCOME',
      category: 'FREELANCE',
      description: 'Freelance project payment',
      date: new Date('2024-01-20'),
      tags: ['freelance', 'project'],
    },
  ];

  await Transaction.insertMany(transactions);

  // Create sample goals for test user
  const goals = [
    {
      userId: testUser._id,
      name: 'Emergency Fund',
      targetAmount: 10000,
      currentAmount: 3500,
      targetDate: new Date('2024-12-31'),
      category: 'EMERGENCY',
      description: 'Build emergency fund for 6 months expenses',
      isActive: true,
    },
    {
      userId: testUser._id,
      name: 'Vacation to Europe',
      targetAmount: 5000,
      currentAmount: 1200,
      targetDate: new Date('2024-08-15'),
      category: 'TRAVEL',
      description: 'Save for 2-week European vacation',
      isActive: true,
    },
    {
      userId: testUser._id,
      name: 'New Laptop',
      targetAmount: 2000,
      currentAmount: 800,
      targetDate: new Date('2024-06-30'),
      category: 'TECHNOLOGY',
      description: 'Save for new MacBook Pro',
      isActive: true,
    },
  ];

  await Goal.insertMany(goals);

  console.log('✅ Test data seeded successfully');

  // Store test user data for use in tests
  (global as any).__E2E_TEST_USER__ = {
    id: testUser._id.toString(),
    email: 'test@example.com',
    password: 'Password123!',
    name: 'Test User',
  };

  (global as any).__E2E_ADMIN_USER__ = {
    id: adminUser._id.toString(),
    email: 'admin@example.com',
    password: 'AdminPass123!',
    name: 'Admin User',
  };
}

export default globalSetup;