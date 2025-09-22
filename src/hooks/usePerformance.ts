import { useState, useEffect, useCallback, useRef } from 'react';
import { performanceMonitor, PerformanceMetrics } from '../lib/performance/performanceMonitor';
import { bundleAnalyzer } from '../lib/performance/bundleAnalyzer';

interface UsePerformanceOptions {
  trackPageViews?: boolean;
  trackInteractions?: boolean;
  reportInterval?: number;
  enableWebVitals?: boolean;
}

interface PerformanceState {
  metrics: Partial<PerformanceMetrics>;
  isLoading: boolean;
  error: string | null;
  webVitalsScore: WebVitalsScore | null;
}

interface WebVitalsScore {
  lcp: 'good' | 'needs-improvement' | 'poor';
  fid: 'good' | 'needs-improvement' | 'poor';
  cls: 'good' | 'needs-improvement' | 'poor';
  overall: 'good' | 'needs-improvement' | 'poor';
}

export function usePerformance(options: UsePerformanceOptions = {}) {
  const {
    trackPageViews = true,
    trackInteractions = true,
    reportInterval = 30000, // 30 seconds
    enableWebVitals = true,
  } = options;

  const [state, setState] = useState<PerformanceState>({
    metrics: {},
    isLoading: false,
    error: null,
    webVitalsScore: null,
  });

  const metricsRef = useRef<Partial<PerformanceMetrics>>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate Web Vitals score
  const calculateWebVitalsScore = useCallback((metrics: Partial<PerformanceMetrics>): WebVitalsScore | null => {
    if (!metrics.vitals) return null;

    const { lcp, fid, cls } = metrics.vitals;

    const lcpScore = lcp ? (lcp <= 2500 ? 'good' : lcp <= 4000 ? 'needs-improvement' : 'poor') : 'good';
    const fidScore = fid ? (fid <= 100 ? 'good' : fid <= 300 ? 'needs-improvement' : 'poor') : 'good';
    const clsScore = cls ? (cls <= 0.1 ? 'good' : cls <= 0.25 ? 'needs-improvement' : 'poor') : 'good';

    const scores = [lcpScore, fidScore, clsScore];
    const goodCount = scores.filter(score => score === 'good').length;
    const poorCount = scores.filter(score => score === 'poor').length;

    let overall: 'good' | 'needs-improvement' | 'poor';
    if (goodCount === 3) {
      overall = 'good';
    } else if (poorCount > 0) {
      overall = 'poor';
    } else {
      overall = 'needs-improvement';
    }

    return {
      lcp: lcpScore,
      fid: fidScore,
      cls: clsScore,
      overall,
    };
  }, []);

  // Update metrics state
  const updateMetrics = useCallback(() => {
    try {
      const metrics = performanceMonitor.getMetrics();
      metricsRef.current = metrics;

      const webVitalsScore = enableWebVitals ? calculateWebVitalsScore(metrics) : null;

      setState(prev => ({
        ...prev,
        metrics,
        webVitalsScore,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [calculateWebVitalsScore, enableWebVitals]);

  // Track page view performance
  const trackPageView = useCallback((pageName: string) => {
    if (!trackPageViews) return;

    performanceMonitor.startMark(`page-${pageName}`);

    // Track page load completion
    if (document.readyState === 'complete') {
      const duration = performanceMonitor.endMark(`page-${pageName}`);
      performanceMonitor.trackCustomMetric(`page-load-${pageName}`, duration);
    } else {
      window.addEventListener('load', () => {
        const duration = performanceMonitor.endMark(`page-${pageName}`);
        performanceMonitor.trackCustomMetric(`page-load-${pageName}`, duration);
      });
    }
  }, [trackPageViews]);

  // Track user interaction performance
  const trackInteraction = useCallback((action: string, element?: string) => {
    if (!trackInteractions) return;

    const markName = element ? `${action}-${element}` : action;
    performanceMonitor.startMark(markName);

    // Use RAF to measure until next frame
    requestAnimationFrame(() => {
      const duration = performanceMonitor.endMark(markName);
      performanceMonitor.trackCustomMetric(`interaction-${markName}`, duration);
    });
  }, [trackInteractions]);

  // Track component render performance
  const trackRender = useCallback((componentName: string) => {
    performanceMonitor.startMark(`render-${componentName}`);

    return () => {
      const duration = performanceMonitor.endMark(`render-${componentName}`);
      performanceMonitor.trackCustomMetric(`render-${componentName}`, duration);
    };
  }, []);

  // Track async operation performance
  const trackAsyncOperation = useCallback(async <T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    performanceMonitor.startMark(`async-${operationName}`);

    try {
      const result = await operation();
      const duration = performanceMonitor.endMark(`async-${operationName}`);
      performanceMonitor.trackCustomMetric(`async-${operationName}`, duration);
      return result;
    } catch (error) {
      performanceMonitor.endMark(`async-${operationName}`);
      throw error;
    }
  }, []);

  // Generate performance report
  const generateReport = useCallback(() => {
    return performanceMonitor.generatePerformanceReport();
  }, []);

  // Start performance monitoring
  useEffect(() => {
    setState(prev => ({ ...prev, isLoading: true }));

    // Initial metrics collection
    updateMetrics();

    // Set up periodic updates
    intervalRef.current = setInterval(updateMetrics, reportInterval);

    setState(prev => ({ ...prev, isLoading: false }));

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updateMetrics, reportInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    trackPageView,
    trackInteraction,
    trackRender,
    trackAsyncOperation,
    generateReport,
    refreshMetrics: updateMetrics,
  };
}

// Hook for component-specific performance tracking
export function useComponentPerformance(componentName: string) {
  const endTrackingRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Start tracking on mount
    performanceMonitor.startMark(`component-${componentName}-mount`);

    return () => {
      // End tracking on unmount
      const duration = performanceMonitor.endMark(`component-${componentName}-mount`);
      performanceMonitor.trackCustomMetric(`component-lifecycle-${componentName}`, duration);
    };
  }, [componentName]);

  const trackRender = useCallback(() => {
    // End previous render tracking if exists
    if (endTrackingRef.current) {
      endTrackingRef.current();
    }

    performanceMonitor.startMark(`component-${componentName}-render`);

    endTrackingRef.current = () => {
      const duration = performanceMonitor.endMark(`component-${componentName}-render`);
      performanceMonitor.trackCustomMetric(`component-render-${componentName}`, duration);
    };

    // Track render completion on next frame
    requestAnimationFrame(() => {
      if (endTrackingRef.current) {
        endTrackingRef.current();
        endTrackingRef.current = null;
      }
    });
  }, [componentName]);

  useEffect(() => {
    trackRender();
  });

  return { trackRender };
}

// Hook for bundle analysis
export function useBundleAnalysis() {
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeBundle = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await bundleAnalyzer.analyzeBundleSize();
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateOptimizations = useCallback(async () => {
    try {
      return await bundleAnalyzer.optimizeBundleSize();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Optimization analysis failed');
      return [];
    }
  }, []);

  const generateReport = useCallback(() => {
    return analysis ? bundleAnalyzer.generateReport(analysis) : '';
  }, [analysis]);

  return {
    analysis,
    isLoading,
    error,
    analyzeBundle,
    generateOptimizations,
    generateReport,
  };
}

// Hook for Web Vitals tracking
export function useWebVitals() {
  const [vitals, setVitals] = useState<{
    lcp?: number;
    fid?: number;
    cls?: number;
    fcp?: number;
    ttfb?: number;
  }>({});

  const [scores, setScores] = useState<WebVitalsScore | null>(null);

  useEffect(() => {
    // Dynamic import to avoid SSR issues
    if (typeof window !== 'undefined') {
      import('web-vitals').then((webVitals) => {
        webVitals.getLCP((metric) => {
          setVitals(prev => ({ ...prev, lcp: metric.value }));
        });

        webVitals.getFID((metric) => {
          setVitals(prev => ({ ...prev, fid: metric.value }));
        });

        webVitals.getCLS((metric) => {
          setVitals(prev => ({ ...prev, cls: metric.value }));
        });

        webVitals.getFCP((metric) => {
          setVitals(prev => ({ ...prev, fcp: metric.value }));
        });

        webVitals.getTTFB((metric) => {
          setVitals(prev => ({ ...prev, ttfb: metric.value }));
        });
      }).catch(() => {
        // Fallback to manual collection if web-vitals is not available
        const metrics = performanceMonitor.getMetrics();
        if (metrics.vitals) {
          setVitals(metrics.vitals);
        }
      });
    }
  }, []);

  // Calculate scores when vitals change
  useEffect(() => {
    const lcpScore = vitals.lcp ? (vitals.lcp <= 2500 ? 'good' : vitals.lcp <= 4000 ? 'needs-improvement' : 'poor') : 'good';
    const fidScore = vitals.fid ? (vitals.fid <= 100 ? 'good' : vitals.fid <= 300 ? 'needs-improvement' : 'poor') : 'good';
    const clsScore = vitals.cls ? (vitals.cls <= 0.1 ? 'good' : vitals.cls <= 0.25 ? 'needs-improvement' : 'poor') : 'good';

    const scoreList = [lcpScore, fidScore, clsScore];
    const goodCount = scoreList.filter(score => score === 'good').length;
    const poorCount = scoreList.filter(score => score === 'poor').length;

    let overall: 'good' | 'needs-improvement' | 'poor';
    if (goodCount === 3) {
      overall = 'good';
    } else if (poorCount > 0) {
      overall = 'poor';
    } else {
      overall = 'needs-improvement';
    }

    setScores({
      lcp: lcpScore,
      fid: fidScore,
      cls: clsScore,
      overall,
    });
  }, [vitals]);

  return { vitals, scores };
}

export default usePerformance;