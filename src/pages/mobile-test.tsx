import { useEffect, useState } from 'react';
import Head from 'next/head';
import {
  Smartphone,
  Tablet,
  Monitor,
  Check,
  X,
  Wifi,
  Battery,
  Signal,
  Menu,
  Search,
  Bell,
  User,
  Plus,
  Minus,
  Play,
  BarChart3
} from 'lucide-react';
import { usePerformanceValidation } from '@/lib/utils/performanceValidation';
import { usePerformanceTest } from '@/lib/utils/performanceTest';
import { usePerformance } from '@/lib/utils/performance';

interface DeviceTest {
  name: string;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  icon: any;
}

const devices: DeviceTest[] = [
  { name: 'iPhone SE', width: 375, height: 667, orientation: 'portrait', icon: Smartphone },
  { name: 'iPhone 14', width: 390, height: 844, orientation: 'portrait', icon: Smartphone },
  { name: 'Samsung Galaxy S21', width: 360, height: 800, orientation: 'portrait', icon: Smartphone },
  { name: 'iPad Mini', width: 768, height: 1024, orientation: 'portrait', icon: Tablet },
  { name: 'iPad Air', width: 820, height: 1180, orientation: 'portrait', icon: Tablet },
  { name: 'Desktop', width: 1920, height: 1080, orientation: 'landscape', icon: Monitor },
];

const testFeatures = [
  'Touch-friendly buttons (min 44px)',
  'Readable text without zoom',
  'Proper spacing between elements',
  'Mobile navigation patterns',
  'Responsive charts and graphs',
  'Optimized form inputs',
  'Swipe gestures support',
  'Fast loading on 3G',
  'Offline functionality',
  'PWA compatibility'
];

