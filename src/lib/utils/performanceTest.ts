// Performance testing and measurement utilities
import { performanceMonitor } from './performance';

interface PerformanceTest {
  name: string;
  description: string;
  run: () => Promise<PerformanceTestResult>;
}

interface PerformanceTestResult {
  testName: string;
  success: boolean;
  metrics: {
    duration: number;
    memoryUsage?: number;
    cacheHitRate?: number;
    errorRate?: number;
    [key: string]: any;
  };
  recommendations?: string[];
}

class PerformanceTestSuite {
  private tests: PerformanceTest[] = [];
  private results: PerformanceTestResult[] = [];

  addTest(test: PerformanceTest) {
    this.tests.push(test);
  }

  async runAllTests(): Promise<PerformanceTestResult[]> {
    this.results = [];

    for (const test of this.tests) {
      console.log(`Running performance test: ${test.name}`);
      try {
        const result = await test.run();
        this.results.push(result);
      } catch (error) {
        console.error(`Test ${test.name} failed:`, error);
        this.results.push({
          testName: test.name,
          success: false,
          metrics: { duration: 0 },
          recommendations: [`Test failed: ${error.message}`],
        });
      }
    }

    return this.results;
  }

  getTestReport(): string {
    const passedTests = this.results.filter(r => r.success).length;
    const totalTests = this.results.length;

    let report = `Performance Test Report\n`;
    report += `========================\n`;
    report += `Tests Passed: ${passedTests}/${totalTests}\n\n`;

    this.results.forEach(result => {
      report += `${result.testName}: ${result.success ? 'PASS' : 'FAIL'}\n`;
      report += `  Duration: ${result.metrics.duration}ms\n`;

      if (result.metrics.memoryUsage) {
        report += `  Memory Usage: ${(result.metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB\n`;
      }

      if (result.recommendations && result.recommendations.length > 0) {
        report += `  Recommendations:\n`;
        result.recommendations.forEach(rec => {
          report += `    - ${rec}\n`;
        });
      }
      report += '\n';
    });

    return report;
  }
}

// Core Web Vitals test
const testCoreWebVitals: PerformanceTest = {
  name: 'Core Web Vitals',
  description: 'Test Core Web Vitals performance metrics',
  run: async () => {
    const startTime = performance.now();

    return new Promise((resolve) => {
      // Wait for vitals to be collected
      setTimeout(() => {
        const metrics = performanceMonitor.getMetrics();
        const vitalsScore = performanceMonitor.getVitalsScore();
        const duration = performance.now() - startTime;

        const recommendations = [];

        if (vitalsScore.score < 80) {
          recommendations.push('Consider optimizing Core Web Vitals - score is below 80');
        }

        if (metrics.vitals.LCP && metrics.vitals.LCP > 2500) {
          recommendations.push('LCP is above 2.5s - optimize largest contentful paint');
        }

        if (metrics.vitals.FID && metrics.vitals.FID > 100) {
          recommendations.push('FID is above 100ms - optimize first input delay');
        }

        if (metrics.vitals.CLS && metrics.vitals.CLS > 0.1) {
          recommendations.push('CLS is above 0.1 - reduce cumulative layout shift');
        }

        resolve({
          testName: 'Core Web Vitals',
          success: vitalsScore.score >= 60,
          metrics: {
            duration,
            vitalsScore: vitalsScore.score,
            LCP: metrics.vitals.LCP,
            FID: metrics.vitals.FID,
            CLS: metrics.vitals.CLS,
            FCP: metrics.vitals.FCP,
            TTFB: metrics.vitals.TTFB,
          },
          recommendations,
        });
      }, 3000);
    });
  },
};

