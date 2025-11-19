import React, { Component, ErrorInfo, ReactNode } from 'react';
import { BaseError, ErrorCode, SystemError } from '../lib/errors/customErrors';
import { logger } from '../lib/logging/structuredLogger';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorId: string, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  isolateErrors?: boolean;
  level?: 'page' | 'component' | 'feature';
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeouts: Set<NodeJS.Timeout> = new Set();

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component' } = this.props;
    const { errorId } = this.state;

    // Convert to BaseError if needed
    const baseError = error instanceof BaseError
      ? error
      : new SystemError(
          `React ${level} error: ${error.message}`,
          ErrorCode.INTERNAL_SERVER_ERROR,
          {
            correlationId: errorId || undefined,
            additionalData: {
              componentStack: errorInfo.componentStack,
              errorBoundary: level,
              retryCount: this.state.retryCount,
            },
          }
        );

    // Log the error with context
    logger.error('React Error Boundary caught error', baseError, {
      correlationId: errorId || undefined,
      metadata: {
        errorBoundary: true,
        level,
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      },
    });

    // Update state with error info
    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (onError && errorId) {
      try {
        onError(error, errorInfo, errorId);
      } catch (handlerError) {
        logger.error('Error in ErrorBoundary onError handler', handlerError as Error);
      }
    }

    // Report to error monitoring service
    this.reportError(baseError, errorInfo, errorId);
  }

  override componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
  }

  private reportError = async (error: BaseError, errorInfo: ErrorInfo, errorId: string | null) => {
    try {
      // Report to external error monitoring service
      if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT) {
        await fetch(process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            errorId,
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
              code: error instanceof BaseError ? error.code : 'UNKNOWN',
            },
            errorInfo,
            context: {
              url: window.location.href,
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString(),
              userId: this.getUserId(),
              sessionId: this.getSessionId(),
            },
          }),
        });
      }
    } catch (reportingError) {
      logger.error('Failed to report error to monitoring service', reportingError as Error);
    }
  };

  private getUserId = (): string | null => {
    try {
      // Get user ID from localStorage, context, or other state management
      return localStorage.getItem('userId') || null;
    } catch {
      return null;
    }
  };

  private getSessionId = (): string | null => {
    try {
      return sessionStorage.getItem('sessionId') || null;
    } catch {
      return null;
    }
  };

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      logger.warn('Maximum retry attempts reached', {
        metadata: {
          errorBoundary: true,
          retryCount,
          maxRetries,
        },
      });
      return;
    }

    logger.info('Retrying error boundary recovery', {
      metadata: {
        errorBoundary: true,
        retryCount: retryCount + 1,
        maxRetries,
      },
    });

    // Exponential backoff for retries
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);

    const timeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: retryCount + 1,
      });
      this.retryTimeouts.delete(timeout);
    }, delay);

    this.retryTimeouts.add(timeout);
  };

  private renderFallback = (): ReactNode => {
    const { fallback, enableRetry = true, maxRetries = 3, level = 'component' } = this.props;
    const { error, errorId, retryCount } = this.state;

    if (!error || !errorId) {
      return null;
    }

    // Use custom fallback if provided
    if (fallback) {
      return fallback(error, errorId, this.handleRetry);
    }

    // Default fallback UI
    return (
      <ErrorFallbackUI
        error={error}
        errorId={errorId}
        level={level}
        onRetry={enableRetry && retryCount < maxRetries ? this.handleRetry : undefined}
        retryCount={retryCount}
        maxRetries={maxRetries}
      />
    );
  };

  override render() {
    if (this.state.hasError) {
      return this.renderFallback();
    }

    return this.props.children;
  }
}

interface ErrorFallbackUIProps {
  error: Error;
  errorId: string;
  level: string;
  onRetry?: () => void;
  retryCount: number;
  maxRetries: number;
}

