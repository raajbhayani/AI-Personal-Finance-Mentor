import { NextApiRequest, NextApiResponse } from 'next';
import {
  validateDatabaseConnection,
  checkRequiredCollections,
  testDatabaseOperations,
  getDatabaseStatus,
  type DatabaseHealthCheck
} from '../../lib/utils/dbValidator';
import { config } from '../../config';

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'warning';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  database: DatabaseHealthCheck;
  collections: {
    missing: string[];
    present: string[];
    status: 'complete' | 'partial' | 'missing';
  };
  operations: {
    read: boolean;
    write: boolean;
    errors: string[];
  };
  configuration: {
    configured: boolean;
    connectionString: string;
    database: string;
    issues: string[];
  };
  checks: {
    [key: string]: boolean;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<HealthCheckResponse>) {
  const startTime = Date.now();

  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: config.app.version,
        environment: process.env.NODE_ENV || 'unknown',
        uptime: process.uptime(),
        database: {
          status: 'unhealthy',
          connected: false,
          database: config.database.name,
          connectionState: 'unknown',
          responseTime: 0,
          lastCheck: new Date().toISOString(),
          errors: ['Method not allowed'],
        },
        collections: { missing: [], present: [], status: 'missing' },
        operations: { read: false, write: false, errors: ['Method not allowed'] },
        configuration: { configured: false, connectionString: '', database: '', issues: [] },
        checks: {},
      });
    }

    console.log('🔍 Starting health check...');

    // Run all health checks in parallel for better performance
    const [
      databaseHealth,
      collectionsCheck,
      operationsTest,
      configStatus
    ] = await Promise.allSettled([
      validateDatabaseConnection(),
      checkRequiredCollections(),
      testDatabaseOperations(),
      Promise.resolve(getDatabaseStatus())
    ]);

    // Extract results from Promise.allSettled
    const database: DatabaseHealthCheck = databaseHealth.status === 'fulfilled'
      ? databaseHealth.value
      : {
          status: 'unhealthy',
          connected: false,
          database: config.database.name,
          connectionState: 'error',
          responseTime: Date.now() - startTime,
          lastCheck: new Date().toISOString(),
          errors: [databaseHealth.status === 'rejected' ? databaseHealth.reason?.message || 'Unknown error' : 'Health check failed'],
        };

    const collections = collectionsCheck.status === 'fulfilled'
      ? collectionsCheck.value
      : { missing: [], present: [], status: 'missing' as const };

    const operations = operationsTest.status === 'fulfilled'
      ? operationsTest.value
      : { read: false, write: false, errors: ['Operations test failed'] };

    const configuration = configStatus.status === 'fulfilled'
      ? configStatus.value
      : { configured: false, connectionString: 'Error', database: 'Error', issues: ['Configuration check failed'] };

    // Determine overall status
    let overallStatus: 'healthy' | 'unhealthy' | 'warning' = 'healthy';

    const checks = {
      databaseConnected: database.connected,
      collectionsPresent: collections.status === 'complete',
      canRead: operations.read,
      canWrite: operations.write,
      properlyConfigured: configuration.configured,
    };

    // Determine overall health based on checks
    if (!checks.databaseConnected || !checks.canRead) {
      overallStatus = 'unhealthy';
    } else if (!checks.canWrite || !checks.collectionsPresent || !checks.properlyConfigured) {
      overallStatus = 'warning';
    }

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: config.app.version,
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      database,
      collections,
      operations,
      configuration,
      checks,
    };

    // Log health check result
    const responseTime = Date.now() - startTime;
    console.log(`🏥 Health check completed in ${responseTime}ms - Status: ${overallStatus}`);

    // Set appropriate HTTP status code
    const httpStatus = overallStatus === 'healthy' ? 200 : overallStatus === 'warning' ? 200 : 503;

    // Add headers for monitoring
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Health-Check-Duration', responseTime.toString());
    res.setHeader('X-Health-Status', overallStatus);

    return res.status(httpStatus).json(response);

  } catch (error) {
    console.error('❌ Health check failed:', error);

    const errorResponse: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: config.app.version,
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      database: {
        status: 'unhealthy',
        connected: false,
        database: config.database.name,
        connectionState: 'error',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      },
      collections: { missing: [], present: [], status: 'missing' },
      operations: { read: false, write: false, errors: [error instanceof Error ? error.message : 'Unknown error'] },
      configuration: getDatabaseStatus(),
      checks: {
        databaseConnected: false,
        collectionsPresent: false,
        canRead: false,
        canWrite: false,
        properlyConfigured: false,
      },
    };

    return res.status(503).json(errorResponse);
  }
}