// Memory usage test
const testMemoryUsage: PerformanceTest = {
  name: 'Memory Usage',
  description: 'Test application memory consumption',
  run: async () => {
    const startTime = performance.now();

    if (typeof window === 'undefined' || !('memory' in performance)) {
      return {
        testName: 'Memory Usage',
        success: false,
        metrics: { duration: 0 },
        recommendations: ['Memory API not available'],
      };
    }

    const memoryInfo = (performance as any).memory;
    const usedMemoryMB = memoryInfo.usedJSHeapSize / 1024 / 1024;
    const totalMemoryMB = memoryInfo.totalJSHeapSize / 1024 / 1024;
    const memoryUsagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;

    const recommendations = [];

    if (usedMemoryMB > 50) {
      recommendations.push('High memory usage detected - consider optimizing components');
    }

    if (memoryUsagePercent > 75) {
      recommendations.push('Memory usage is above 75% of limit - potential memory leak');
    }

    return {
      testName: 'Memory Usage',
      success: usedMemoryMB < 100 && memoryUsagePercent < 80,
      metrics: {
        duration: performance.now() - startTime,
        memoryUsage: memoryInfo.usedJSHeapSize,
        usedMemoryMB,
        totalMemoryMB,
        memoryUsagePercent,
      },
      recommendations,
    };
  },
};

// Bundle size test
const testBundleSize: PerformanceTest = {
  name: 'Bundle Size',
  description: 'Test JavaScript bundle size and loading',
  run: async () => {
    const startTime = performance.now();

    if (typeof window === 'undefined') {
      return {
        testName: 'Bundle Size',
        success: false,
        metrics: { duration: 0 },
        recommendations: ['Bundle size test requires browser environment'],
      };
    }

    const scripts = Array.from(document.querySelectorAll('script[src]')) as HTMLScriptElement[];
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];

    const resourceMetrics = performanceMonitor.getResourceMetrics();
    const scriptMetrics = resourceMetrics.find(m => m.type === 'script');

    const recommendations = [];

    if (scripts.length > 10) {
      recommendations.push('Large number of script files - consider bundling');
    }

    if (scriptMetrics && scriptMetrics.totalSize > 1024 * 1024) {
      recommendations.push('JavaScript bundle size is over 1MB - consider code splitting');
    }

    return {
      testName: 'Bundle Size',
      success: scripts.length <= 15 && (scriptMetrics?.totalSize || 0) <= 2 * 1024 * 1024,
      metrics: {
        duration: performance.now() - startTime,
        scriptCount: scripts.length,
        styleCount: styles.length,
        totalScriptSize: scriptMetrics?.totalSize || 0,
        averageScriptLoadTime: scriptMetrics?.averageTime || 0,
      },
      recommendations,
    };
  },
};

// API response time test
const testApiPerformance: PerformanceTest = {
  name: 'API Performance',
  description: 'Test API response times and caching',
  run: async () => {
    const startTime = performance.now();

    try {
      // Test a sample API endpoint
      const apiStartTime = performance.now();
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const apiDuration = performance.now() - apiStartTime;

      const recommendations = [];

      if (apiDuration > 1000) {
        recommendations.push('API response time is over 1 second - consider optimization');
      }

      if (!response.ok) {
        recommendations.push('API health check failed - check server status');
      }

      return {
        testName: 'API Performance',
        success: response.ok && apiDuration < 2000,
        metrics: {
          duration: performance.now() - startTime,
          apiResponseTime: apiDuration,
          responseStatus: response.status,
        },
        recommendations,
      };
    } catch (error) {
      return {
        testName: 'API Performance',
        success: false,
        metrics: {
          duration: performance.now() - startTime,
        },
        recommendations: ['API test failed - check network connectivity'],
      };
    }
  },
};

