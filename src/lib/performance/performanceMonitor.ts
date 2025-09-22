import { logger } from '../logging/structuredLogger';

export interface PerformanceMetrics {
  navigation: NavigationMetrics;
  vitals: WebVitals;
  runtime: RuntimeMetrics;
  network: NetworkMetrics;
  memory: MemoryMetrics;
}

export interface NavigationMetrics {
  domContentLoaded: number;
  loadComplete: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
}

export interface WebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
}

export interface RuntimeMetrics {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
  frameRate: number;
  longTasks: number;
}

export interface NetworkMetrics {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export interface MemoryMetrics {
  used: number;
  total: number;
  usage: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private observer: PerformanceObserver | null = null;
  private metrics: Partial<PerformanceMetrics> = {};
  private isMonitoring = false;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMonitoring(): void {
    if (this.isMonitoring || typeof window === 'undefined') return;

    this.isMonitoring = true;
    this.initializePerformanceObserver();
    this.collectNavigationMetrics();
    this.collectWebVitals();
    this.collectRuntimeMetrics();
    this.collectNetworkMetrics();

    // Set up periodic collection
    setInterval(() => {
      this.collectRuntimeMetrics();
    }, 5000);

    logger.info('Performance monitoring started');
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    this.isMonitoring = false;
    logger.info('Performance monitoring stopped');
  }

  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  private initializePerformanceObserver(): void {
    if (!window.PerformanceObserver) return;

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      // Observe different types of performance entries
      this.observer.observe({ entryTypes: ['navigation', 'paint', 'measure', 'navigation'] });

      // Observe Core Web Vitals
      if ('web-vitals' in window) {
        this.observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
      }

      // Observe long tasks
      if ('longtask' in window) {
        this.observer.observe({ entryTypes: ['longtask'] });
      }

      // Observe resource timing
      this.observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      logger.error('Failed to initialize performance observer', error as Error);
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'navigation':
        this.processNavigationEntry(entry as PerformanceNavigationTiming);
        break;
      case 'paint':
        this.processPaintEntry(entry as PerformancePaintTiming);
        break;
      case 'largest-contentful-paint':
        this.processLCPEntry(entry as any);
        break;
      case 'first-input':
        this.processFIDEntry(entry as any);
        break;
      case 'layout-shift':
        this.processCLSEntry(entry as any);
        break;
      case 'longtask':
        this.processLongTaskEntry(entry as any);
        break;
      case 'resource':
        this.processResourceEntry(entry as PerformanceResourceTiming);
        break;
    }
  }

  private processNavigationEntry(entry: PerformanceNavigationTiming): void {
    this.metrics.navigation = {
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      firstPaint: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      timeToInteractive: 0,
    };
  }

  private processPaintEntry(entry: PerformancePaintTiming): void {
    if (!this.metrics.navigation) {
      this.metrics.navigation = {} as NavigationMetrics;
    }

    if (entry.name === 'first-paint') {
      this.metrics.navigation.firstPaint = entry.startTime;
    } else if (entry.name === 'first-contentful-paint') {
      this.metrics.navigation.firstContentfulPaint = entry.startTime;

      if (!this.metrics.vitals) {
        this.metrics.vitals = {} as WebVitals;
      }
      this.metrics.vitals.fcp = entry.startTime;
    }
  }

  private processLCPEntry(entry: any): void {
    if (!this.metrics.vitals) {
      this.metrics.vitals = {} as WebVitals;
    }
    this.metrics.vitals.lcp = entry.startTime;
  }

  private processFIDEntry(entry: any): void {
    if (!this.metrics.vitals) {
      this.metrics.vitals = {} as WebVitals;
    }
    this.metrics.vitals.fid = entry.processingStart - entry.startTime;
  }

  private processCLSEntry(entry: any): void {
    if (!this.metrics.vitals) {
      this.metrics.vitals = {} as WebVitals;
    }
    if (!entry.hadRecentInput) {
      this.metrics.vitals.cls = (this.metrics.vitals.cls || 0) + entry.value;
    }
  }

  private processLongTaskEntry(entry: any): void {
    if (!this.metrics.runtime) {
      this.metrics.runtime = {} as RuntimeMetrics;
    }
    this.metrics.runtime.longTasks = (this.metrics.runtime.longTasks || 0) + 1;
  }

  private processResourceEntry(entry: PerformanceResourceTiming): void {
    // Process resource timing data for optimization insights
    if (entry.transferSize && entry.transferSize > 100000) { // >100KB
      logger.warn('Large resource detected', {
        metadata: {
          resource: entry.name,
          size: entry.transferSize,
          duration: entry.duration,
        },
      });
    }
  }

  private collectNavigationMetrics(): void {
    if (!performance.timing) return;

    const timing = performance.timing;
    const navigation = performance.navigation;

    this.metrics.navigation = {
      domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
      loadComplete: timing.loadEventEnd - timing.loadEventStart,
      firstPaint: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      timeToInteractive: 0,
    };

    // Get paint metrics
    const paintEntries = performance.getEntriesByType('paint');
    paintEntries.forEach((entry) => {
      if (entry.name === 'first-paint') {
        this.metrics.navigation!.firstPaint = entry.startTime;
      } else if (entry.name === 'first-contentful-paint') {
        this.metrics.navigation!.firstContentfulPaint = entry.startTime;
      }
    });
  }

  private collectWebVitals(): void {
    if (!this.metrics.vitals) {
      this.metrics.vitals = {} as WebVitals;
    }

    // Time to First Byte
    if (performance.timing) {
      this.metrics.vitals.ttfb = performance.timing.responseStart - performance.timing.requestStart;
    }

    // Core Web Vitals will be collected via PerformanceObserver
  }

  private collectRuntimeMetrics(): void {
    // Memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.runtime = {
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        totalJSHeapSize: memory.totalJSHeapSize,
        usedJSHeapSize: memory.usedJSHeapSize,
        frameRate: this.calculateFrameRate(),
        longTasks: this.metrics.runtime?.longTasks || 0,
      };
    }
  }

  private collectNetworkMetrics(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.metrics.network = {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        saveData: connection.saveData || false,
      };
    }
  }

  private calculateFrameRate(): number {
    let frameCount = 0;
    let lastTime = performance.now();

    const countFrame = () => {
      frameCount++;
      const currentTime = performance.now();
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;
        return fps;
      }
      requestAnimationFrame(countFrame);
      return 0;
    };

    requestAnimationFrame(countFrame);
    return 60; // Default assumption
  }

  generatePerformanceReport(): string {
    const metrics = this.getMetrics();
    let report = '# Performance Report\n\n';

    if (metrics.navigation) {
      report += '## Navigation Metrics\n';
      report += `- DOM Content Loaded: ${metrics.navigation.domContentLoaded.toFixed(2)}ms\n`;
      report += `- Load Complete: ${metrics.navigation.loadComplete.toFixed(2)}ms\n`;
      report += `- First Paint: ${metrics.navigation.firstPaint.toFixed(2)}ms\n`;
      report += `- First Contentful Paint: ${metrics.navigation.firstContentfulPaint.toFixed(2)}ms\n\n`;
    }

    if (metrics.vitals) {
      report += '## Core Web Vitals\n';
      report += `- Largest Contentful Paint: ${metrics.vitals.lcp?.toFixed(2) || 'N/A'}ms\n`;
      report += `- First Input Delay: ${metrics.vitals.fid?.toFixed(2) || 'N/A'}ms\n`;
      report += `- Cumulative Layout Shift: ${metrics.vitals.cls?.toFixed(3) || 'N/A'}\n`;
      report += `- Time to First Byte: ${metrics.vitals.ttfb?.toFixed(2) || 'N/A'}ms\n\n`;
    }

    if (metrics.runtime) {
      report += '## Runtime Metrics\n';
      report += `- JS Heap Used: ${(metrics.runtime.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB\n`;
      report += `- JS Heap Total: ${(metrics.runtime.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB\n`;
      report += `- JS Heap Limit: ${(metrics.runtime.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB\n`;
      report += `- Frame Rate: ${metrics.runtime.frameRate}fps\n`;
      report += `- Long Tasks: ${metrics.runtime.longTasks}\n\n`;
    }

    if (metrics.network) {
      report += '## Network Information\n';
      report += `- Effective Type: ${metrics.network.effectiveType}\n`;
      report += `- Downlink: ${metrics.network.downlink}Mbps\n`;
      report += `- RTT: ${metrics.network.rtt}ms\n`;
      report += `- Save Data: ${metrics.network.saveData}\n\n`;
    }

    // Performance recommendations
    report += this.generateRecommendations(metrics);

    return report;
  }

  private generateRecommendations(metrics: Partial<PerformanceMetrics>): string {
    let recommendations = '## Recommendations\n';
    const issues: string[] = [];

    // Check Core Web Vitals
    if (metrics.vitals) {
      if (metrics.vitals.lcp && metrics.vitals.lcp > 2500) {
        issues.push('LCP is slow (>2.5s). Optimize images and reduce server response time.');
      }
      if (metrics.vitals.fid && metrics.vitals.fid > 100) {
        issues.push('FID is high (>100ms). Reduce JavaScript execution time.');
      }
      if (metrics.vitals.cls && metrics.vitals.cls > 0.1) {
        issues.push('CLS is high (>0.1). Ensure images and content have defined dimensions.');
      }
    }

    // Check memory usage
    if (metrics.runtime) {
      const memoryUsage = (metrics.runtime.usedJSHeapSize / metrics.runtime.jsHeapSizeLimit) * 100;
      if (memoryUsage > 80) {
        issues.push('High memory usage detected. Check for memory leaks.');
      }
      if (metrics.runtime.longTasks > 10) {
        issues.push('Multiple long tasks detected. Break up large JavaScript operations.');
      }
    }

    // Check network conditions
    if (metrics.network) {
      if (metrics.network.effectiveType === 'slow-2g' || metrics.network.effectiveType === '2g') {
        issues.push('Slow network detected. Implement aggressive caching and compression.');
      }
    }

    if (issues.length === 0) {
      recommendations += '- No major performance issues detected.\n';
    } else {
      issues.forEach(issue => {
        recommendations += `- ${issue}\n`;
      });
    }

    return recommendations;
  }

  // Method to track custom metrics
  trackCustomMetric(name: string, value: number, unit: string = 'ms'): void {
    logger.info('Custom performance metric', {
      metadata: {
        metric: name,
        value,
        unit,
        timestamp: Date.now(),
      },
    });
  }

  // Method to start a performance mark
  startMark(name: string): void {
    if (performance.mark) {
      performance.mark(`${name}-start`);
    }
  }

  // Method to end a performance mark and measure
  endMark(name: string): number {
    if (performance.mark && performance.measure) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);

      const measure = performance.getEntriesByName(name, 'measure')[0];
      return measure ? measure.duration : 0;
    }
    return 0;
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// Auto-start monitoring in browser environment
if (typeof window !== 'undefined') {
  // Start monitoring after a short delay to allow page to initialize
  setTimeout(() => {
    performanceMonitor.startMonitoring();
  }, 1000);
}

export default performanceMonitor;