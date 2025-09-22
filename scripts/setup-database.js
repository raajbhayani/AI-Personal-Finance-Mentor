#!/usr/bin/env node

/**
 * MongoDB Database Setup Script
 * Initializes the database with sample collections and data
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'ai-finance-mentor';

// Sample data
const sampleUser = {
  _id: 'user_demo_123',
  email: 'demo@financeapp.com',
  name: 'Demo User',
  avatar: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const sampleTransactions = [
  {
    _id: 'trans_001',
    userId: 'user_demo_123',
    amount: -67.50,
    description: 'Grocery Store',
    category: 'Food & Dining',
    type: 'expense',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    merchant: 'Fresh Market',
    paymentMethod: 'Credit Card',
    tags: ['groceries', 'essential'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'trans_002',
    userId: 'user_demo_123',
    amount: 3000,
    description: 'Salary Deposit',
    category: 'Income',
    type: 'income',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    merchant: 'Tech Corp Inc',
    paymentMethod: 'Direct Deposit',
    tags: ['salary', 'monthly'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'trans_003',
    userId: 'user_demo_123',
    amount: -89.99,
    description: 'Electric Bill',
    category: 'Utilities',
    type: 'expense',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    merchant: 'City Power Company',
    paymentMethod: 'Auto Pay',
    tags: ['utilities', 'monthly'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'trans_004',
    userId: 'user_demo_123',
    amount: -45.20,
    description: 'Coffee Shop',
    category: 'Food & Dining',
    type: 'expense',
    date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    merchant: 'Local Cafe',
    paymentMethod: 'Debit Card',
    tags: ['coffee', 'dining'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'trans_005',
    userId: 'user_demo_123',
    amount: -125.00,
    description: 'Gas Station',
    category: 'Transportation',
    type: 'expense',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    merchant: 'Shell Gas',
    paymentMethod: 'Credit Card',
    tags: ['gas', 'car'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const sampleGoals = [
  {
    _id: 'goal_001',
    userId: 'user_demo_123',
    title: 'Emergency Fund',
    description: 'Build an emergency fund for unexpected expenses',
    targetAmount: 10000,
    currentAmount: 6000,
    targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months from now
    priority: 'high',
    status: 'active',
    category: 'Emergency',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'goal_002',
    userId: 'user_demo_123',
    title: 'Vacation Fund',
    description: 'Save for a dream vacation to Europe',
    targetAmount: 5000,
    currentAmount: 1200,
    targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
    priority: 'medium',
    status: 'active',
    category: 'Travel',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'goal_003',
    userId: 'user_demo_123',
    title: 'New Laptop',
    description: 'Save for a new MacBook Pro for work',
    targetAmount: 2500,
    currentAmount: 800,
    targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(), // 4 months from now
    priority: 'medium',
    status: 'active',
    category: 'Technology',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const sampleBudgets = [
  {
    _id: 'budget_001',
    userId: 'user_demo_123',
    category: 'Food & Dining',
    amount: 400,
    spent: 112.70,
    period: 'monthly',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'budget_002',
    userId: 'user_demo_123',
    category: 'Transportation',
    amount: 300,
    spent: 125.00,
    period: 'monthly',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'budget_003',
    userId: 'user_demo_123',
    category: 'Utilities',
    amount: 200,
    spent: 89.99,
    period: 'monthly',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const sampleCategories = [
  { _id: 'cat_001', name: 'Food & Dining', type: 'expense', icon: '🍽️', color: '#F59E0B' },
  { _id: 'cat_002', name: 'Transportation', type: 'expense', icon: '🚗', color: '#3B82F6' },
  { _id: 'cat_003', name: 'Utilities', type: 'expense', icon: '⚡', color: '#EF4444' },
  { _id: 'cat_004', name: 'Healthcare', type: 'expense', icon: '🏥', color: '#10B981' },
  { _id: 'cat_005', name: 'Entertainment', type: 'expense', icon: '🎬', color: '#8B5CF6' },
  { _id: 'cat_006', name: 'Shopping', type: 'expense', icon: '🛍️', color: '#EC4899' },
  { _id: 'cat_007', name: 'Income', type: 'income', icon: '💰', color: '#059669' },
  { _id: 'cat_008', name: 'Investment', type: 'income', icon: '📈', color: '#0891B2' },
];

async function setupDatabase() {
  let client;

  try {
    console.log('🚀 Starting database setup...');
    console.log(`📡 Connecting to: ${MONGODB_URI}`);

    client = new MongoClient(MONGODB_URI);
    await client.connect();

    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    console.log(`📊 Using database: ${DB_NAME}`);

    // Create collections
    const collections = ['users', 'transactions', 'goals', 'budgets', 'categories'];

    for (const collectionName of collections) {
      try {
        await db.createCollection(collectionName);
        console.log(`📋 Created collection: ${collectionName}`);
      } catch (error) {
        if (error.code === 48) {
          console.log(`📋 Collection already exists: ${collectionName}`);
        } else {
          throw error;
        }
      }
    }

    // Hash password for demo user
    const hashedPassword = await bcrypt.hash('demo123', 12);
    sampleUser.password = hashedPassword;

    // Insert sample data
    console.log('\n📥 Inserting sample data...');

    // Insert user
    try {
      await db.collection('users').insertOne(sampleUser);
      console.log('👤 Inserted demo user');
    } catch (error) {
      if (error.code === 11000) {
        console.log('👤 Demo user already exists');
      } else {
        throw error;
      }
    }

    // Insert transactions
    try {
      await db.collection('transactions').insertMany(sampleTransactions);
      console.log(`💳 Inserted ${sampleTransactions.length} sample transactions`);
    } catch (error) {
      if (error.code === 11000) {
        console.log('💳 Sample transactions already exist');
      } else {
        throw error;
      }
    }

    // Insert goals
    try {
      await db.collection('goals').insertMany(sampleGoals);
      console.log(`🎯 Inserted ${sampleGoals.length} sample goals`);
    } catch (error) {
      if (error.code === 11000) {
        console.log('🎯 Sample goals already exist');
      } else {
        throw error;
      }
    }

    // Insert budgets
    try {
      await db.collection('budgets').insertMany(sampleBudgets);
      console.log(`💰 Inserted ${sampleBudgets.length} sample budgets`);
    } catch (error) {
      if (error.code === 11000) {
        console.log('💰 Sample budgets already exist');
      } else {
        throw error;
      }
    }

    // Insert categories
    try {
      await db.collection('categories').insertMany(sampleCategories);
      console.log(`📂 Inserted ${sampleCategories.length} sample categories`);
    } catch (error) {
      if (error.code === 11000) {
        console.log('📂 Sample categories already exist');
      } else {
        throw error;
      }
    }

    // Create indexes for better performance
    console.log('\n🔍 Creating database indexes...');

    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('transactions').createIndex({ userId: 1, date: -1 });
    await db.collection('transactions').createIndex({ userId: 1, category: 1 });
    await db.collection('goals').createIndex({ userId: 1, status: 1 });
    await db.collection('budgets').createIndex({ userId: 1, period: 1 });

    console.log('🔍 Database indexes created');

    // Display setup summary
    console.log('\n📊 Database Setup Summary:');
    console.log('==========================');
    console.log(`Database: ${DB_NAME}`);
    console.log(`Demo User: ${sampleUser.email} / password: demo123`);
    console.log(`Transactions: ${sampleTransactions.length} sample records`);
    console.log(`Goals: ${sampleGoals.length} sample records`);
    console.log(`Budgets: ${sampleBudgets.length} sample records`);
    console.log(`Categories: ${sampleCategories.length} sample records`);

    console.log('\n✅ Database setup completed successfully!');
    console.log('\n🚀 You can now start the application with: npm run dev');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);

    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n📚 Troubleshooting:');
      console.log('1. Make sure MongoDB is running locally');
      console.log('2. Install MongoDB: https://docs.mongodb.com/manual/installation/');
      console.log('3. Start MongoDB service:');
      console.log('   macOS: brew services start mongodb-community');
      console.log('   Windows: net start MongoDB');
      console.log('   Linux: sudo systemctl start mongod');
    }

    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('📡 MongoDB connection closed');
    }
  }
}

// Run the setup
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };