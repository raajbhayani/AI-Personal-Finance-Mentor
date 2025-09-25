// Performance monitoring and optimization utilities

interface PerformanceMetrics {
  navigationTiming: PerformanceNavigationTiming | null;
  resourceTiming: PerformanceResourceTiming[];
  userTiming: PerformanceMeasure[];
  memoryInfo: any;
  networkInfo: any;
  vitals: {
    CLS: number | null;
    FID: number | null;
    FCP: number | null;
    LCP: number | null;
    TTFB: number | null;
  };
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private observers: PerformanceObserver[];
  private vitalsCallbacks: Map<string, (value: number) => void>;

  constructor() {
    this.metrics = {
      navigationTiming: null,
      resourceTiming: [],
      userTiming: [],
      memoryInfo: null,
      networkInfo: null,
      vitals: {
        CLS: null,
        FID: null,
        FCP: null,
        LCP: null,
        TTFB: null,
      },
    };
    this.observers = [];
    this.vitalsCallbacks = new Map();
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Navigation timing
    this.collectNavigationTiming();

    // Core Web Vitals
    this.observeWebVitals();

    // Resource timing
    this.observeResourceTiming();

    // User timing
    this.observeUserTiming();

    // Memory and network info
    this.collectBrowserInfo();
  }

  private collectNavigationTiming() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        this.metrics.navigationTiming = navigationEntries[0];
        this.calculateTTFB();
      }
    }
  }

  private calculateTTFB() {
    if (this.metrics.navigationTiming) {
      const ttfb = this.metrics.navigationTiming.responseStart - this.metrics.navigationTiming.requestStart;
      this.metrics.vitals.TTFB = ttfb;
      this.triggerVitalCallback('TTFB', ttfb);
    }
  }

  private observeWebVitals() {
    // Largest Contentful Paint (LCP)
    this.createObserver('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1] as PerformancePaintTiming;
      this.metrics.vitals.LCP = lastEntry.startTime;
      this.triggerVitalCallback('LCP', lastEntry.startTime);
    });

    // First Contentful Paint (FCP)
    this.createObserver('paint', (entries) => {
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.vitals.FCP = entry.startTime;
          this.triggerVitalCallback('FCP', entry.startTime);
        }
      });
    });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    this.createObserver('layout-shift', (entries) => {
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.metrics.vitals.CLS = clsValue;
      this.triggerVitalCallback('CLS', clsValue);
    });

    // First Input Delay (FID)
    this.createObserver('first-input', (entries) => {
      const firstInput = entries[0] as PerformanceEventTiming;
      if (firstInput) {
        const fid = firstInput.processingStart - firstInput.startTime;
        this.metrics.vitals.FID = fid;
        this.triggerVitalCallback('FID', fid);
      }
    });
  }

  private observeResourceTiming() {
    this.createObserver('resource', (entries) => {
      this.metrics.resourceTiming.push(...(entries as PerformanceResourceTiming[]));
    });
  }

  private observeUserTiming() {
    this.createObserver('measure', (entries) => {
      this.metrics.userTiming.push(...(entries as PerformanceMeasure[]));
    });
  }

  private createObserver(type: string, callback: (entries: PerformanceEntry[]) => void) {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          callback(list.getEntries());
        });
        observer.observe({ type, buffered: true });
        this.observers.push(observer);
      } catch (error) {
        console.warn(`Failed to observe ${type}:`, error);
      }
    }
  }

  private collectBrowserInfo() {
    // Memory info
    if ('memory' in performance) {
      this.metrics.memoryInfo = (performance as any).memory;
    }

    // Network info
    if ('connection' in navigator) {
      this.metrics.networkInfo = (navigator as any).connection;
    }
  }

  private triggerVitalCallback(vital: string, value: number) {
    const callback = this.vitalsCallbacks.get(vital);
    if (callback) {
      callback(value);
    }
  }

  // Public methods
  public onVital(vital: string, callback: (value: number) => void) {
    this.vitalsCallbacks.set(vital, callback);
  }

  public mark(name: string) {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name);
    }
  }

  public measure(name: string, startMark: string, endMark?: string) {
    if ('performance' in window && 'measure' in performance) {
      performance.measure(name, startMark, endMark);
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getVitalsScore(): { score: number; grade: string; details: any } {
    const { CLS, FID, FCP, LCP, TTFB } = this.metrics.vitals;

    const scores = {
      CLS: this.scoreVital('CLS', CLS),
      FID: this.scoreVital('FID', FID),
      FCP: this.scoreVital('FCP', FCP),
      LCP: this.scoreVital('LCP', LCP),
      TTFB: this.scoreVital('TTFB', TTFB),
    };

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const averageScore = totalScore / Object.keys(scores).length;

    return {
      score: Math.round(averageScore),
      grade: this.getGrade(averageScore),
      details: scores,
    };
  }

  private scoreVital(vital: string, value: number | null): number {
    if (value === null) return 0;

    const thresholds = {
      CLS: { good: 0.1, poor: 0.25 },
      FID: { good: 100, poor: 300 },
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      TTFB: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[vital as keyof typeof thresholds];
    if (!threshold) return 0;

    if (value <= threshold.good) return 100;
    if (value <= threshold.poor) return 50;
    return 0;
  }

  private getGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  public getResourceMetrics() {
    const resources = this.metrics.resourceTiming;
    const types = ['script', 'stylesheet', 'image', 'fetch', 'other'];

    return types.map(type => {
      const filteredResources = resources.filter(resource => {
        if (type === 'script') return resource.name.includes('.js');
        if (type === 'stylesheet') return resource.name.includes('.css');
        if (type === 'image') return /\.(jpg|jpeg|png|gif|webp|svg)/.test(resource.name);
        if (type === 'fetch') return resource.initiatorType === 'fetch' || resource.initiatorType === 'xmlhttprequest';
        return !['script', 'stylesheet', 'image', 'fetch'].some(t =>
          (t === 'script' && resource.name.includes('.js')) ||
          (t === 'stylesheet' && resource.name.includes('.css')) ||
          (t === 'image' && /\.(jpg|jpeg|png|gif|webp|svg)/.test(resource.name)) ||
          (t === 'fetch' && (resource.initiatorType === 'fetch' || resource.initiatorType === 'xmlhttprequest'))
        );
      });

      const totalSize = filteredResources.reduce((sum, resource) =>
        sum + (resource.transferSize || 0), 0);
      const totalTime = filteredResources.reduce((sum, resource) =>
        sum + (resource.duration || 0), 0);

      return {
        type,
        count: filteredResources.length,
        totalSize,
        totalTime,
        averageTime: filteredResources.length > 0 ? totalTime / filteredResources.length : 0,
      };
    });
  }

  public cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.vitalsCallbacks.clear();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformance() {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null);
  const [vitalsScore, setVitalsScore] = React.useState<any>(null);

  React.useEffect(() => {
    const updateMetrics = () => {
      setMetrics(performanceMonitor.getMetrics());
      setVitalsScore(performanceMonitor.getVitalsScore());
    };

    // Update metrics periodically
    const interval = setInterval(updateMetrics, 5000);

    // Initial update
    updateMetrics();

    return () => {
      clearInterval(interval);
    };
  }, []);

  const mark = React.useCallback((name: string) => {
    performanceMonitor.mark(name);
  }, []);

  const measure = React.useCallback((name: string, startMark: string, endMark?: string) => {
    performanceMonitor.measure(name, startMark, endMark);
  }, []);

  return {
    metrics,
    vitalsScore,
    mark,
    measure,
  };
}

// Bundle size analysis utilities
export function analyzeBundleSize() {
  if (typeof window === 'undefined') return null;

  const scripts = Array.from(document.querySelectorAll('script[src]')) as HTMLScriptElement[];
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];

  const bundleInfo = {
    scripts: scripts.length,
    styles: styles.length,
    totalResources: scripts.length + styles.length,
  };

  return bundleInfo;
}

// Memory leak detection
export function detectMemoryLeaks() {
  if (typeof window === 'undefined' || !('memory' in performance)) return null;

  const memory = (performance as any).memory;
  const threshold = 50 * 1024 * 1024; // 50MB

  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    isHighUsage: memory.usedJSHeapSize > threshold,
    usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
  };
}

