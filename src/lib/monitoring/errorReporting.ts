import { BaseError, ErrorCode } from '../errors/customErrors';
import { logger } from '../logging/structuredLogger';

export interface ErrorReport {
  id: string;
  timestamp: string;
  error: {
    name: string;
    message: string;
    code?: ErrorCode;
    stack?: string;
    correlationId?: string;
  };
  context: {
    userId?: string;
    sessionId?: string;
    userAgent?: string;
    url?: string;
    ipAddress?: string;
    environment: string;
    version: string;
    platform: string;
  };
  user?: {
    id?: string;
    email?: string;
    role?: string;
    plan?: string;
  };
  request?: {
    method?: string;
    path?: string;
    query?: Record<string, any>;
    headers?: Record<string, string>;
    body?: any;
  };
  system?: {
    memory: NodeJS.MemoryUsage;
    uptime: number;
    loadAverage?: number[];
    cpuUsage?: NodeJS.CpuUsage;
  };
  breadcrumbs: ErrorBreadcrumb[];
  tags: string[];
  level: 'error' | 'warning' | 'info';
  fingerprint?: string;
}

export interface ErrorBreadcrumb {
  timestamp: string;
  type: 'navigation' | 'http' | 'user' | 'console' | 'error';
  category: string;
  message: string;
  data?: Record<string, any>;
  level: 'info' | 'warning' | 'error';
}

export interface ErrorMetrics {
  errorCount: number;
  uniqueErrors: number;
  errorRate: number;
  topErrors: Array<{
    code: ErrorCode;
    count: number;
    percentage: number;
  }>;
  trends: {
    hourly: number[];
    daily: number[];
    weekly: number[];
  };
  userImpact: {
    affectedUsers: number;
    totalUsers: number;
    impactRate: number;
  };
}

export class ErrorReportingService {
  private breadcrumbs: ErrorBreadcrumb[] = [];
  private maxBreadcrumbs = 100;
  private reportQueue: ErrorReport[] = [];
  private isProcessingQueue = false;
  private errorMetrics: Map<string, number> = new Map();
  private userErrors: Set<string> = new Set();

  constructor(
    private config: {
      endpoint?: string;
      apiKey?: string;
      projectId?: string;
      environment: string;
      version: string;
      enableBreadcrumbs: boolean;
      enableMetrics: boolean;
      maxQueueSize: number;
      flushInterval: number;
    }
  ) {
    // Start periodic queue processing
    setInterval(() => {
      this.processQueue();
    }, this.config.flushInterval);

    // Set up global error handlers
    this.setupGlobalErrorHandlers();
  }

  async reportError(
    error: Error | BaseError,
    context: Partial<ErrorReport['context']> = {},
    user?: ErrorReport['user'],
    request?: ErrorReport['request']
  ): Promise<string> {
    const reportId = this.generateReportId();

    try {
      const report: ErrorReport = {
        id: reportId,
        timestamp: new Date().toISOString(),
        error: this.formatError(error),
        context: {
          environment: this.config.environment,
          version: this.config.version,
          platform: process.platform,
          ...context,
        },
        user,
        request: this.sanitizeRequest(request),
        system: this.getSystemInfo(),
        breadcrumbs: this.config.enableBreadcrumbs ? [...this.breadcrumbs] : [],
        tags: this.generateTags(error, context),
        level: this.getErrorLevel(error),
        fingerprint: this.generateFingerprint(error),
      };

      // Add to queue for processing
      this.addToQueue(report);

      // Update metrics
      if (this.config.enableMetrics) {
        this.updateMetrics(error, user?.id);
      }

      // Log locally
      logger.error('Error reported', error, {
        correlationId: report.error.correlationId,
        metadata: {
          errorReport: true,
          reportId,
          fingerprint: report.fingerprint,
        },
      });

      return reportId;
    } catch (reportingError) {
      logger.error('Failed to create error report', reportingError as Error, {
        metadata: {
          originalError: error.message,
          reportingFailed: true,
        },
      });
      return reportId;
    }
  }

