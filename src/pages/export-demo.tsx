import Layout from '@/components/layout/Layout';
import ExportControls from '@/components/reports/ExportControls';
import { ComponentErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function ExportDemoPage() {
  return (
    <Layout>
      <ComponentErrorBoundary componentName="ExportDemo">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Export Demo</h1>
            <p className="text-gray-600">
              Comprehensive demonstration of the data export features. Test CSV and PDF exports for transactions, goals, budgets, and comprehensive reports.
            </p>
          </div>

          {/* Export Controls */}
          <ExportControls />

          {/* Feature Overview */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Export Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Data Types</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• <strong>Transaction History:</strong> Detailed records with categories, notes, and merchant info</li>
                  <li>• <strong>Goal Progress:</strong> Goal summaries with progress tracking and target dates</li>
                  <li>• <strong>Budget Analysis:</strong> Budget utilization and spending analysis</li>
                  <li>• <strong>Comprehensive Report:</strong> Complete financial overview combining all data types</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">Export Formats</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• <strong>CSV Format:</strong> Spreadsheet-compatible data for analysis</li>
                  <li>• <strong>PDF Reports:</strong> Formatted documents with charts and summaries</li>
                  <li>• <strong>Date Range Selection:</strong> Filter data by custom or preset date ranges</li>
                  <li>• <strong>Export Options:</strong> Include/exclude categories, notes, and other metadata</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Use</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p>1. <strong>Select Data Type:</strong> Choose from transactions, goals, budgets, or comprehensive report</p>
              <p>2. <strong>Choose Format:</strong> Pick between CSV (spreadsheet data) or PDF (formatted report)</p>
              <p>3. <strong>Set Date Range:</strong> Use preset ranges or select custom dates for transactions</p>
              <p>4. <strong>Configure Options:</strong> Include or exclude additional data like categories and notes</p>
              <p>5. <strong>Export:</strong> Click the export button to download your data</p>
            </div>
          </div>

          {/* Technical Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Technical Implementation</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">CSV Export Features</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Proper CSV formatting with escaped special characters</li>
                  <li>• Date filtering and data transformation</li>
                  <li>• Calculated fields (progress percentages, remaining amounts)</li>
                  <li>• Automatic file naming with timestamps</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">PDF Report Features</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Professional formatting with headers and summaries</li>
                  <li>• Progress bars and visual indicators</li>
                  <li>• Multi-page support with proper pagination</li>
                  <li>• Charts and graphs integration (future enhancement)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Demo Data Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-3">Demo Data</h3>
            <p className="text-sm text-yellow-800">
              This demo uses mock financial data to showcase the export functionality. In a real application,
              this would connect to your actual financial data sources and user accounts.
            </p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-yellow-700">
              <div>
                <strong>Sample Transactions:</strong> 5 records including income and expenses
              </div>
              <div>
                <strong>Sample Goals:</strong> 3 goals with varying progress levels
              </div>
              <div>
                <strong>Sample Budgets:</strong> 3 budget categories with utilization data
              </div>
            </div>
          </div>
        </div>
      </ComponentErrorBoundary>
    </Layout>
  );
}