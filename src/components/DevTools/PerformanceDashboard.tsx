'use client';

import React, { useState, useEffect } from 'react';
import { usePerformance } from '@/lib/utils/performance';
import { usePerformanceTest, performanceBenchmark } from '@/lib/utils/performanceTest';
import { useCacheMetrics } from '@/lib/hooks/useApiCache';
import { cn } from '@/lib/utils/cn';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  status: 'good' | 'needs-improvement' | 'poor';
  description?: string;
}

function MetricCard({ title, value, unit, status, description }: MetricCardProps) {
  const statusColors = {
    good: 'bg-green-50 border-green-200 text-green-800',
    'needs-improvement': 'bg-yellow-50 border-yellow-200 text-yellow-800',
    poor: 'bg-red-50 border-red-200 text-red-800',
  };

  return (
    <div className={cn('rounded-lg border p-4', statusColors[status])}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        <div className="flex items-baseline space-x-1">
          <span className="text-2xl font-bold">{value}</span>
          {unit && <span className="text-xs opacity-70">{unit}</span>}
        </div>
      </div>
      {description && (
        <p className="mt-2 text-xs opacity-80">{description}</p>
      )}
    </div>
  );
}

function WebVitalsSection() {
  const { vitalsScore, metrics } = usePerformance();

  if (!vitalsScore || !metrics) {
    return (
      <div className="rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Core Web Vitals</h2>
        <p className="text-gray-500">Loading metrics...</p>
      </div>
    );
  }

  const getVitalStatus = (vital: string, value: number | null): 'good' | 'needs-improvement' | 'poor' => {
    if (value === null) return 'poor';

    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      FCP: { good: 1800, poor: 3000 },
      CLS: { good: 0.1, poor: 0.25 },
      TTFB: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[vital as keyof typeof thresholds];
    if (!threshold) return 'poor';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  return (
    <div className="rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-4">Core Web Vitals</h2>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Score</span>
          <span className="text-2xl font-bold">{vitalsScore.score}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={cn('h-2 rounded-full', {
              'bg-green-600': vitalsScore.score >= 80,
              'bg-yellow-600': vitalsScore.score >= 60,
              'bg-red-600': vitalsScore.score < 60,
            })}
            style={{ width: `${vitalsScore.score}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">Grade: {vitalsScore.grade}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Largest Contentful Paint"
          value={metrics.vitals.LCP?.toFixed(0) || 'N/A'}
          unit="ms"
          status={getVitalStatus('LCP', metrics.vitals.LCP)}
          description="Time to render the largest element"
        />
        <MetricCard
          title="First Input Delay"
          value={metrics.vitals.FID?.toFixed(0) || 'N/A'}
          unit="ms"
          status={getVitalStatus('FID', metrics.vitals.FID)}
          description="Time to process first user interaction"
        />
        <MetricCard
          title="Cumulative Layout Shift"
          value={metrics.vitals.CLS?.toFixed(3) || 'N/A'}
          unit=""
          status={getVitalStatus('CLS', metrics.vitals.CLS)}
          description="Visual stability score"
        />
        <MetricCard
          title="First Contentful Paint"
          value={metrics.vitals.FCP?.toFixed(0) || 'N/A'}
          unit="ms"
          status={getVitalStatus('FCP', metrics.vitals.FCP)}
          description="Time to render first content"
        />
        <MetricCard
          title="Time to First Byte"
          value={metrics.vitals.TTFB?.toFixed(0) || 'N/A'}
          unit="ms"
          status={getVitalStatus('TTFB', metrics.vitals.TTFB)}
          description="Server response time"
        />
      </div>
    </div>
  );
}

function CacheMetricsSection() {
  const { getMetrics } = useCacheMetrics();
  const metrics = getMetrics();

  return (
    <div className="rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-4">Cache Performance</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Cache Hit Rate"
          value={(metrics.hitRate * 100).toFixed(1)}
          unit="%"
          status={metrics.hitRate > 0.8 ? 'good' : metrics.hitRate > 0.6 ? 'needs-improvement' : 'poor'}
          description="Percentage of requests served from cache"
        />
        <MetricCard
          title="Error Rate"
          value={(metrics.errorRate * 100).toFixed(1)}
          unit="%"
          status={metrics.errorRate < 0.05 ? 'good' : metrics.errorRate < 0.1 ? 'needs-improvement' : 'poor'}
          description="Percentage of failed requests"
        />
        <MetricCard
          title="Total Requests"
          value={metrics.totalRequests}
          unit=""
          status="good"
          description="Total API requests made"
        />
        <MetricCard
          title="Cache Hits"
          value={metrics.hits}
          unit=""
          status="good"
          description="Successful cache retrievals"
        />
      </div>
    </div>
  );
}

function PerformanceTestsSection() {
  const { testResults, isRunning, runTests, getTestReport } = usePerformanceTest();
  const [showReport, setShowReport] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Performance Tests</h2>
        <button
          onClick={runTests}
          disabled={isRunning}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium',
            isRunning
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          )}
        >
          {isRunning ? 'Running Tests...' : 'Run Tests'}
        </button>
      </div>

      {testResults.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testResults.map((result) => (
              <div
                key={result.testName}
                className={cn(
                  'rounded-lg border p-4',
                  result.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">{result.testName}</h3>
                  <span
                    className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      result.success
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    )}
                  >
                    {result.success ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  Duration: {result.metrics.duration.toFixed(0)}ms
                </p>
                {result.recommendations && result.recommendations.length > 0 && (
                  <div className="text-xs">
                    <p className="font-medium mb-1">Recommendations:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {result.recommendations.map((rec, index) => (
                        <li key={index} className="text-gray-600">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => setShowReport(!showReport)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {showReport ? 'Hide' : 'Show'} Detailed Report
            </button>
          </div>

          {showReport && (
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                {getTestReport()}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BenchmarkSection() {
  const [benchmarkStats, setBenchmarkStats] = useState<any>(null);

  const refreshStats = () => {
    setBenchmarkStats(performanceBenchmark.getAllStats());
  };

  useEffect(() => {
    const interval = setInterval(refreshStats, 5000);
    refreshStats();
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Performance Benchmarks</h2>
        <button
          onClick={refreshStats}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {benchmarkStats && Object.keys(benchmarkStats).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(benchmarkStats).map(([label, stats]: [string, any]) => (
            <div key={label} className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium mb-3">{label}</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Count:</span>
                  <span>{stats.count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mean:</span>
                  <span>{stats.mean.toFixed(2)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Median:</span>
                  <span>{stats.median.toFixed(2)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>P95:</span>
                  <span>{stats.p95.toFixed(2)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Max:</span>
                  <span>{stats.max.toFixed(2)}ms</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center">No benchmark data available</p>
      )}
    </div>
  );
}

export default function PerformanceDashboard() {
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development
  useEffect(() => {
    setIsVisible(process.env.NODE_ENV === 'development');
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-w-4xl max-h-96 overflow-auto">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Performance Dashboard</h1>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Development-only performance monitoring and testing
          </p>
        </div>

        <div className="p-6 space-y-6">
          <WebVitalsSection />
          <CacheMetricsSection />
          <PerformanceTestsSection />
          <BenchmarkSection />
        </div>
      </div>
    </div>
  );
}

// Hook to trigger performance dashboard in development
export function usePerformanceDashboardToggle() {
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl+Shift+P to toggle dashboard
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        setShowDashboard(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return { showDashboard, setShowDashboard };
}