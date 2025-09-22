#!/usr/bin/env node

/**
 * Database Seeder Script
 * Populates MongoDB with comprehensive sample financial data for testing
 */

const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'ai-finance-mentor';

// Generate dates for the last 3 months
const now = new Date();
const getRandomDateInRange = (daysBack) => {
  const date = new Date(now);
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date;
};

// Test user data
const testUser = {
  _id: new ObjectId('65a1b2c3d4e5f6789abcdef0'),
  email: 'test@financeapp.com',
  name: 'Test User',
  avatar: null,
  preferences: {
    currency: 'USD',
    language: 'en',
    timezone: 'America/New_York',
    notifications: {
      email: true,
      push: false,
      budgetAlerts: true,
      goalReminders: true,
    }
  },
  createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
  updatedAt: new Date().toISOString(),
};

// Financial categories
const categories = [
  { _id: new ObjectId(), name: 'Salary', type: 'income', icon: '💰', color: '#10B981', description: 'Regular salary income' },
  { _id: new ObjectId(), name: 'Freelance', type: 'income', icon: '💼', color: '#059669', description: 'Freelance work income' },
  { _id: new ObjectId(), name: 'Investment', type: 'income', icon: '📈', color: '#0891B2', description: 'Investment returns' },
  { _id: new ObjectId(), name: 'Food & Dining', type: 'expense', icon: '🍽️', color: '#F59E0B', description: 'Restaurants, groceries, food delivery' },
  { _id: new ObjectId(), name: 'Transportation', type: 'expense', icon: '🚗', color: '#3B82F6', description: 'Gas, public transport, ride-sharing' },
  { _id: new ObjectId(), name: 'Utilities', type: 'expense', icon: '⚡', color: '#EF4444', description: 'Electricity, water, internet, phone' },
  { _id: new ObjectId(), name: 'Healthcare', type: 'expense', icon: '🏥', color: '#10B981', description: 'Medical expenses, insurance' },
  { _id: new ObjectId(), name: 'Entertainment', type: 'expense', icon: '🎬', color: '#8B5CF6', description: 'Movies, games, subscriptions' },
  { _id: new ObjectId(), name: 'Shopping', type: 'expense', icon: '🛍️', color: '#EC4899', description: 'Clothing, electronics, misc purchases' },
  { _id: new ObjectId(), name: 'Education', type: 'expense', icon: '📚', color: '#F97316', description: 'Courses, books, training' },
  { _id: new ObjectId(), name: 'Travel', type: 'expense', icon: '✈️', color: '#06B6D4', description: 'Vacation, business travel' },
  { _id: new ObjectId(), name: 'Insurance', type: 'expense', icon: '🛡️', color: '#6366F1', description: 'Life, auto, home insurance' },
];

