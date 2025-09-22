import { ErrorCode, BaseError } from '../errors/customErrors';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace',
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  correlationId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    code?: ErrorCode;
    stack?: string;
    statusCode?: number;
    correlationId?: string;
    userMessage?: string;
    details?: any;
  };
  performance?: {
    duration: number;
    memory: NodeJS.MemoryUsage;
    cpu?: number;
  };
  service: string;
  version: string;
  environment: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  filePath?: string;
  remoteEndpoint?: string;
  apiKey?: string;
  service: string;
  version: string;
  environment: string;
  maxFileSize?: number;
  maxFiles?: number;
}

export class StructuredLogger {
  private config: LoggerConfig;
  private logQueue: LogEntry[] = [];
  private isProcessing = false;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: process.env.NODE_ENV === 'production',
      enableRemote: process.env.NODE_ENV === 'production',
      filePath: './logs/app.log',
      remoteEndpoint: process.env.LOG_ENDPOINT,
      apiKey: process.env.LOG_API_KEY,
      service: 'finance-mentor',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      ...config,
    };
  }

  error(message: string, error?: BaseError | Error, context: LogContext = {}): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  warn(message: string, context: LogContext = {}): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context: LogContext = {}): void {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context: LogContext = {}): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  trace(message: string, context: LogContext = {}): void {
    this.log(LogLevel.TRACE, message, context);
  }

  // Security-specific logging methods
  securityAlert(message: string, context: LogContext & {
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
    attackType?: string;
    blockedAction?: string;
  }): void {
    this.log(LogLevel.ERROR, `[SECURITY ALERT] ${message}`, {
      ...context,
      metadata: {
        ...context.metadata,
        securityEvent: true,
        threatLevel: context.threatLevel,
        attackType: context.attackType,
        blockedAction: context.blockedAction,
      },
    });
  }

  auditLog(action: string, context: LogContext & {
    resource?: string;
    resourceId?: string;
    changes?: Record<string, any>;
    success: boolean;
  }): void {
    this.log(LogLevel.INFO, `[AUDIT] ${action}`, {
      ...context,
      metadata: {
        ...context.metadata,
        auditEvent: true,
        action,
        resource: context.resource,
        resourceId: context.resourceId,
        changes: context.changes,
        success: context.success,
      },
    });
  }

  performanceLog(operation: string, duration: number, context: LogContext = {}): void {
    const performance = {
      duration,
      memory: process.memoryUsage(),
    };

    this.log(LogLevel.INFO, `[PERFORMANCE] ${operation}`, {
      ...context,
      metadata: {
        ...context.metadata,
        performanceEvent: true,
        operation,
      },
    }, undefined, performance);
  }

  businessEvent(event: string, context: LogContext & {
    category: string;
    value?: number;
    currency?: string;
    properties?: Record<string, any>;
  }): void {
    this.log(LogLevel.INFO, `[BUSINESS] ${event}`, {
      ...context,
      metadata: {
        ...context.metadata,
        businessEvent: true,
        category: context.category,
        value: context.value,
        currency: context.currency,
        properties: context.properties,
      },
    });
  }

  private log(
    level: LogLevel,
    message: string,
    context: LogContext = {},
    error?: BaseError | Error,
    performance?: { duration: number; memory: NodeJS.MemoryUsage }
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        correlationId: context.correlationId || this.generateCorrelationId(),
      },
      service: this.config.service,
      version: this.config.version,
      environment: this.config.environment,
    };

    if (error) {
      entry.error = this.formatError(error);
    }

    if (performance) {
      entry.performance = performance;
    }

    this.logQueue.push(entry);
    this.processLogQueue();
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG, LogLevel.TRACE];
    const configLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex <= configLevelIndex;
  }

  private formatError(error: BaseError | Error): LogEntry['error'] {
    if (error instanceof BaseError) {
      return {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack,
        statusCode: error.statusCode,
        correlationId: error.correlationId,
        userMessage: error.userMessage,
        details: {
          context: error.context,
          details: error.details,
          isOperational: error.isOperational,
        },
      };
    }

    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  private async processLogQueue(): Promise<void> {
    if (this.isProcessing || this.logQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const entries = [...this.logQueue];
      this.logQueue = [];

      await Promise.all([
        this.writeToConsole(entries),
        this.writeToFile(entries),
        this.writeToRemote(entries),
      ]);
    } catch (error) {
      console.error('Failed to process log queue:', error);
      // Re-add entries to queue if processing failed
      this.logQueue.unshift(...this.logQueue);
    } finally {
      this.isProcessing = false;
    }
  }

  private async writeToConsole(entries: LogEntry[]): Promise<void> {
    if (!this.config.enableConsole) {
      return;
    }

    entries.forEach(entry => {
      const logMethod = this.getConsoleMethod(entry.level);
      const coloredLevel = this.colorizeLevel(entry.level);
      const timestamp = entry.timestamp;
      const message = entry.message;
      const context = JSON.stringify(entry.context, null, 2);

      if (entry.error) {
        logMethod(`[${timestamp}] ${coloredLevel} ${message}\nContext: ${context}\nError:`, entry.error);
      } else {
        logMethod(`[${timestamp}] ${coloredLevel} ${message}\nContext: ${context}`);
      }
    });
  }

  private async writeToFile(entries: LogEntry[]): Promise<void> {
    if (!this.config.enableFile || !this.config.filePath) {
      return;
    }

    // In a real implementation, you would:
    // 1. Use a proper file system library with rotation
    // 2. Handle file size limits and archival
    // 3. Implement async file writing with proper error handling
    // 4. Use a library like winston or pino for production

    try {
      const fs = require('fs').promises;
      const path = require('path');

      // Ensure log directory exists
      const logDir = path.dirname(this.config.filePath);
      await fs.mkdir(logDir, { recursive: true });

      // Append entries to log file
      const logLines = entries.map(entry => JSON.stringify(entry) + '\n').join('');
      await fs.appendFile(this.config.filePath, logLines);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private async writeToRemote(entries: LogEntry[]): Promise<void> {
    if (!this.config.enableRemote || !this.config.remoteEndpoint) {
      return;
    }

    try {
      const response = await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({ logs: entries }),
      });

      if (!response.ok) {
        throw new Error(`Remote logging failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send logs to remote endpoint:', error);
      // In production, you might want to implement retry logic or fallback storage
    }
  }

  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.ERROR:
        return console.error;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.DEBUG:
      case LogLevel.TRACE:
        return console.debug;
      default:
        return console.log;
    }
  }

  private colorizeLevel(level: LogLevel): string {
    const colors = {
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.INFO]: '\x1b[36m',  // Cyan
      [LogLevel.DEBUG]: '\x1b[37m', // White
      [LogLevel.TRACE]: '\x1b[90m', // Gray
    };

    const reset = '\x1b[0m';
    return `${colors[level]}${level.toUpperCase()}${reset}`;
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Graceful shutdown - flush all pending logs
  async flush(): Promise<void> {
    if (this.logQueue.length > 0) {
      await this.processLogQueue();
    }
  }

  // Configure logger at runtime
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Get current configuration
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  // Get log statistics
  getStats(): {
    queueSize: number;
    isProcessing: boolean;
    config: LoggerConfig;
  } {
    return {
      queueSize: this.logQueue.size,
      isProcessing: this.isProcessing,
      config: this.getConfig(),
    };
  }
}

// Global logger instance
export const logger = new StructuredLogger();

// Convenience functions for common logging patterns
export const logError = (message: string, error?: BaseError | Error, context?: LogContext) => {
  logger.error(message, error, context);
};

export const logSecurityAlert = (
  message: string,
  threatLevel: 'low' | 'medium' | 'high' | 'critical',
  context?: LogContext & { attackType?: string; blockedAction?: string }
) => {
  logger.securityAlert(message, { ...context, threatLevel });
};

export const logAudit = (
  action: string,
  success: boolean,
  context?: LogContext & {
    resource?: string;
    resourceId?: string;
    changes?: Record<string, any>;
  }
) => {
  logger.auditLog(action, { ...context, success });
};

export const logPerformance = (operation: string, duration: number, context?: LogContext) => {
  logger.performanceLog(operation, duration, context);
};

export const logBusinessEvent = (
  event: string,
  category: string,
  context?: LogContext & {
    value?: number;
    currency?: string;
    properties?: Record<string, any>;
  }
) => {
  logger.businessEvent(event, { ...context, category });
};

// Request logging helper
export const createRequestLogger = (req: any) => {
  const correlationId = req.headers['x-correlation-id'] || logger.generateCorrelationId();
  const baseContext: LogContext = {
    correlationId,
    requestId: req.id,
    method: req.method,
    url: req.url,
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
    userId: req.user?.userId,
    sessionId: req.securityContext?.sessionId,
  };

  return {
    error: (message: string, error?: BaseError | Error, additionalContext?: LogContext) =>
      logger.error(message, error, { ...baseContext, ...additionalContext }),

    warn: (message: string, additionalContext?: LogContext) =>
      logger.warn(message, { ...baseContext, ...additionalContext }),

    info: (message: string, additionalContext?: LogContext) =>
      logger.info(message, { ...baseContext, ...additionalContext }),

    debug: (message: string, additionalContext?: LogContext) =>
      logger.debug(message, { ...baseContext, ...additionalContext }),

    audit: (action: string, success: boolean, additionalContext?: any) =>
      logger.auditLog(action, { ...baseContext, success, ...additionalContext }),

    performance: (operation: string, duration: number, additionalContext?: LogContext) =>
      logger.performanceLog(operation, duration, { ...baseContext, ...additionalContext }),

    correlationId,
  };
};

// Process-level error handlers
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error, {
    metadata: { processEvent: 'uncaughtException' }
  });

  // Graceful shutdown
  logger.flush().finally(() => {
    process.exit(1);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', reason as Error, {
    metadata: {
      processEvent: 'unhandledRejection',
      promise: promise.toString(),
    }
  });
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, starting graceful shutdown');
  logger.flush().finally(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, starting graceful shutdown');
  logger.flush().finally(() => {
    process.exit(0);
  });
});