// Frame rate monitoring
export function useFrameRate() {
  const [fps, setFps] = React.useState(60);
  const frameCount = React.useRef(0);
  const lastTime = React.useRef(performance.now());

  React.useEffect(() => {
    let animationFrame: number;

    const updateFps = () => {
      frameCount.current++;
      const currentTime = performance.now();

      if (currentTime >= lastTime.current + 1000) {
        setFps(frameCount.current);
        frameCount.current = 0;
        lastTime.current = currentTime;
      }

      animationFrame = requestAnimationFrame(updateFps);
    };

    animationFrame = requestAnimationFrame(updateFps);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return fps;
}

// Component render timing
export function useRenderTiming(componentName: string) {
  React.useEffect(() => {
    performanceMonitor.mark(`${componentName}-render-start`);

    return () => {
      performanceMonitor.mark(`${componentName}-render-end`);
      performanceMonitor.measure(
        `${componentName}-render-time`,
        `${componentName}-render-start`,
        `${componentName}-render-end`
      );
    };
  });
}

// Intersection Observer for lazy loading performance
export function useLazyLoadPerformance() {
  const [loadedCount, setLoadedCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);

  const incrementLoaded = React.useCallback(() => {
    setLoadedCount(count => count + 1);
  }, []);

  const incrementTotal = React.useCallback(() => {
    setTotalCount(count => count + 1);
  }, []);

  const percentage = totalCount > 0 ? (loadedCount / totalCount) * 100 : 0;

  return {
    loadedCount,
    totalCount,
    percentage,
    incrementLoaded,
    incrementTotal,
  };
}