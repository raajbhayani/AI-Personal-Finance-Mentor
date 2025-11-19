import React, { Suspense, ComponentType } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';
import { ComponentSkeleton } from '../Loading/ComponentSkeleton';

interface LazyComponentWrapperProps {
  fallback?: React.ReactNode;
  errorFallback?: (error: Error, errorId: string, retry: () => void) => React.ReactNode;
  retryable?: boolean;
  minLoadingTime?: number;
  className?: string;
}

// Higher-order component for lazy loading with error handling
export function withLazyLoading<P extends object>(
  Component: React.LazyExoticComponent<ComponentType<P>>,
  options: LazyComponentWrapperProps = {}
) {
  return function LazyComponent(props: P) {
    const {
      fallback = <ComponentSkeleton />,
      errorFallback,
      retryable = true,
      minLoadingTime = 200,
      className = '',
    } = options;

    // Add minimum loading time to prevent flash
    const [isMinTimeElapsed, setIsMinTimeElapsed] = React.useState(false);

    React.useEffect(() => {
      const timer = setTimeout(() => {
        setIsMinTimeElapsed(true);
      }, minLoadingTime);

      return () => clearTimeout(timer);
    }, [minLoadingTime]);

    const fallbackWithMinTime = isMinTimeElapsed ? fallback : <ComponentSkeleton />;

    const customErrorFallback = errorFallback || ((error: Error, errorId: string, retry: () => void) => (
      <div className={`lazy-error-fallback ${className}`} data-testid="lazy-load-error">
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load component</h3>
          <p className="text-gray-600 mb-4">
            There was an error loading this part of the application.
          </p>
          {retryable && (
            <button
              onClick={retry}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              data-testid="retry-lazy-load"
            >
              Try Again
            </button>
          )}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs text-red-600 whitespace-pre-wrap">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
        </div>
      </div>
    ));

    return (
      <ErrorBoundary
        fallback={customErrorFallback}
        enableRetry={retryable}
        level="component"
      >
        <Suspense fallback={fallbackWithMinTime}>
          <Component {...(props as any)} />
        </Suspense>
      </ErrorBoundary>
    );
  };
}

// Hook for dynamic imports with loading state
export function useLazyComponent<T>(
  importFn: () => Promise<{ default: T }>,
  deps: React.DependencyList = []
) {
  const [component, setComponent] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let isCancelled = false;

    const loadComponent = async () => {
      try {
        setLoading(true);
        setError(null);

        const module = await importFn();

        if (!isCancelled) {
          setComponent(module.default);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err as Error);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadComponent();

    return () => {
      isCancelled = true;
    };
  }, deps);

  const retry = React.useCallback(() => {
    setError(null);
    setComponent(null);
  }, []);

  return { component, loading, error, retry };
}

// Component for preloading lazy components
export const LazyPreloader: React.FC<{
  imports: Array<() => Promise<any>>;
  onComplete?: () => void;
}> = ({ imports, onComplete }) => {
  const [loadedCount, setLoadedCount] = React.useState(0);

  React.useEffect(() => {
    const preloadComponents = async () => {
      try {
        await Promise.all(
          imports.map(async (importFn, index) => {
            try {
              await importFn();
              setLoadedCount(prev => prev + 1);
            } catch (error) {
              console.warn(`Failed to preload component ${index}:`, error);
            }
          })
        );
        onComplete?.();
      } catch (error) {
        console.error('Error during component preloading:', error);
      }
    };

    preloadComponents();
  }, [imports, onComplete]);

  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-3 py-1 rounded text-sm">
        Preloaded: {loadedCount}/{imports.length}
      </div>
    );
  }

  return null;
};

// Utility for creating lazy components with default options
export function createLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options?: LazyComponentWrapperProps
) {
  const LazyComponent = React.lazy(importFn);
  return withLazyLoading(LazyComponent, options);
}

// Route-level lazy loading with chunk names
export function createLazyRoute<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  chunkName?: string
) {
  const LazyRoute = React.lazy(() => {
    // Add webpackChunkName comment for better bundle analysis
    if (chunkName && process.env.NODE_ENV === 'development') {
      console.log(`Loading chunk: ${chunkName}`);
    }
    return importFn();
  });

  return withLazyLoading(LazyRoute, {
    fallback: (
      <div className="min-h-screen flex items-center justify-center">
        <ComponentSkeleton variant="page" />
      </div>
    ),
    retryable: true,
    minLoadingTime: 300,
  });
}