  addBreadcrumb(
    message: string,
    type: ErrorBreadcrumb['type'] = 'user',
    category: string = 'general',
    data?: Record<string, any>,
    level: ErrorBreadcrumb['level'] = 'info'
  ): void {
    if (!this.config.enableBreadcrumbs) {
      return;
    }

    const breadcrumb: ErrorBreadcrumb = {
      timestamp: new Date().toISOString(),
      type,
      category,
      message,
      data,
      level,
    };

    this.breadcrumbs.push(breadcrumb);

    // Keep only the most recent breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  async getErrorMetrics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<ErrorMetrics> {
    // In a real implementation, this would query a database or external service
    // For now, return mock data based on in-memory metrics

    const totalErrors = Array.from(this.errorMetrics.values()).reduce((sum, count) => sum + count, 0);
    const uniqueErrors = this.errorMetrics.size;

    const topErrors = Array.from(this.errorMetrics.entries())
      .map(([code, count]) => ({
        code: code as ErrorCode,
        count,
        percentage: (count / totalErrors) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      errorCount: totalErrors,
      uniqueErrors,
      errorRate: totalErrors / (24 * 60), // Errors per minute (assuming 24h window)
      topErrors,
      trends: {
        hourly: new Array(24).fill(0).map(() => Math.floor(Math.random() * 10)),
        daily: new Array(7).fill(0).map(() => Math.floor(Math.random() * 100)),
        weekly: new Array(4).fill(0).map(() => Math.floor(Math.random() * 700)),
      },
      userImpact: {
        affectedUsers: this.userErrors.size,
        totalUsers: 1000, // This would come from your user analytics
        impactRate: (this.userErrors.size / 1000) * 100,
      },
    };
  }

  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }

  setUser(user: ErrorReport['user']): void {
    this.addBreadcrumb(`User set: ${user?.email || user?.id}`, 'user', 'auth', user);
  }

  setContext(key: string, value: any): void {
    this.addBreadcrumb(`Context set: ${key}`, 'user', 'context', { [key]: value });
  }

  async flush(): Promise<void> {
    await this.processQueue();
  }

  private formatError(error: Error | BaseError): ErrorReport['error'] {
    if (error instanceof BaseError) {
      return {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack,
        correlationId: error.correlationId,
      };
    }

    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  private sanitizeRequest(request?: ErrorReport['request']): ErrorReport['request'] {
    if (!request) return undefined;

    const sensitiveFields = ['password', 'token', 'authorization', 'cookie', 'session'];

    const sanitizeObject = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;

      const sanitized = { ...obj };
      for (const key in sanitized) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof sanitized[key] === 'object') {
          sanitized[key] = sanitizeObject(sanitized[key]);
        }
      }
      return sanitized;
    };

