'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  ArrowLeft,
  Wifi,
  Server,
  Shield,
  Clock,
  HelpCircle,
  Mail
} from 'lucide-react';
import { cn } from '../../lib/utils/cn';

export type ErrorType = 'network' | 'server' | 'authentication' | 'not-found' | 'timeout' | 'validation' | 'generic';
export type ErrorVariant = 'page' | 'card' | 'inline' | 'toast';

interface ErrorDisplayProps {
  type?: ErrorType;
  variant?: ErrorVariant;
  title?: string;
  message?: string;
  error?: Error | string;
  onRetry?: () => void | Promise<void>;
  onGoBack?: () => void;
  onGoHome?: () => void;
  retryText?: string;
  className?: string;
  showDetails?: boolean;
  canRetry?: boolean;
  retryCount?: number;
  maxRetries?: number;
  children?: React.ReactNode;
}

const errorConfig = {
  network: {
    icon: Wifi,
    title: 'Connection Error',
    message: 'Unable to connect to the server. Please check your internet connection and try again.',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  server: {
    icon: Server,
    title: 'Server Error',
    message: 'Something went wrong on our end. Our team has been notified and is working on a fix.',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  authentication: {
    icon: Shield,
    title: 'Authentication Required',
    message: 'You need to sign in to access this content. Please log in and try again.',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  'not-found': {
    icon: HelpCircle,
    title: 'Content Not Found',
    message: 'The content you\'re looking for doesn\'t exist or has been moved.',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
  timeout: {
    icon: Clock,
    title: 'Request Timeout',
    message: 'The request took too long to complete. Please try again.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  validation: {
    icon: AlertTriangle,
    title: 'Validation Error',
    message: 'Please check your input and try again.',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  generic: {
    icon: AlertTriangle,
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
};

export default function ErrorDisplay({
  type = 'generic',
  variant = 'card',
  title,
  message,
  error,
  onRetry,
  onGoBack,
  onGoHome,
  retryText = 'Try Again',
  className,
  showDetails = false,
  canRetry = true,
  retryCount = 0,
  maxRetries = 3,
  children,
}: ErrorDisplayProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  const config = errorConfig[type];
  const Icon = config.icon;

  const errorMessage = error instanceof Error ? error.message : error;
  const displayTitle = title || config.title;
  const displayMessage = message || config.message;

  const handleRetry = async () => {
    if (!onRetry || isRetrying) return;

    setIsRetrying(true);
    try {
      await onRetry();
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setIsRetrying(false);
    }
  };

  const shouldShowRetry = canRetry && onRetry && retryCount < maxRetries;

  // Inline variant for small errors
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center space-x-2 text-sm', config.color, className)}>
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span>{displayMessage}</span>
        {shouldShowRetry && (
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            {isRetrying ? 'Retrying...' : 'Retry'}
          </button>
        )}
      </div>
    );
  }

  // Toast variant for notifications
  if (variant === 'toast') {
    return (
      <div className={cn(
        'flex items-start space-x-3 p-4 rounded-lg border',
        config.bgColor,
        config.borderColor,
        className
      )}>
        <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.color)} />
        <div className="flex-1 min-w-0">
          <h4 className={cn('text-sm font-medium', config.color)}>{displayTitle}</h4>
          <p className="text-sm text-gray-600 mt-1">{displayMessage}</p>
          {shouldShowRetry && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="text-sm text-blue-600 hover:text-blue-700 underline mt-2"
            >
              {isRetrying ? 'Retrying...' : retryText}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Card variant
  if (variant === 'card') {
    return (
      <div className={cn(
        'bg-white rounded-lg shadow-soft border p-6',
        config.borderColor,
        className
      )}>
        <div className="flex items-start space-x-4">
          <div className={cn('p-2 rounded-lg', config.bgColor)}>
            <Icon className={cn('h-6 w-6', config.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900">{displayTitle}</h3>
            <p className="text-gray-600 mt-1">{displayMessage}</p>

            {showDetails && errorMessage && (
              <div className="mt-4">
                <button
                  onClick={() => setShowErrorDetails(!showErrorDetails)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  {showErrorDetails ? 'Hide' : 'Show'} details
                </button>
                {showErrorDetails && (
                  <pre className="mt-2 text-xs bg-gray-100 p-3 rounded border overflow-x-auto">
                    {errorMessage}
                  </pre>
                )}
              </div>
            )}

            {children && <div className="mt-4">{children}</div>}

            <div className="flex flex-wrap gap-3 mt-6">
              {shouldShowRetry && (
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {retryText}
                    </>
                  )}
                </button>
              )}

              {onGoBack && (
                <button
                  onClick={onGoBack}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </button>
              )}

              {onGoHome && (
                <button
                  onClick={onGoHome}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </button>
              )}
            </div>

            {retryCount > 0 && (
              <p className="text-xs text-gray-500 mt-4">
                Attempt {retryCount + 1} of {maxRetries + 1}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Page variant for full-page errors
  return (
    <div className={cn('min-h-[400px] flex items-center justify-center px-4', className)}>
      <div className="max-w-md w-full text-center">
        <div className={cn('mx-auto p-4 rounded-full w-20 h-20 flex items-center justify-center', config.bgColor)}>
          <Icon className={cn('h-10 w-10', config.color)} />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mt-6">{displayTitle}</h1>
        <p className="text-gray-600 mt-4">{displayMessage}</p>

        {showDetails && errorMessage && (
          <div className="mt-6">
            <button
              onClick={() => setShowErrorDetails(!showErrorDetails)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {showErrorDetails ? 'Hide' : 'Show'} technical details
            </button>
            {showErrorDetails && (
              <pre className="mt-3 text-xs bg-gray-100 p-4 rounded border text-left overflow-x-auto">
                {errorMessage}
              </pre>
            )}
          </div>
        )}

        {children && <div className="mt-6">{children}</div>}

        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
          {shouldShowRetry && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5 mr-2" />
                  {retryText}
                </>
              )}
            </button>
          )}

          {onGoHome && (
            <button
              onClick={onGoHome}
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Home className="h-5 w-5 mr-2" />
              Go Home
            </button>
          )}
        </div>

        {retryCount > 0 && (
          <p className="text-sm text-gray-500 mt-6">
            Attempt {retryCount + 1} of {maxRetries + 1}
          </p>
        )}
      </div>
    </div>
  );
}

// Specialized error components for common use cases
export function NetworkError({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  return (
    <ErrorDisplay
      type="network"
      variant="card"
      onRetry={onRetry}
      className={className}
    />
  );
}

export function ServerError({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  return (
    <ErrorDisplay
      type="server"
      variant="card"
      onRetry={onRetry}
      showDetails
      className={className}
    />
  );
}

export function NotFoundError({ onGoHome, className }: { onGoHome?: () => void; className?: string }) {
  return (
    <ErrorDisplay
      type="not-found"
      variant="page"
      onGoHome={onGoHome}
      canRetry={false}
      className={className}
    />
  );
}

export function AuthenticationError({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  return (
    <ErrorDisplay
      type="authentication"
      variant="card"
      onRetry={onRetry}
      retryText="Sign In"
      className={className}
    />
  );
}