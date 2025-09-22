'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  PieChart,
  BarChart3,
  FileText
} from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import Select from '../ui/Select';
import SpendingPatternsChart from '../charts/SpendingPatternsChart';
import CategoryAnalysisChart from '../charts/CategoryAnalysisChart';
import BudgetComparisonChart from '../charts/BudgetComparisonChart';
import { formatCurrency, formatDate } from '../../lib/utils/dashboard';
import { cn } from '../../lib/utils/cn';

interface MonthlyReportsPageProps {
  className?: string;
}

interface ReportSummary {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  savingsRate: number;
  budgetAdherence: number;
  previousMonthComparison: {
    income: number;
    expenses: number;
    savings: number;
  };
}

const mockReportSummary: ReportSummary = {
  totalIncome: 5500,
  totalExpenses: 4200,
  netIncome: 1300,
  savingsRate: 23.6,
  budgetAdherence: 87.5,
  previousMonthComparison: {
    income: 5.2,
    expenses: -8.3,
    savings: 12.7
  }
};

export default function MonthlyReportsPage({ className }: MonthlyReportsPageProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportType, setReportType] = useState<'overview' | 'detailed'>('overview');

  const monthOptions = [
    { value: 0, label: 'January' },
    { value: 1, label: 'February' },
    { value: 2, label: 'March' },
    { value: 3, label: 'April' },
    { value: 4, label: 'May' },
    { value: 5, label: 'June' },
    { value: 6, label: 'July' },
    { value: 7, label: 'August' },
    { value: 8, label: 'September' },
    { value: 9, label: 'October' },
    { value: 10, label: 'November' },
    { value: 11, label: 'December' },
  ];

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year, label: year.toString() };
  });

  const reportTypeOptions = [
    { value: 'overview', label: 'Overview Report' },
    { value: 'detailed', label: 'Detailed Analysis' },
  ];

  const currentMonthName = monthOptions[selectedMonth].label;
  const reportSummary = mockReportSummary;

  // Calculate key metrics
  const keyMetrics = useMemo(() => {
    return [
      {
        title: 'Total Income',
        value: formatCurrency(reportSummary.totalIncome),
        change: reportSummary.previousMonthComparison.income,
        icon: <TrendingUp className="h-6 w-6" />,
        color: 'emerald'
      },
      {
        title: 'Total Expenses',
        value: formatCurrency(reportSummary.totalExpenses),
        change: reportSummary.previousMonthComparison.expenses,
        icon: <TrendingDown className="h-6 w-6" />,
        color: 'red'
      },
      {
        title: 'Net Income',
        value: formatCurrency(reportSummary.netIncome),
        change: reportSummary.previousMonthComparison.savings,
        icon: <DollarSign className="h-6 w-6" />,
        color: 'blue'
      },
      {
        title: 'Savings Rate',
        value: `${reportSummary.savingsRate}%`,
        change: reportSummary.previousMonthComparison.savings,
        icon: <Target className="h-6 w-6" />,
        color: 'purple'
      }
    ];
  }, [reportSummary]);

  const handleExportReport = () => {
    // Generate and download report
    const reportData = {
      month: currentMonthName,
      year: selectedYear,
      summary: reportSummary,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${currentMonthName.toLowerCase()}-${selectedYear}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getColorClasses = (color: string) => {
    const colors = {
      emerald: 'text-emerald-600 bg-emerald-100',
      red: 'text-red-600 bg-red-100',
      blue: 'text-blue-600 bg-blue-100',
      purple: 'text-purple-600 bg-purple-100'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive analysis of your financial performance
          </p>
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <Select
            options={monthOptions}
            value={selectedMonth}
            onChange={(value) => setSelectedMonth(Number(value))}
            className="sm:w-32"
          />
          <Select
            options={yearOptions}
            value={selectedYear}
            onChange={(value) => setSelectedYear(Number(value))}
            className="sm:w-24"
          />
          <Select
            options={reportTypeOptions}
            value={reportType}
            onChange={(value) => setReportType(value as any)}
            className="sm:w-40"
          />
          <Button onClick={handleExportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Report Header Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {currentMonthName} {selectedYear} Financial Report
              </h2>
              <p className="text-blue-100">
                Generated on {formatDate(new Date().toISOString(), 'long')}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {formatCurrency(reportSummary.netIncome)}
              </div>
              <div className="text-blue-100">Net Income</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {keyMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {metric.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metric.value}
                  </p>
                  <div className={cn(
                    'flex items-center space-x-1 text-sm mt-2',
                    metric.change > 0 ? 'text-emerald-600' : 'text-red-600'
                  )}>
                    {metric.change > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span>
                      {Math.abs(metric.change).toFixed(1)}% vs last month
                    </span>
                  </div>
                </div>
                <div className={cn(
                  'p-3 rounded-full',
                  getColorClasses(metric.color)
                )}>
                  {metric.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Budget Adherence and Goals Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Budget Adherence</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Overall Budget Performance
                </span>
                <span className="text-2xl font-bold text-emerald-600">
                  {reportSummary.budgetAdherence}%
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${reportSummary.budgetAdherence}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-emerald-50 rounded-lg p-3">
                  <div className="text-sm text-emerald-600 mb-1">Under Budget</div>
                  <div className="font-semibold text-emerald-900">5 categories</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <div className="text-sm text-red-600 mb-1">Over Budget</div>
                  <div className="font-semibold text-red-900">2 categories</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>Savings Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {reportSummary.savingsRate}%
                </div>
                <div className="text-sm text-gray-600">Savings Rate</div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Amount Saved</span>
                  <span className="font-semibold">
                    {formatCurrency(reportSummary.netIncome)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Monthly Goal</span>
                  <span className="font-semibold text-emerald-600">
                    {formatCurrency(1500)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="font-semibold text-blue-600">
                    {((reportSummary.netIncome / 1500) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="space-y-8">
        {/* Spending Patterns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Spending Patterns</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingPatternsChart
              data={[]}
              dateRange="month"
              onDateRangeChange={() => {}}
            />
          </CardContent>
        </Card>

        {/* Category Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>Category Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryAnalysisChart
              data={[]}
              totalAmount={4000}
            />
          </CardContent>
        </Card>

        {/* Budget Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Budget vs Actual</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BudgetComparisonChart
              data={[]}
              period="month"
            />
          </CardContent>
        </Card>
      </div>

      {/* Summary and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Summary & Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Key Highlights</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2"></div>
                  <span>Successfully saved {reportSummary.savingsRate}% of income this month</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                  <span>Maintained {reportSummary.budgetAdherence}% budget adherence</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2"></div>
                  <span>Food expenses exceeded budget by 50%</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2"></div>
                  <span>Transportation costs came in 4% under budget</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Recommendations</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                  <span>Consider meal planning to reduce food spending</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2"></div>
                  <span>Increase emergency fund contribution by $200/month</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2"></div>
                  <span>Review and adjust food budget for next month</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2"></div>
                  <span>Set up automated savings transfers</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}