/**
 * Database Connection Validator Utility
 * Provides health checks and connection validation for MongoDB
 */

import { connectToDatabase, getConnectionState, isConnected } from '../database/mongodb';
import { config } from '../../config';

export interface DatabaseHealthCheck {
  status: 'healthy' | 'unhealthy' | 'warning';
  connected: boolean;
  database: string;
  connectionState: string;
  responseTime: number;
  collections?: {
    name: string;
    count: number;
  }[];
  indexes?: {
    collection: string;
    indexes: string[];
  }[];
  lastCheck: string;
  errors?: string[];
}

export interface CollectionInfo {
  name: string;
  count: number;
  size?: number;
  indexes?: string[];
}

const CONNECTION_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
  99: 'uninitialized',
};

export async function validateDatabaseConnection(): Promise<DatabaseHealthCheck> {
  const startTime = Date.now();
  const result: DatabaseHealthCheck = {
    status: 'unhealthy',
    connected: false,
    database: config.database.name,
    connectionState: 'unknown',
    responseTime: 0,
    lastCheck: new Date().toISOString(),
    errors: [],
  };

  try {
    // Check basic connection
    const mongoose = await connectToDatabase();
    const connectionState = getConnectionState();

    result.connected = isConnected();
    result.connectionState = CONNECTION_STATES[connectionState as keyof typeof CONNECTION_STATES] || 'unknown';
    result.responseTime = Date.now() - startTime;

    if (!result.connected) {
      result.errors?.push('Database is not connected');
      return result;
    }

    // Test database operations
    try {
      // Get database instance
      const db = mongoose.connection.db;

      // Test basic database operation
      await db.admin().ping();

      // Get collections info
      const collections = await getCollectionsInfo(db);
      result.collections = collections;

      // Get indexes info
      const indexes = await getIndexesInfo(db);
      result.indexes = indexes;

      // Determine health status
      if (collections.length === 0) {
        result.status = 'warning';
        result.errors?.push('No collections found - database may not be initialized');
      } else {
        result.status = 'healthy';
      }

    } catch (dbError) {
      result.errors?.push(`Database operation failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
    }

  } catch (error) {
    result.errors?.push(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    result.responseTime = Date.now() - startTime;
  }

  return result;
}

async function getCollectionsInfo(db: any): Promise<CollectionInfo[]> {
  try {
    const collections = await db.listCollections().toArray();
    const collectionsInfo: CollectionInfo[] = [];

    for (const collection of collections) {
      try {
        const count = await db.collection(collection.name).countDocuments();
        const stats = await db.collection(collection.name).stats().catch(() => null);

        collectionsInfo.push({
          name: collection.name,
          count,
          size: stats?.size || undefined,
        });
      } catch (error) {
        collectionsInfo.push({
          name: collection.name,
          count: -1, // Indicates error
        });
      }
    }

    return collectionsInfo;
  } catch (error) {
    return [];
  }
}

async function getIndexesInfo(db: any): Promise<{ collection: string; indexes: string[] }[]> {
  try {
    const collections = await db.listCollections().toArray();
    const indexesInfo = [];

    for (const collection of collections) {
      try {
        const indexes = await db.collection(collection.name).listIndexes().toArray();
        const indexNames = indexes.map((index: any) => index.name);

        indexesInfo.push({
          collection: collection.name,
          indexes: indexNames,
        });
      } catch (error) {
        // Skip collections that can't be accessed
      }
    }

    return indexesInfo;
  } catch (error) {
    return [];
  }
}

export async function checkRequiredCollections(): Promise<{
  missing: string[];
  present: string[];
  status: 'complete' | 'partial' | 'missing';
}> {
  const requiredCollections = ['users', 'transactions', 'goals', 'budgets', 'categories'];
  const result = {
    missing: [] as string[],
    present: [] as string[],
    status: 'missing' as 'complete' | 'partial' | 'missing',
  };

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    const existingCollections = await db.listCollections().toArray();
    const existingNames = existingCollections.map(col => col.name);

    for (const collection of requiredCollections) {
      if (existingNames.includes(collection)) {
        result.present.push(collection);
      } else {
        result.missing.push(collection);
      }
    }

    if (result.missing.length === 0) {
      result.status = 'complete';
    } else if (result.present.length > 0) {
      result.status = 'partial';
    } else {
      result.status = 'missing';
    }

  } catch (error) {
    result.missing = requiredCollections;
  }

  return result;
}

export async function testDatabaseOperations(): Promise<{
  read: boolean;
  write: boolean;
  errors: string[];
}> {
  const result = {
    read: false,
    write: false,
    errors: [] as string[],
  };

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    // Test read operation
    try {
      await db.collection('users').findOne({});
      result.read = true;
    } catch (error) {
      result.errors.push(`Read test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test write operation (insert and delete a test document)
    try {
      const testDoc = { _id: 'health_check_test', timestamp: new Date() };
      await db.collection('health_checks').insertOne(testDoc);
      await db.collection('health_checks').deleteOne({ _id: 'health_check_test' });
      result.write = true;
    } catch (error) {
      result.errors.push(`Write test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

  } catch (error) {
    result.errors.push(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

export function getDatabaseStatus(): {
  configured: boolean;
  connectionString: string;
  database: string;
  issues: string[];
} {
  const issues: string[] = [];

  // Check if MongoDB URI is configured
  if (!config.database.uri) {
    issues.push('MONGODB_URI not configured');
  } else if (config.database.uri.includes('your-') || config.database.uri === 'mongodb://localhost:27017/ai-finance-mentor') {
    issues.push('Using default MongoDB URI - please configure for production');
  }

  // Check if database name is configured
  if (!config.database.name) {
    issues.push('Database name not configured');
  }

  return {
    configured: issues.length === 0,
    connectionString: config.database.uri ? config.database.uri.replace(/\/\/.*@/, '//***:***@') : 'Not configured',
    database: config.database.name,
    issues,
  };
}

export default {
  validateDatabaseConnection,
  checkRequiredCollections,
  testDatabaseOperations,
  getDatabaseStatus,
};