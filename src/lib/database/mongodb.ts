import mongoose from 'mongoose';
import { config } from '../../config';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

const connectionOptions: mongoose.ConnectOptions = {
  bufferCommands: false,
  dbName: config.database.name,
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  retryReads: true,
  compressors: ['zlib'],
};

function getDatabaseErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Check for specific MongoDB connection errors
    if (error.message.includes('ECONNREFUSED')) {
      return 'MongoDB server is not running. Please start MongoDB or check your MONGODB_URI in .env.local';
    }
    if (error.message.includes('authentication failed')) {
      return 'MongoDB authentication failed. Please check your username/password in MONGODB_URI';
    }
    if (error.message.includes('Invalid scheme')) {
      return 'Invalid MongoDB connection string. Please check your MONGODB_URI format in .env.local';
    }
    if (error.message.includes('Server selection timed out')) {
      return 'Cannot connect to MongoDB server. Check if MongoDB is running and accessible at the specified URI';
    }
    return error.message;
  }
  return 'Unknown database connection error';
}

function logDatabaseHelp(): void {
  console.log('\n📚 Database Setup Help:');
  console.log('1. Install MongoDB locally: https://docs.mongodb.com/manual/installation/');
  console.log('2. Or use MongoDB Atlas: https://www.mongodb.com/cloud/atlas');
  console.log('3. Update MONGODB_URI in your .env.local file');
  console.log('4. For local MongoDB: mongodb://localhost:27017/ai-finance-mentor');
  console.log('5. For Atlas: mongodb+srv://username:password@cluster.mongodb.net/ai-finance-mentor\n');
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  // Check if environment variables are properly configured
  if (!config.database.uri || config.database.uri.includes('your-') || config.database.uri === 'mongodb://localhost:27017/ai-finance-mentor') {
    console.warn('⚠️  Using default MongoDB URI. Please configure MONGODB_URI in .env.local');
  }

  if (cached.conn) {
    if (cached.conn.connection.readyState === 1) {
      return cached.conn;
    } else {
      cached.conn = null;
      cached.promise = null;
    }
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(config.database.uri, connectionOptions).then((mongoose) => {
      console.log('🗄️  MongoDB connected successfully');
      console.log(`📊 Database: ${config.database.name}`);
      console.log(`🔗 URI: ${config.database.uri.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials in logs

      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', getDatabaseErrorMessage(error));
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB disconnected');
        cached.conn = null;
        cached.promise = null;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnected');
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        try {
          await mongoose.connection.close();
          console.log('🗄️  MongoDB connection closed through app termination');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during graceful shutdown:', error);
          process.exit(1);
        }
      });

      return mongoose;
    }).catch((error) => {
      cached.promise = null;
      const errorMessage = getDatabaseErrorMessage(error);
      console.error('❌ MongoDB connection failed:', errorMessage);
      logDatabaseHelp();
      throw new Error(`Database connection failed: ${errorMessage}`);
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    const errorMessage = getDatabaseErrorMessage(e);
    console.error('❌ MongoDB connection error:', errorMessage);
    throw new Error(`Failed to connect to MongoDB: ${errorMessage}`);
  }

  return cached.conn;
}

export async function disconnectFromDatabase(): Promise<void> {
  if (cached.conn) {
    try {
      await cached.conn.disconnect();
      console.log('🗄️  MongoDB disconnected successfully');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
    } finally {
      cached.conn = null;
      cached.promise = null;
    }
  }
}

export function getConnectionState(): number {
  return cached.conn?.connection.readyState || 0;
}

export function isConnected(): boolean {
  return getConnectionState() === 1;
}

export default connectToDatabase;