    return {
      method: request.method,
      path: request.path,
      query: sanitizeObject(request.query),
      headers: sanitizeObject(request.headers),
      body: sanitizeObject(request.body),
    };
  }

  private getSystemInfo(): ErrorReport['system'] {
    const system: ErrorReport['system'] = {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
    };

    try {
      const os = require('os');
      system.loadAverage = os.loadavg();
      system.cpuUsage = process.cpuUsage();
    } catch {
      // OS module not available in some environments
    }

    return system;
  }

  private generateTags(error: Error | BaseError, context: any): string[] {
    const tags: string[] = [
      `env:${this.config.environment}`,
      `version:${this.config.version}`,
      `platform:${process.platform}`,
    ];

    if (error instanceof BaseError) {
      tags.push(`error_code:${error.code}`);
      tags.push(`operational:${error.isOperational}`);
    }

    if (context.userId) {
      tags.push('has_user');
    }

    if (context.url) {
      const url = new URL(context.url, 'https://example.com');
      tags.push(`route:${url.pathname}`);
    }

    // Add browser/device tags if available
    if (context.userAgent) {
      if (context.userAgent.includes('Mobile')) {
        tags.push('device:mobile');
      } else if (context.userAgent.includes('Chrome')) {
        tags.push('browser:chrome');
      } else if (context.userAgent.includes('Firefox')) {
        tags.push('browser:firefox');
      } else if (context.userAgent.includes('Safari')) {
        tags.push('browser:safari');
      }
    }

    return tags;
  }

  private getErrorLevel(error: Error | BaseError): ErrorReport['level'] {
    if (error instanceof BaseError) {
      if (!error.isOperational) {
        return 'error';
      }

      if (error.statusCode >= 500) {
        return 'error';
      } else if (error.statusCode >= 400) {
        return 'warning';
      }
    }

    // Default to error for unknown errors
    return 'error';
  }

  private generateFingerprint(error: Error | BaseError): string {
    let fingerprint = `${error.name}:${error.message}`;

    if (error instanceof BaseError) {
      fingerprint = `${error.code}:${error.name}`;
    }

    // Create a hash of the fingerprint for consistent grouping
    const crypto = require('crypto');
    return crypto.createHash('md5').update(fingerprint).digest('hex');
  }

  private generateReportId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addToQueue(report: ErrorReport): void {
    this.reportQueue.push(report);

    // Prevent queue from growing too large
    if (this.reportQueue.length > this.config.maxQueueSize) {
      this.reportQueue.shift(); // Remove oldest report
      logger.warn('Error report queue is full, dropping oldest report');
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.reportQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      const reports = [...this.reportQueue];
      this.reportQueue = [];

      await Promise.all([
        this.sendToExternalService(reports),
        this.storeLocally(reports),
      ]);

      logger.debug(`Processed ${reports.length} error reports`);
    } catch (error) {
      logger.error('Failed to process error report queue', error as Error);
      // Re-add reports to queue for retry
      this.reportQueue.unshift(...this.reportQueue);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private async sendToExternalService(reports: ErrorReport[]): Promise<void> {
    if (!this.config.endpoint || !this.config.apiKey) {
      return;
    }

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-Project-ID': this.config.projectId || '',
        },
        body: JSON.stringify({ reports }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      logger.error('Failed to send error reports to external service', error as Error);
      throw error;
    }
  }

  private async storeLocally(reports: ErrorReport[]): Promise<void> {
    // Store reports locally for backup/debugging
    try {
      const fs = require('fs').promises;
      const path = require('path');

      const logDir = './logs/errors';
      await fs.mkdir(logDir, { recursive: true });

      const filename = `errors-${new Date().toISOString().split('T')[0]}.json`;
      const filepath = path.join(logDir, filename);

      // Append reports to daily log file
      const existingData = await fs.readFile(filepath, 'utf8').catch(() => '[]');
      const existingReports = JSON.parse(existingData);
      const allReports = [...existingReports, ...reports];

      await fs.writeFile(filepath, JSON.stringify(allReports, null, 2));
    } catch (error) {
      logger.error('Failed to store error reports locally', error as Error);
    }
  }

  private updateMetrics(error: Error | BaseError, userId?: string): void {
    const errorCode = error instanceof BaseError ? error.code : 'UNKNOWN_ERROR';

    const currentCount = this.errorMetrics.get(errorCode) || 0;
    this.errorMetrics.set(errorCode, currentCount + 1);

    if (userId) {
      this.userErrors.add(userId);
    }
  }

  private setupGlobalErrorHandlers(): void {
    // Browser error handlers
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.addBreadcrumb(
          `Global error: ${event.error?.message || event.message}`,
          'error',
          'javascript',
          {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
          'error'
        );

        this.reportError(event.error || new Error(event.message), {
          url: window.location.href,
          userAgent: navigator.userAgent,
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.addBreadcrumb(
          'Unhandled promise rejection',
          'error',
          'promise',
          { reason: event.reason },
          'error'
        );

        const error = event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason));

        this.reportError(error, {
          url: window.location.href,
          userAgent: navigator.userAgent,
        });
      });
    }
  }
}

// Global error reporting service
export const errorReporting = new ErrorReportingService({
  endpoint: process.env.ERROR_REPORTING_ENDPOINT,
  apiKey: process.env.ERROR_REPORTING_API_KEY,
  projectId: process.env.ERROR_REPORTING_PROJECT_ID,
  environment: process.env.NODE_ENV || 'development',
  version: process.env.npm_package_version || '1.0.0',
  enableBreadcrumbs: process.env.NODE_ENV !== 'test',
  enableMetrics: true,
  maxQueueSize: 100,
  flushInterval: 30000, // 30 seconds
});

// Convenience functions
export const reportError = errorReporting.reportError.bind(errorReporting);
export const addBreadcrumb = errorReporting.addBreadcrumb.bind(errorReporting);
export const setUser = errorReporting.setUser.bind(errorReporting);
export const setContext = errorReporting.setContext.bind(errorReporting);
export const getErrorMetrics = errorReporting.getErrorMetrics.bind(errorReporting);

// React hook for error reporting
export const useErrorReporting = () => {
  const reportError = React.useCallback(
    (error: Error, context?: any) => errorReporting.reportError(error, context),
    []
  );

  const addBreadcrumb = React.useCallback(
    (message: string, category?: string, data?: any) =>
      errorReporting.addBreadcrumb(message, 'user', category, data),
    []
  );

  React.useEffect(() => {
    // Add navigation breadcrumb
    errorReporting.addBreadcrumb(
      `Navigation to ${window.location.pathname}`,
      'navigation',
      'route'
    );
  }, []);

  return {
    reportError,
    addBreadcrumb,
    setUser: errorReporting.setUser.bind(errorReporting),
    setContext: errorReporting.setContext.bind(errorReporting),
  };
};

export default ErrorReportingService;