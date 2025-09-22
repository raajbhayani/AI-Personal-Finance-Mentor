import mongoose from 'mongoose';

async function globalTeardown() {
  console.log('🧹 Cleaning up E2E test environment...');

  try {
    // Close database connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }

    // Stop the MongoDB Memory Server
    const mongod = (global as any).__E2E_MONGOD__;
    if (mongod) {
      await mongod.stop();
      console.log('🛑 E2E MongoDB Memory Server stopped');
    }

    console.log('✅ E2E test environment cleanup complete');
  } catch (error) {
    console.error('❌ Error during E2E cleanup:', error);
  }
}

export default globalTeardown;