// Sample transactions generator
const generateTransactions = (userId, categories) => {
  const transactions = [];
  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  // Generate monthly salary (last 3 months)
  for (let month = 0; month < 3; month++) {
    const salaryDate = new Date(now.getFullYear(), now.getMonth() - month, 1);
    salaryDate.setDate(1); // First of month

    transactions.push({
      _id: new ObjectId(),
      userId: userId,
      amount: 5000 + Math.random() * 500, // $5000-5500
      description: 'Monthly Salary',
      category: 'Salary',
      categoryId: incomeCategories.find(c => c.name === 'Salary')._id,
      type: 'income',
      date: salaryDate.toISOString(),
      merchant: 'Tech Corporation Inc',
      paymentMethod: 'Direct Deposit',
      tags: ['salary', 'monthly', 'regular'],
      notes: 'Regular monthly salary payment',
      recurring: {
        isRecurring: true,
        frequency: 'monthly',
        nextDate: new Date(salaryDate.getFullYear(), salaryDate.getMonth() + 1, 1).toISOString()
      },
      createdAt: salaryDate.toISOString(),
      updatedAt: salaryDate.toISOString(),
    });
  }

  // Generate freelance income (2-3 random payments)
  for (let i = 0; i < 3; i++) {
    transactions.push({
      _id: new ObjectId(),
      userId: userId,
      amount: 800 + Math.random() * 1200, // $800-2000
      description: `Freelance Project ${i + 1}`,
      category: 'Freelance',
      categoryId: incomeCategories.find(c => c.name === 'Freelance')._id,
      type: 'income',
      date: getRandomDateInRange(60).toISOString(),
      merchant: `Client ${String.fromCharCode(65 + i)}`,
      paymentMethod: 'Bank Transfer',
      tags: ['freelance', 'project', 'additional-income'],
      notes: `Payment for freelance web development project`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // Generate expense transactions
  const expenseData = [
    // Food & Dining
    { category: 'Food & Dining', merchants: ['Whole Foods', 'Starbucks', 'McDonald\'s', 'Local Bistro', 'DoorDash'], amounts: [15, 150], frequency: 15 },
    // Transportation
    { category: 'Transportation', merchants: ['Shell Gas', 'Metro Card', 'Uber', 'Car Insurance'], amounts: [25, 120], frequency: 8 },
    // Utilities
    { category: 'Utilities', merchants: ['Electric Company', 'Internet Provider', 'Phone Bill', 'Water Dept'], amounts: [50, 200], frequency: 4 },
    // Healthcare
    { category: 'Healthcare', merchants: ['City Hospital', 'Pharmacy', 'Dental Clinic', 'Health Insurance'], amounts: [30, 300], frequency: 3 },
    // Entertainment
    { category: 'Entertainment', merchants: ['Netflix', 'Spotify', 'Movie Theater', 'Game Store'], amounts: [10, 80], frequency: 6 },
    // Shopping
    { category: 'Shopping', merchants: ['Amazon', 'Target', 'Best Buy', 'Fashion Store'], amounts: [20, 300], frequency: 5 },
    // Education
    { category: 'Education', merchants: ['Online Course', 'Bookstore', 'Conference', 'Certification'], amounts: [50, 400], frequency: 2 },
    // Travel
    { category: 'Travel', merchants: ['Airline', 'Hotel', 'Rental Car', 'Travel Insurance'], amounts: [100, 800], frequency: 1 },
  ];

  expenseData.forEach(({ category, merchants, amounts, frequency }) => {
    const categoryData = expenseCategories.find(c => c.name === category);
    if (!categoryData) return;

    for (let i = 0; i < frequency; i++) {
      const merchant = merchants[Math.floor(Math.random() * merchants.length)];
      const amount = amounts[0] + Math.random() * (amounts[1] - amounts[0]);

      transactions.push({
        _id: new ObjectId(),
        userId: userId,
        amount: -Math.round(amount * 100) / 100, // Negative for expenses
        description: merchant,
        category: category,
        categoryId: categoryData._id,
        type: 'expense',
        date: getRandomDateInRange(90).toISOString(),
        merchant: merchant,
        paymentMethod: ['Credit Card', 'Debit Card', 'Cash', 'Online Payment'][Math.floor(Math.random() * 4)],
        tags: category.toLowerCase().split(' '),
        notes: `Purchase from ${merchant}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  });

  // Sort by date (newest first)
  return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
};

// Financial goals
const generateGoals = (userId) => [
  {
    _id: new ObjectId(),
    userId: userId,
    title: 'Emergency Fund',
    description: 'Build an emergency fund to cover 6 months of expenses',
    targetAmount: 15000,
    currentAmount: 8500,
    targetDate: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000).toISOString(), // 8 months from now
    priority: 'high',
    status: 'active',
    category: 'Emergency',
    milestones: [
      { amount: 5000, reached: true, date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
      { amount: 10000, reached: false, date: null },
      { amount: 15000, reached: false, date: null }
    ],
    monthlyContribution: 500,
    autoSave: true,
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: new ObjectId(),
    userId: userId,
    title: 'European Vacation',
    description: 'Save for a 2-week trip to Europe including flights, hotels, and activities',
    targetAmount: 6000,
    currentAmount: 2100,
    targetDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString(), // 10 months from now
    priority: 'medium',
    status: 'active',
    category: 'Travel',
    milestones: [
      { amount: 2000, reached: true, date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
      { amount: 4000, reached: false, date: null },
      { amount: 6000, reached: false, date: null }
    ],
    monthlyContribution: 200,
    autoSave: false,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: new ObjectId(),
    userId: userId,
    title: 'New MacBook Pro',
    description: 'Save for a new MacBook Pro 16" for work and development',
    targetAmount: 3500,
    currentAmount: 1400,
    targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(), // 4 months from now
    priority: 'medium',
    status: 'active',
    category: 'Technology',
    milestones: [
      { amount: 1000, reached: true, date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() },
      { amount: 2500, reached: false, date: null },
      { amount: 3500, reached: false, date: null }
    ],
    monthlyContribution: 350,
    autoSave: true,
    createdAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Budget data
const generateBudgets = (userId, categories) => {
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return [
    {
      _id: new ObjectId(),
      userId: userId,
      category: 'Food & Dining',
      categoryId: expenseCategories.find(c => c.name === 'Food & Dining')._id,
      amount: 600,
      spent: 423.50,
      period: 'monthly',
      startDate: currentMonth.toISOString(),
      endDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString(),
      alerts: {
        at50Percent: true,
        at75Percent: true,
        at90Percent: true,
        overBudget: true
      },
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: new ObjectId(),
      userId: userId,
      category: 'Transportation',
      categoryId: expenseCategories.find(c => c.name === 'Transportation')._id,
      amount: 300,
      spent: 245.75,
      period: 'monthly',
      startDate: currentMonth.toISOString(),
      endDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString(),
      alerts: {
        at50Percent: true,
        at75Percent: true,
        at90Percent: true,
        overBudget: true
      },
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: new ObjectId(),
      userId: userId,
      category: 'Entertainment',
      categoryId: expenseCategories.find(c => c.name === 'Entertainment')._id,
      amount: 200,
      spent: 156.30,
      period: 'monthly',
      startDate: currentMonth.toISOString(),
      endDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString(),
      alerts: {
        at50Percent: true,
        at75Percent: true,
        at90Percent: true,
        overBudget: true
      },
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: new ObjectId(),
      userId: userId,
      category: 'Utilities',
      categoryId: expenseCategories.find(c => c.name === 'Utilities')._id,
      amount: 250,
      spent: 187.99,
      period: 'monthly',
      startDate: currentMonth.toISOString(),
      endDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString(),
      alerts: {
        at50Percent: true,
        at75Percent: true,
        at90Percent: true,
        overBudget: true
      },
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
};

// Monthly reports data
const generateMonthlyReports = (userId, transactions) => {
  const reports = [];

  for (let month = 0; month < 3; month++) {
    const reportDate = new Date(now.getFullYear(), now.getMonth() - month, 1);
    const startDate = new Date(reportDate.getFullYear(), reportDate.getMonth(), 1);
    const endDate = new Date(reportDate.getFullYear(), reportDate.getMonth() + 1, 0);

    // Filter transactions for this month
    const monthTransactions = transactions.filter(t => {
      const transDate = new Date(t.date);
      return transDate >= startDate && transDate <= endDate;
    });

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = Math.abs(monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0));

    const netIncome = income - expenses;
    const savingsRate = income > 0 ? ((netIncome / income) * 100) : 0;

    // Category breakdown
    const categoryBreakdown = {};
    monthTransactions.forEach(t => {
      if (t.type === 'expense') {
        categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + Math.abs(t.amount);
      }
    });

    reports.push({
      _id: new ObjectId(),
      userId: userId,
      month: reportDate.getMonth() + 1,
      year: reportDate.getFullYear(),
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      summary: {
        totalIncome: Math.round(income * 100) / 100,
        totalExpenses: Math.round(expenses * 100) / 100,
        netIncome: Math.round(netIncome * 100) / 100,
        savingsRate: Math.round(savingsRate * 100) / 100,
        transactionCount: monthTransactions.length,
        avgTransactionAmount: monthTransactions.length > 0 ?
          Math.round((income + expenses) / monthTransactions.length * 100) / 100 : 0
      },
      categoryBreakdown: Object.entries(categoryBreakdown).map(([category, amount]) => ({
        category,
        amount: Math.round(amount * 100) / 100,
        percentage: Math.round((amount / expenses) * 100 * 100) / 100
      })).sort((a, b) => b.amount - a.amount),
      topExpenses: monthTransactions
        .filter(t => t.type === 'expense')
        .sort((a, b) => a.amount - b.amount) // Most negative first
        .slice(0, 5)
        .map(t => ({
          description: t.description,
          amount: Math.abs(t.amount),
          category: t.category,
          date: t.date
        })),
      insights: [
        expenses > income ? 'Spending exceeded income this month' : 'Positive cash flow this month',
        savingsRate > 20 ? 'Great savings rate!' : savingsRate > 10 ? 'Good savings rate' : 'Consider reducing expenses',
        `Largest expense category: ${Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None'}`
      ],
      createdAt: endDate.toISOString(),
      updatedAt: endDate.toISOString(),
    });
  }

  return reports;
};

async function seedDatabase() {
  let client;

  try {
    console.log('🌱 Starting database seeding...');
    console.log(`📡 Connecting to: ${MONGODB_URI}`);

    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    console.log(`📊 Using database: ${DB_NAME}`);

    // Hash password for test user
    const hashedPassword = await bcrypt.hash('test123', 12);
    testUser.password = hashedPassword;

    console.log('\n🧹 Clearing existing data...');
    await Promise.all([
      db.collection('users').deleteMany({}),
      db.collection('transactions').deleteMany({}),
      db.collection('goals').deleteMany({}),
      db.collection('budgets').deleteMany({}),
      db.collection('categories').deleteMany({}),
      db.collection('monthlyReports').deleteMany({})
    ]);

    console.log('✅ Existing data cleared');

    console.log('\n📥 Inserting sample data...');

    // Insert categories
    await db.collection('categories').insertMany(categories);
    console.log(`📂 Inserted ${categories.length} categories`);

    // Insert test user
    await db.collection('users').insertOne(testUser);
    console.log('👤 Inserted test user');

    // Generate and insert transactions
    const transactions = generateTransactions(testUser._id, categories);
    await db.collection('transactions').insertMany(transactions);
    console.log(`💳 Inserted ${transactions.length} transactions`);

    // Insert goals
    const goals = generateGoals(testUser._id);
    await db.collection('goals').insertMany(goals);
    console.log(`🎯 Inserted ${goals.length} financial goals`);

    // Insert budgets
    const budgets = generateBudgets(testUser._id, categories);
    await db.collection('budgets').insertMany(budgets);
    console.log(`💰 Inserted ${budgets.length} budgets`);

    // Generate and insert monthly reports
    const monthlyReports = generateMonthlyReports(testUser._id, transactions);
    await db.collection('monthlyReports').insertMany(monthlyReports);
    console.log(`📊 Inserted ${monthlyReports.length} monthly reports`);

    // Create indexes for performance
    console.log('\n🔍 Creating database indexes...');
    await Promise.all([
      db.collection('users').createIndex({ email: 1 }, { unique: true }),
      db.collection('transactions').createIndex({ userId: 1, date: -1 }),
      db.collection('transactions').createIndex({ userId: 1, category: 1 }),
      db.collection('goals').createIndex({ userId: 1, status: 1 }),
      db.collection('budgets').createIndex({ userId: 1, period: 1 }),
      db.collection('monthlyReports').createIndex({ userId: 1, year: -1, month: -1 })
    ]);
    console.log('🔍 Database indexes created');

    // Calculate and display summary
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = Math.abs(transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0));
    const currentBalance = totalIncome - totalExpenses;

    console.log('\n📊 Seeding Summary:');
    console.log('==================');
    console.log(`Database: ${DB_NAME}`);
    console.log(`Test User: ${testUser.email} / password: test123`);
    console.log(`Categories: ${categories.length} financial categories`);
    console.log(`Transactions: ${transactions.length} sample transactions`);
    console.log(`  - Income: $${totalIncome.toFixed(2)}`);
    console.log(`  - Expenses: $${totalExpenses.toFixed(2)}`);
    console.log(`  - Balance: $${currentBalance.toFixed(2)}`);
    console.log(`Goals: ${goals.length} financial goals`);
    console.log(`Budgets: ${budgets.length} monthly budgets`);
    console.log(`Reports: ${monthlyReports.length} monthly reports`);

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n🚀 Next steps:');
    console.log('1. Start the app: npm run dev');
    console.log('2. Login with: test@financeapp.com / test123');
    console.log('3. Check health: http://localhost:3001/api/health');

  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('📡 MongoDB connection closed');
    }
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };