export default async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...');

  // Stop the MongoDB Memory Server
  const mongod = (global as any).__MONGOD__;
  if (mongod) {
    await mongod.stop();
    console.log('🛑 MongoDB Memory Server stopped');
  }

  // Clean up any lingering timers
  if (global.gc) {
    global.gc();
  }

  console.log('✅ Test environment cleanup complete');
}