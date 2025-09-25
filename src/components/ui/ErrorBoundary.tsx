'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import ErrorDisplay from './ErrorDisplay';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolate?: boolean;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Call the error callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error for development/monitoring
    console.error('Error caught by ErrorBoundary:', error, errorInfo);

    // You could send this to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error boundary when resetKeys change
    if (hasError && resetOnPropsChange && resetKeys) {
      const prevResetKeys = prevProps.resetKeys || [];
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevResetKeys[index]
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  resetErrorBoundary = () => {
    // Clear any pending reset timeout
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: this.state.retryCount + 1,
    });
  };

  handleRetry = () => {
    this.resetErrorBoundary();
  };

  handleGoHome = () => {
    // Navigate to home page
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
  };

  render() {
    const { children, fallback, isolate } = this.props;
    const { hasError, error, retryCount } = this.state;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, this.handleRetry);
      }

      // Determine error type based on error message/type
      let errorType: 'network' | 'server' | 'generic' = 'generic';
      if (error.message.includes('fetch') || error.message.includes('network')) {
        errorType = 'network';
      } else if (error.message.includes('server') || error.message.includes('500')) {
        errorType = 'server';
      }

      return (
        <ErrorDisplay
          type={errorType}
          variant={isolate ? 'card' : 'page'}
          error={error}
          onRetry={this.handleRetry}
          onGoHome={!isolate ? this.handleGoHome : undefined}
          showDetails={process.env.NODE_ENV === 'development'}
          retryCount={retryCount}
          maxRetries={3}
        />
      );
    }

    return children;
  }
}

// Higher-order component for wrapping components with error boundary
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

// Hook for manual error handling
export function useErrorHandler() {
  return (error: Error, errorInfo?: any) => {
    // In a real app, you might want to:
    // 1. Log to an error reporting service
    // 2. Show a toast notification
    // 3. Reset some global state

    console.error('Error handled:', error, errorInfo);

    // For now, we'll just rethrow to let error boundaries catch it
    throw error;
  };
}

// Specialized error boundaries for different contexts
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Page Error:', error, errorInfo);
        // Could send to analytics here
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

export function ComponentErrorBoundary({
  children,
  componentName
}: {
  children: ReactNode;
  componentName?: string;
}) {
  return (
    <ErrorBoundary
      isolate
      fallback={(error, retry) => (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">
            {componentName ? `${componentName} Error` : 'Component Error'}
          </h3>
          <p className="text-red-600 text-sm mt-1">
            This component encountered an error and couldn't render properly.
          </p>
          <button
            onClick={retry}
            className="mt-3 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
          >
            Try Again
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-3">
              <summary className="text-red-700 text-sm cursor-pointer">
                Error Details
              </summary>
              <pre className="text-xs bg-red-100 p-2 rounded mt-2 overflow-auto">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

export function AsyncErrorBoundary({
  children,
  resetKeys
}: {
  children: ReactNode;
  resetKeys?: Array<string | number>;
}) {
  return (
    <ErrorBoundary
      resetOnPropsChange
      resetKeys={resetKeys}
      fallback={(error, retry) => (
        <ErrorDisplay
          type="generic"
          variant="card"
          title="Loading Error"
          message="Failed to load this content. This might be due to a network issue or server error."
          error={error}
          onRetry={retry}
          showDetails={process.env.NODE_ENV === 'development'}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}