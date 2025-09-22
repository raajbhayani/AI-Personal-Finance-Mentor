#!/usr/bin/env node

/**
 * Quick Database Initialization Script
 * A simplified version of setup-database.js for quick initialization
 */

const { setupDatabase } = require('./setup-database.js');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'ai-finance-mentor';

async function checkConnection() {
  console.log('🔍 Checking MongoDB connection...');

  let client;
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();

    // Test the connection
    await client.db(DB_NAME).admin().ping();
    console.log('✅ MongoDB connection successful');

    const db = client.db(DB_NAME);
    const collections = await db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} existing collections`);

    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);

    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n📚 Quick Fix:');
      console.log('MongoDB is not running. Start it with:');
      console.log('• macOS: brew services start mongodb-community');
      console.log('• Windows: net start MongoDB');
      console.log('• Linux: sudo systemctl start mongod');
    }

    return false;
  } finally {
    if (client) {
      await client.close();
    }
  }
}

async function init() {
  console.log('🚀 AI Personal Finance Mentor - Database Initialization');
  console.log('=====================================================\n');

  // Check if MongoDB is accessible
  const connected = await checkConnection();

  if (!connected) {
    console.log('\n❌ Cannot proceed without MongoDB connection');
    console.log('Please ensure MongoDB is running and try again');
    process.exit(1);
  }

  console.log('\n📥 Initializing database with sample data...');

  try {
    await setupDatabase();

    console.log('\n🎉 Database initialization completed!');
    console.log('\n🔗 Next steps:');
    console.log('1. Start the app: npm run dev');
    console.log('2. Check health: http://localhost:3001/api/health');
    console.log('3. Demo login: demo@financeapp.com / demo123');

  } catch (error) {
    console.error('\n❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

// Run initialization if called directly
if (require.main === module) {
  init().catch((error) => {
    console.error('❌ Initialization error:', error);
    process.exit(1);
  });
}

module.exports = { init, checkConnection };