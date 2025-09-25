import React, { Suspense, ComponentType, lazy } from 'react';
import { ComponentSkeleton } from '@/components/Loading/ComponentSkeleton';

interface LazyComponentOptions {
  fallback?: React.ComponentType;
  delay?: number;
  retryAttempts?: number;
}

// Create a higher-order component for lazy loading with error boundaries
export function withLazyLoading<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: LazyComponentOptions = {}
) {
  const {
    fallback: Fallback = ComponentSkeleton,
    delay = 0,
    retryAttempts = 3,
  } = options;

  // Add retry logic for failed imports
  const loadComponentWithRetry = async (attempt = 1): Promise<{ default: ComponentType<P> }> => {
    try {
      return await importFn();
    } catch (error) {
      if (attempt < retryAttempts) {
        console.warn(`Failed to load component (attempt ${attempt}/${retryAttempts}), retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        return loadComponentWithRetry(attempt + 1);
      }
      throw error;
    }
  };

  // Add delay if specified
  const delayedImport = async () => {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    return loadComponentWithRetry();
  };

  const LazyComponent = lazy(delayedImport);

  return React.forwardRef<any, P>((props, ref) => (
    <Suspense fallback={<Fallback />}>
      <LazyComponent {...props} ref={ref} />
    </Suspense>
  ));
}

// Preload function for critical components
export function preloadComponent(importFn: () => Promise<any>) {
  if (typeof window !== 'undefined') {
    // Preload on next tick to avoid blocking initial render
    setTimeout(() => {
      importFn().catch(error => {
        console.warn('Failed to preload component:', error);
      });
    }, 0);
  }
}

// Intersection Observer based lazy loading
export function useLazyLoad(threshold = 0.1) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const elementRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element || hasLoaded) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setHasLoaded(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, hasLoaded]);

  return { isVisible, elementRef };
}

// Component for viewport-based lazy loading
export function LazyLoad({
  children,
  placeholder,
  threshold = 0.1,
  className = ''
}: {
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  threshold?: number;
  className?: string;
}) {
  const { isVisible, elementRef } = useLazyLoad(threshold);

  return (
    <div ref={elementRef} className={className}>
      {isVisible ? children : (placeholder || <ComponentSkeleton />)}
    </div>
  );
}

// Lazy load charts and heavy visualizations
export const LazyChart = withLazyLoading(
  () => import('@/components/charts/ChartContainer'),
  { fallback: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg" /> }
);

// Lazy load modal components
export const LazyModal = withLazyLoading(
  () => import('@/components/ui/Modal'),
  { fallback: () => <div className="fixed inset-0 bg-black bg-opacity-50 z-50" /> }
);

// Preload critical components on app load
export function preloadCriticalComponents() {
  if (typeof window !== 'undefined') {
    // Preload dashboard components
    preloadComponent(() => import('@/components/dashboard/Dashboard'));
    preloadComponent(() => import('@/components/dashboard/BalanceOverview'));

    // Preload navigation components
    preloadComponent(() => import('@/components/navigation/MobileBottomNav'));

    // Preload frequently used modals
    preloadComponent(() => import('@/components/transactions/AddTransactionModal'));
  }
}

// Route-based code splitting helper
export function createRouteComponent(importFn: () => Promise<{ default: ComponentType<any> }>) {
  return withLazyLoading(importFn, {
    fallback: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading page...</p>
        </div>
      </div>
    ),
  });
}