export default function MobileTestPage() {
  const [currentDevice, setCurrentDevice] = useState<DeviceTest>(devices[0]);
  const [touchTests, setTouchTests] = useState<Record<string, boolean>>({});
  const [deviceInfo, setDeviceInfo] = useState<any>({});

  // Performance monitoring hooks
  const { vitalsScore, metrics } = usePerformance();
  const { validationResults, isValidating, runValidation, getOptimizationPriorities } = usePerformanceValidation();
  const { testResults, isRunning: isTestRunning, runTests } = usePerformanceTest();

  useEffect(() => {
    // Detect device capabilities
    const info = {
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      devicePixelRatio: window.devicePixelRatio,
      touchSupport: 'ontouchstart' in window,
      orientation: window.screen.orientation?.type || 'unknown',
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      connectionType: (navigator as any).connection?.effectiveType || 'unknown',
    };
    setDeviceInfo(info);
  }, []);

  const runTouchTest = (feature: string) => {
    setTouchTests(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
  };

  const simulateDevice = (device: DeviceTest) => {
    setCurrentDevice(device);
    // In a real implementation, you might adjust iframe or viewport
  };

  return (
    <>
      <Head>
        <title>Mobile Optimization Test - AI Personal Finance Mentor</title>
        <meta name="description" content="Test mobile optimizations and responsive design" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Mobile Status Bar Simulation */}
        <div className="lg:hidden bg-black text-white px-4 py-1 flex justify-between items-center text-xs">
          <div className="flex items-center space-x-1">
            <Signal className="w-3 h-3" />
            <Wifi className="w-3 h-3" />
          </div>
          <div className="font-semibold">9:41 AM</div>
          <div className="flex items-center space-x-1">
            <span>100%</span>
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {/* Test Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Mobile Optimization Test</h1>
          <p className="text-gray-600">Testing responsive design and mobile-specific features</p>
        </div>

        <div className="max-w-7xl mx-auto p-4 space-y-6">
          {/* Device Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Device Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Screen Size</div>
                <div className="font-mono text-sm">{deviceInfo.screenWidth} × {deviceInfo.screenHeight}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Viewport Size</div>
                <div className="font-mono text-sm">{deviceInfo.viewportWidth} × {deviceInfo.viewportHeight}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Device Pixel Ratio</div>
                <div className="font-mono text-sm">{deviceInfo.devicePixelRatio}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Touch Support</div>
                <div className={`text-sm ${deviceInfo.touchSupport ? 'text-green-600' : 'text-red-600'}`}>
                  {deviceInfo.touchSupport ? 'Yes' : 'No'}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Orientation</div>
                <div className="font-mono text-sm">{deviceInfo.orientation}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Connection</div>
                <div className="font-mono text-sm">{deviceInfo.connectionType}</div>
              </div>
            </div>
          </div>

          {/* Device Simulation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Device Simulation</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              {devices.map((device) => {
                const Icon = device.icon;
                return (
                  <button
                    key={device.name}
                    onClick={() => simulateDevice(device)}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      currentDevice.name === device.name
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-6 h-6 mx-auto mb-2" />
                    <div className="text-xs font-medium">{device.name}</div>
                    <div className="text-xs text-gray-500">{device.width}×{device.height}</div>
                  </button>
                );
              })}
            </div>

            <div className="text-sm text-gray-600 mb-2">
              Current: {currentDevice.name} ({currentDevice.width} × {currentDevice.height})
            </div>
          </div>

          {/* Touch Test Interface */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Touch Interface Test</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {/* Touch targets with varying sizes */}
              <button className="h-12 bg-blue-600 text-white rounded-lg font-medium touch-manipulation active:scale-95 transition-transform">
                44px Target ✓
              </button>
              <button className="h-10 bg-yellow-500 text-white rounded-lg font-medium touch-manipulation active:scale-95 transition-transform">
                40px Target ⚠️
              </button>
              <button className="h-8 bg-red-500 text-white rounded-lg font-medium touch-manipulation active:scale-95 transition-transform">
                32px Target ❌
              </button>
              <button className="h-6 bg-red-600 text-white rounded-lg font-medium touch-manipulation active:scale-95 transition-transform text-xs">
                24px Target ❌
              </button>
            </div>

            <div className="space-y-3">
              {testFeatures.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <span className="text-gray-900">{feature}</span>
                  <button
                    onClick={() => runTouchTest(feature)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors touch-manipulation ${
                      touchTests[feature]
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {touchTests[feature] ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Mobile Interface */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Sample Mobile Interface</h2>

            {/* Mobile Navbar */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation">
                    <Menu className="h-6 w-6" />
                  </button>
                  <h1 className="text-lg font-bold text-gray-900">Finance App</h1>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation">
                      <Search className="h-5 w-5" />
                    </button>
                    <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation">
                      <Bell className="h-5 w-5" />
                      <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sample Card */}
              <div className="p-4 space-y-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Total Balance</h3>
                      <p className="text-2xl font-bold">$25,750.80</p>
                    </div>
                    <button className="p-2 bg-white/20 rounded-lg touch-manipulation">
                      <User className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex space-x-4">
                    <button className="flex-1 bg-white/20 rounded-lg py-3 px-4 font-medium touch-manipulation active:scale-95 transition-transform">
                      <Plus className="h-4 w-4 mx-auto mb-1" />
                      Add Money
                    </button>
                    <button className="flex-1 bg-white/20 rounded-lg py-3 px-4 font-medium touch-manipulation active:scale-95 transition-transform">
                      <Minus className="h-4 w-4 mx-auto mb-1" />
                      Send Money
                    </button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button className="p-4 border border-gray-200 rounded-lg text-left hover:bg-gray-50 touch-manipulation active:scale-95 transition-all">
                    <div className="text-2xl mb-2">💳</div>
                    <div className="font-medium text-gray-900">Transactions</div>
                    <div className="text-sm text-gray-500">View all activity</div>
                  </button>
                  <button className="p-4 border border-gray-200 rounded-lg text-left hover:bg-gray-50 touch-manipulation active:scale-95 transition-all">
                    <div className="text-2xl mb-2">🎯</div>
                    <div className="font-medium text-gray-900">Goals</div>
                    <div className="text-sm text-gray-500">Track progress</div>
                  </button>
                </div>
              </div>

              {/* Mobile Bottom Navigation */}
              <div className="bg-white border-t border-gray-200 p-2">
                <div className="flex justify-around">
                  {['Home', 'Transactions', 'Budgets', 'Goals', 'More'].map((item, index) => (
                    <button
                      key={item}
                      className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 min-w-[60px] touch-manipulation ${
                        index === 0 ? 'text-blue-600' : 'text-gray-600'
                      }`}
                    >
                      <div className={`p-2 rounded-full ${index === 0 ? 'bg-blue-100' : 'bg-transparent'}`}>
                        <div className="w-5 h-5 bg-current opacity-60 rounded-full"></div>
                      </div>
                      <span className="text-xs mt-1 font-medium">{item}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Performance Metrics</h2>
              <div className="flex space-x-2">
                <button
                  onClick={runTests}
                  disabled={isTestRunning}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 touch-manipulation"
                >
                  <Play className="w-4 h-4" />
                  <span>{isTestRunning ? 'Running...' : 'Run Tests'}</span>
                </button>
                <button
                  onClick={runValidation}
                  disabled={isValidating}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 touch-manipulation"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>{isValidating ? 'Validating...' : 'Validate'}</span>
                </button>
              </div>
            </div>

            {/* Current Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {vitalsScore?.score || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Vitals Score</div>
                <div className="text-xs text-gray-500 mt-1">
                  Grade: {vitalsScore?.grade || 'N/A'}
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {metrics?.vitals?.LCP ? `${Math.round(metrics.vitals.LCP)}ms` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">LCP</div>
                <div className="text-xs text-gray-500 mt-1">Largest Contentful Paint</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {metrics?.vitals?.FID ? `${Math.round(metrics.vitals.FID)}ms` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">FID</div>
                <div className="text-xs text-gray-500 mt-1">First Input Delay</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {metrics?.vitals?.CLS ? metrics.vitals.CLS.toFixed(3) : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">CLS</div>
                <div className="text-xs text-gray-500 mt-1">Cumulative Layout Shift</div>
              </div>
            </div>

            {/* Test Results */}
            {testResults.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Performance Test Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {testResults.map((result) => (
                    <div
                      key={result.testName}
                      className={`p-3 rounded-lg border ${
                        result.success
                          ? 'bg-green-50 border-green-200 text-green-800'
                          : 'bg-red-50 border-red-200 text-red-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{result.testName}</span>
                        <span className="text-xs">
                          {result.success ? '✅' : '❌'}
                        </span>
                      </div>
                      <div className="text-xs opacity-75">
                        {Math.round(result.metrics.duration)}ms
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Validation Results */}
            {validationResults.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Device Validation Results</h3>
                <div className="space-y-3">
                  {validationResults.map((result) => (
                    <div
                      key={result.scenario}
                      className={`p-4 rounded-lg border ${
                        result.passed
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{result.scenario}</span>
                        <span className={`text-sm ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                          {result.passed ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                      {result.issues.length > 0 && (
                        <div className="text-sm text-red-600">
                          <div className="font-medium">Issues:</div>
                          <ul className="list-disc list-inside text-xs">
                            {result.issues.map((issue, index) => (
                              <li key={index}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {result.recommendations.length > 0 && (
                        <div className="text-sm text-blue-600 mt-2">
                          <div className="font-medium">Recommendations:</div>
                          <ul className="list-disc list-inside text-xs">
                            {result.recommendations.map((rec, index) => (
                              <li key={index}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Optimization Priorities */}
            {validationResults.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Optimization Priorities</h3>
                <div className="space-y-2">
                  {getOptimizationPriorities().slice(0, 5).map((priority, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        priority.priority === 'high'
                          ? 'bg-red-50 border-red-200'
                          : priority.priority === 'medium'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{priority.recommendation}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          priority.priority === 'high'
                            ? 'bg-red-100 text-red-700'
                            : priority.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {priority.priority.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Affects: {priority.scenarios.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}