const ErrorFallbackUI: React.FC<ErrorFallbackUIProps> = ({
  error,
  errorId,
  level,
  onRetry,
  retryCount,
  maxRetries,
}) => {
  const isNetworkError = error.message.includes('fetch') || error.message.includes('network');
  const isChunkError = error.message.includes('chunk') || error.message.includes('Loading');

  const getErrorMessage = () => {
    if (isNetworkError) {
      return 'Connection problem detected. Please check your internet connection.';
    }
    if (isChunkError) {
      return 'The application has been updated. Please refresh the page.';
    }
    return 'Something went wrong. We\'re working to fix this issue.';
  };

  const getErrorIcon = () => {
    if (isNetworkError) return '🌐';
    if (isChunkError) return '🔄';
    return '⚠️';
  };

  return (
    <div className="error-boundary-fallback" style={{
      padding: '2rem',
      margin: '1rem',
      border: '2px solid #ef4444',
      borderRadius: '8px',
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      textAlign: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
        {getErrorIcon()}
      </div>

      <h3 style={{ margin: '0 0 1rem 0', color: '#991b1b' }}>
        {level === 'page' ? 'Page Error' : 'Component Error'}
      </h3>

      <p style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem' }}>
        {getErrorMessage()}
      </p>

      {process.env.NODE_ENV === 'development' && (
        <details style={{ marginBottom: '1rem', textAlign: 'left' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
            Technical Details
          </summary>
          <pre style={{
            margin: '0.5rem 0',
            padding: '1rem',
            backgroundColor: '#fee2e2',
            borderRadius: '4px',
            fontSize: '0.875rem',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {error.stack || error.message}
          </pre>
          <p style={{ fontSize: '0.875rem', color: '#7f1d1d' }}>
            Error ID: {errorId}
          </p>
        </details>
      )}

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#b91c1c';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
            }}
          >
            Try Again {retryCount > 0 && `(${retryCount}/${maxRetries})`}
          </button>
        )}

        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#4b5563';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#6b7280';
          }}
        >
          Refresh Page
        </button>

        {level === 'component' && (
          <button
            onClick={() => window.history.back()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              color: '#dc2626',
              border: '2px solid #dc2626',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
              e.currentTarget.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#dc2626';
            }}
          >
            Go Back
          </button>
        )}
      </div>

      {!onRetry && maxRetries > 0 && (
        <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#7f1d1d' }}>
          Maximum retry attempts reached. Please refresh the page or contact support.
        </p>
      )}
    </div>
  );
};

// Higher-order component for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Specialized error boundaries for different contexts
export const PageErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'level'>> = (props) => (
  <ErrorBoundary {...props} level="page" />
);

export const ComponentErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'level'>> = (props) => (
  <ErrorBoundary {...props} level="component" />
);

export const FeatureErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'level'>> = (props) => (
  <ErrorBoundary {...props} level="feature" />
);

// Hook for handling async errors in components
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    logger.error('Async error caught by useErrorHandler', error, {
      metadata: {
        hook: 'useErrorHandler',
        component: 'unknown',
      },
    });
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  // Throw error to be caught by error boundary
  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, clearError };
};

// Hook for retrying failed operations
export const useRetry = (maxRetries: number = 3) => {
  const [retryCount, setRetryCount] = React.useState(0);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const retry = React.useCallback(async (operation: () => Promise<void>) => {
    if (retryCount >= maxRetries) {
      throw new Error(`Maximum retry attempts (${maxRetries}) exceeded`);
    }

    setIsRetrying(true);
    try {
      await operation();
      setRetryCount(0); // Reset on success
    } catch (error) {
      setRetryCount(prev => prev + 1);
      throw error;
    } finally {
      setIsRetrying(false);
    }
  }, [retryCount, maxRetries]);

  const reset = React.useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  return {
    retry,
    reset,
    retryCount,
    isRetrying,
    canRetry: retryCount < maxRetries,
  };
};