// Lazy loading test
const testLazyLoading: PerformanceTest = {
  name: 'Lazy Loading',
  description: 'Test lazy loading implementation',
  run: async () => {
    const startTime = performance.now();

    if (typeof window === 'undefined') {
      return {
        testName: 'Lazy Loading',
        success: false,
        metrics: { duration: 0 },
        recommendations: ['Lazy loading test requires browser environment'],
      };
    }

    // Check for intersection observer support
    const hasIntersectionObserver = 'IntersectionObserver' in window;

    // Check for lazy loaded images
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    const totalImages = document.querySelectorAll('img').length;
    const lazyImagePercent = totalImages > 0 ? (lazyImages.length / totalImages) * 100 : 0;

    const recommendations = [];

    if (!hasIntersectionObserver) {
      recommendations.push('IntersectionObserver not supported - consider polyfill');
    }

    if (lazyImagePercent < 50 && totalImages > 5) {
      recommendations.push('Low percentage of lazy loaded images - consider implementing lazy loading');
    }

    return {
      testName: 'Lazy Loading',
      success: hasIntersectionObserver && (totalImages <= 5 || lazyImagePercent >= 50),
      metrics: {
        duration: performance.now() - startTime,
        totalImages,
        lazyImages: lazyImages.length,
        lazyImagePercent,
        hasIntersectionObserver,
      },
      recommendations,
    };
  },
};

// Create performance test suite
export const performanceTestSuite = new PerformanceTestSuite();

// Add all tests
performanceTestSuite.addTest(testCoreWebVitals);
performanceTestSuite.addTest(testMemoryUsage);
performanceTestSuite.addTest(testBundleSize);
performanceTestSuite.addTest(testApiPerformance);
performanceTestSuite.addTest(testLazyLoading);

// Performance benchmarking utilities
export class PerformanceBenchmark {
  private measurements: Map<string, number[]> = new Map();

  start(label: string): () => void {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;

      if (!this.measurements.has(label)) {
        this.measurements.set(label, []);
      }

      this.measurements.get(label)!.push(duration);
    };
  }

  measure<T>(label: string, fn: () => T): T {
    const end = this.start(label);
    const result = fn();
    end();
    return result;
  }

  async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const end = this.start(label);
    const result = await fn();
    end();
    return result;
  }

  getStats(label: string) {
    const measurements = this.measurements.get(label) || [];

    if (measurements.length === 0) {
      return null;
    }

    const sorted = [...measurements].sort((a, b) => a - b);
    const sum = measurements.reduce((a, b) => a + b, 0);

    return {
      count: measurements.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: sum / measurements.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  getAllStats() {
    const stats: Record<string, any> = {};

    for (const [label] of this.measurements) {
      stats[label] = this.getStats(label);
    }

    return stats;
  }

  reset(label?: string) {
    if (label) {
      this.measurements.delete(label);
    } else {
      this.measurements.clear();
    }
  }
}

// Global benchmark instance
export const performanceBenchmark = new PerformanceBenchmark();

// React hook for performance testing
export function usePerformanceTest() {
  const [testResults, setTestResults] = React.useState<PerformanceTestResult[]>([]);
  const [isRunning, setIsRunning] = React.useState(false);

  const runTests = async () => {
    setIsRunning(true);
    try {
      const results = await performanceTestSuite.runAllTests();
      setTestResults(results);
    } catch (error) {
      console.error('Performance tests failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getTestReport = () => {
    return performanceTestSuite.getTestReport();
  };

  return {
    testResults,
    isRunning,
    runTests,
    getTestReport,
  };
}

// Performance monitoring hook for components
export function useComponentPerformance(componentName: string) {
  const renderCount = React.useRef(0);
  const renderTimes = React.useRef<number[]>([]);

  React.useEffect(() => {
    const startTime = performance.now();
    renderCount.current++;

    return () => {
      const renderTime = performance.now() - startTime;
      renderTimes.current.push(renderTime);

      // Keep only last 10 render times
      if (renderTimes.current.length > 10) {
        renderTimes.current = renderTimes.current.slice(-10);
      }
    };
  });

  const getPerformanceStats = () => {
    const times = renderTimes.current;
    if (times.length === 0) return null;

    const average = times.reduce((a, b) => a + b, 0) / times.length;
    const max = Math.max(...times);
    const min = Math.min(...times);

    return {
      componentName,
      renderCount: renderCount.current,
      averageRenderTime: average,
      maxRenderTime: max,
      minRenderTime: min,
      recentRenderTimes: times,
    };
  };

  return { getPerformanceStats };
}