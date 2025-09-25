'use client';

import React, { useState } from 'react';
import {
  Download,
  FileText,
  FileSpreadsheet,
  Calendar,
  Settings,
  CheckCircle,
  Clock,
  AlertCircle,
  Target,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import DateRangePicker, { DateRange, useDateRange } from '../ui/DateRangePicker';
import { useFormSubmission } from '@/hooks/useApiState';
import { ButtonLoading } from '../ui/Loading';
import ErrorDisplay from '../ui/ErrorDisplay';
import { useNotification } from '@/contexts/NotificationContext';
import { cn } from '@/lib/utils/cn';

// Import export functions
import {
  exportTransactionsCSV,
  exportGoalsCSV,
  exportBudgetsCSV,
  ExportOptions,
  Transaction,
  Goal,
  Budget
} from '@/lib/utils/exportUtils';

import {
  generateTransactionReport,
  generateGoalProgressReport,
  generateBudgetReport,
  generateComprehensiveReport
} from '@/lib/utils/pdfUtils';

export type ExportType = 'transactions' | 'goals' | 'budgets' | 'comprehensive';
export type ExportFormat = 'csv' | 'pdf';

interface ExportOption {
  id: ExportType;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  formats: ExportFormat[];
  color: string;
  iconColor: string;
}

interface ExportControlsProps {
  transactions?: Transaction[];
  goals?: Goal[];
  budgets?: Budget[];
  className?: string;
}

// Mock data for demonstration
const mockTransactions: Transaction[] = [
  {
    id: '1',
    date: new Date('2024-01-15'),
    description: 'Grocery Shopping',
    amount: -89.45,
    category: 'Food & Dining',
    type: 'expense',
    merchant: 'Whole Foods Market',
    notes: 'Weekly groceries'
  },
  {
    id: '2',
    date: new Date('2024-01-14'),
    description: 'Salary Deposit',
    amount: 3500.00,
    category: 'Income',
    type: 'income',
    merchant: 'Acme Corp'
  },
  {
    id: '3',
    date: new Date('2024-01-12'),
    description: 'Gas Station',
    amount: -45.67,
    category: 'Transportation',
    type: 'expense',
    merchant: 'Shell Gas Station'
  },
  {
    id: '4',
    date: new Date('2024-01-10'),
    description: 'Coffee Shop',
    amount: -12.50,
    category: 'Food & Dining',
    type: 'expense',
    merchant: 'Starbucks'
  },
  {
    id: '5',
    date: new Date('2024-01-08'),
    description: 'Freelance Payment',
    amount: 500.00,
    category: 'Income',
    type: 'income',
    merchant: 'Client ABC'
  }
];

const mockGoals: Goal[] = [
  {
    id: '1',
    title: 'Emergency Fund',
    targetAmount: 10000,
    currentAmount: 7500,
    category: 'Savings',
    targetDate: new Date('2024-12-31'),
    createdDate: new Date('2024-01-01'),
    status: 'active',
    description: 'Build emergency fund for 6 months of expenses'
  },
  {
    id: '2',
    title: 'Vacation Fund',
    targetAmount: 5000,
    currentAmount: 2250,
    category: 'Travel',
    targetDate: new Date('2024-07-01'),
    createdDate: new Date('2024-01-01'),
    status: 'active',
    description: 'Save for summer vacation to Europe'
  },
  {
    id: '3',
    title: 'New Car',
    targetAmount: 25000,
    currentAmount: 25000,
    category: 'Transportation',
    targetDate: new Date('2024-01-15'),
    createdDate: new Date('2023-06-01'),
    status: 'completed',
    description: 'Save for down payment on new car'
  }
];

const mockBudgets: Budget[] = [
  {
    id: '1',
    name: 'Groceries',
    category: 'Food & Dining',
    budgetAmount: 500,
    spentAmount: 342.50,
    period: 'monthly',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31')
  },
  {
    id: '2',
    name: 'Transportation',
    category: 'Transportation',
    budgetAmount: 300,
    spentAmount: 275.80,
    period: 'monthly',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31')
  },
  {
    id: '3',
    name: 'Entertainment',
    category: 'Entertainment',
    budgetAmount: 200,
    spentAmount: 156.75,
    period: 'monthly',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31')
  }
];

export default function ExportControls({
  transactions = mockTransactions,
  goals = mockGoals,
  budgets = mockBudgets,
  className
}: ExportControlsProps) {
  const { dateRange, setDateRange } = useDateRange();
  const [selectedExportType, setSelectedExportType] = useState<ExportType>('transactions');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    dateRange,
    includeCategories: true,
    includeNotes: false,
    currency: 'USD'
  });

  const { submit, isSubmitting, error } = useFormSubmission();
  const { addNotification } = useNotification();

  const exportTypes: ExportOption[] = [
    {
      id: 'transactions',
      title: 'Transaction History',
      description: 'Export detailed transaction records with categories and notes',
      icon: DollarSign,
      formats: ['csv', 'pdf'],
      color: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-600'
    },
    {
      id: 'goals',
      title: 'Goal Progress',
      description: 'Export goal summaries with progress tracking and target dates',
      icon: Target,
      formats: ['csv', 'pdf'],
      color: 'bg-green-50 border-green-200',
      iconColor: 'text-green-600'
    },
    {
      id: 'budgets',
      title: 'Budget Analysis',
      description: 'Export budget utilization and spending analysis',
      icon: TrendingUp,
      formats: ['csv', 'pdf'],
      color: 'bg-purple-50 border-purple-200',
      iconColor: 'text-purple-600'
    },
    {
      id: 'comprehensive',
      title: 'Comprehensive Report',
      description: 'Complete financial overview with all data types',
      icon: FileText,
      formats: ['pdf'],
      color: 'bg-gray-50 border-gray-200',
      iconColor: 'text-gray-600'
    }
  ];

  const selectedExportOption = exportTypes.find(type => type.id === selectedExportType);

  const handleExport = async () => {
    const options = {
      ...exportOptions,
      dateRange
    };

    const exportData = {
      transactions,
      goals,
      budgets,
      summary: {
        totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        totalExpenses: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0),
        netAmount: 0,
        transactionCount: transactions.length,
        dateRange: `${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}`,
        generatedAt: new Date()
      }
    };

    exportData.summary.netAmount = exportData.summary.totalIncome - exportData.summary.totalExpenses;

    try {
      await submit(
        { type: selectedExportType, format: selectedFormat, options },
        async () => {
          // Simulate export processing
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Perform the actual export
          switch (selectedExportType) {
            case 'transactions':
              if (selectedFormat === 'csv') {
                exportTransactionsCSV(transactions, options);
              } else {
                generateTransactionReport(transactions, dateRange);
              }
              break;
            case 'goals':
              if (selectedFormat === 'csv') {
                exportGoalsCSV(goals);
              } else {
                generateGoalProgressReport(goals);
              }
              break;
            case 'budgets':
              if (selectedFormat === 'csv') {
                exportBudgetsCSV(budgets);
              } else {
                generateBudgetReport(budgets);
              }
              break;
            case 'comprehensive':
              generateComprehensiveReport(exportData);
              break;
          }

          return { success: true };
        },
        {
          successMessage: `${selectedExportOption?.title} exported successfully!`,
          errorMessage: 'Export failed. Please try again.'
        }
      );

      addNotification({
        type: 'success',
        title: 'Export Complete',
        message: `Your ${selectedExportOption?.title.toLowerCase()} has been downloaded as ${selectedFormat.toUpperCase()}.`,
        priority: 'medium'
      });
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const getDataCount = (type: ExportType): number => {
    switch (type) {
      case 'transactions':
        return transactions.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate >= dateRange.startDate && transactionDate <= dateRange.endDate;
        }).length;
      case 'goals':
        return goals.length;
      case 'budgets':
        return budgets.length;
      case 'comprehensive':
        return transactions.length + goals.length + budgets.length;
      default:
        return 0;
    }
  };

  const getEstimatedFileSize = (): string => {
    const dataCount = getDataCount(selectedExportType);
    const baseSize = selectedFormat === 'pdf' ? 50 : 5; // KB
    const sizePerRecord = selectedFormat === 'pdf' ? 2 : 0.5; // KB
    const estimatedSize = baseSize + (dataCount * sizePerRecord);

    if (estimatedSize < 1024) {
      return `~${Math.round(estimatedSize)} KB`;
    } else {
      return `~${(estimatedSize / 1024).toFixed(1)} MB`;
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Download className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Export Data</h2>
          <p className="text-gray-600">Download your financial data in various formats</p>
        </div>
      </div>

      {/* Export Type Selection */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Select Data Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exportTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedExportType === type.id;
            const dataCount = getDataCount(type.id);

            return (
              <button
                key={type.id}
                onClick={() => {
                  setSelectedExportType(type.id);
                  if (!type.formats.includes(selectedFormat)) {
                    setSelectedFormat(type.formats[0]);
                  }
                }}
                className={cn(
                  "p-4 rounded-lg border-2 text-left transition-all hover:shadow-md",
                  isSelected
                    ? `${type.color} border-current`
                    : "bg-white border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-start space-x-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    isSelected ? "bg-white" : type.color
                  )}>
                    <Icon className={cn("w-5 h-5", type.iconColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900">{type.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs text-gray-500">
                        {dataCount} records
                      </span>
                      <div className="flex space-x-1">
                        {type.formats.map(format => (
                          <span
                            key={format}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded uppercase"
                          >
                            {format}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Format Selection */}
      {selectedExportOption && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Export Format</h3>
          <div className="grid grid-cols-2 gap-3">
            {selectedExportOption.formats.map((format) => (
              <button
                key={format}
                onClick={() => setSelectedFormat(format)}
                className={cn(
                  "p-3 rounded-lg border-2 transition-all flex items-center space-x-3",
                  selectedFormat === format
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                )}
              >
                {format === 'csv' ? (
                  <FileSpreadsheet className="w-5 h-5 text-green-600" />
                ) : (
                  <FileText className="w-5 h-5 text-red-600" />
                )}
                <div className="text-left">
                  <div className="font-medium text-gray-900">
                    {format.toUpperCase()}
                  </div>
                  <div className="text-sm text-gray-600">
                    {format === 'csv' ? 'Spreadsheet data' : 'Formatted report'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Date Range Selection (for transactions and comprehensive) */}
      {(selectedExportType === 'transactions' || selectedExportType === 'comprehensive') && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Date Range</h3>
          <DateRangePicker
            value={dateRange}
            onChange={(range) => {
              setDateRange(range);
              setExportOptions(prev => ({ ...prev, dateRange: range }));
            }}
            className="max-w-sm"
          />
        </div>
      )}

      {/* Export Options */}
      {selectedExportType === 'transactions' && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Export Options</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={exportOptions.includeCategories}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  includeCategories: e.target.checked
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Include categories</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={exportOptions.includeNotes}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  includeNotes: e.target.checked
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Include notes and descriptions</span>
            </label>
          </div>
        </div>
      )}

      {/* Export Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Export Summary</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Data Type:</span>
            <span className="font-medium">{selectedExportOption?.title}</span>
          </div>
          <div className="flex justify-between">
            <span>Format:</span>
            <span className="font-medium uppercase">{selectedFormat}</span>
          </div>
          <div className="flex justify-between">
            <span>Records:</span>
            <span className="font-medium">{getDataCount(selectedExportType)}</span>
          </div>
          {(selectedExportType === 'transactions' || selectedExportType === 'comprehensive') && (
            <div className="flex justify-between">
              <span>Date Range:</span>
              <span className="font-medium">
                {dateRange.startDate.toLocaleDateString()} - {dateRange.endDate.toLocaleDateString()}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Estimated Size:</span>
            <span className="font-medium">{getEstimatedFileSize()}</span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <ErrorDisplay
          type="validation"
          variant="card"
          error={error}
          onRetry={handleExport}
        />
      )}

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isSubmitting || getDataCount(selectedExportType) === 0}
        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? (
          <ButtonLoading text="Preparing Export..." />
        ) : (
          <>
            <Download className="w-5 h-5" />
            <span>
              Export {selectedExportOption?.title} as {selectedFormat.toUpperCase()}
            </span>
          </>
        )}
      </button>

      {getDataCount(selectedExportType) === 0 && (
        <div className="text-center py-4">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            No data available for the selected criteria
          </p>
        </div>
      )}
    </div>
  );
}