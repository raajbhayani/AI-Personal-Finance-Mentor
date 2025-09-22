'use client';

import React, { useState, useMemo } from 'react';
import { PieChart, BarChart3, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';
import Select from '../ui/Select';
import { formatCurrency } from '../../lib/utils/dashboard';
import { Transaction } from './TransactionTable';
import { cn } from '../../lib/utils/cn';

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  color: string;
  icon: string;
}

interface CategoryBreakdownProps {
  transactions: Transaction[];
  dateRange?: 'week' | 'month' | 'quarter' | 'year';
  onDateRangeChange?: (range: string) => void;
}

const categoryColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
];

const categoryIcons: Record<string, string> = {
  salary: '💼',
  freelance: '💻',
  business: '🏢',
  investment: '📈',
  food: '🍽️',
  transport: '🚗',
  shopping: '🛍️',
  entertainment: '🎬',
  bills: '⚡',
  healthcare: '🏥',
  education: '📚',
  travel: '✈️',
  home: '🏠',
  insurance: '🛡️',
  fitness: '💪',
  other: '📦',
};

export default function CategoryBreakdown({
  transactions,
  dateRange = 'month',
  onDateRangeChange,
}: CategoryBreakdownProps) {
  const [selectedType, setSelectedType] = useState<'income' | 'expense' | 'both'>('expense');
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

  // Filter transactions by type and calculate category data
  const categoryData = useMemo(() => {
    const filteredTransactions = transactions.filter(t => {
      if (selectedType === 'both') return true;
      return t.type === selectedType;
    });

    const categoryTotals = filteredTransactions.reduce((acc, transaction) => {
      const category = transaction.category;
      if (!acc[category]) {
        acc[category] = {
          amount: 0,
          count: 0,
        };
      }
      acc[category].amount += transaction.amount;
      acc[category].count += 1;
      return acc;
    }, {} as Record<string, { amount: number; count: number }>);

    const totalAmount = Object.values(categoryTotals).reduce((sum, cat) => sum + cat.amount, 0);

    const data: CategoryData[] = Object.entries(categoryTotals)
      .map(([category, data], index) => ({
        category,
        amount: data.amount,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
        transactionCount: data.count,
        color: categoryColors[index % categoryColors.length],
        icon: categoryIcons[category] || '📦',
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10); // Top 10 categories

    return { data, totalAmount };
  }, [transactions, selectedType]);

  // Generate pie chart
  const generatePieChart = () => {
    let currentAngle = 0;
    const radius = 100;
    const centerX = 120;
    const centerY = 120;

    return categoryData.data.map((category) => {
      const startAngle = currentAngle;
      const endAngle = currentAngle + (category.percentage / 100) * 360;

      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;

      const x1 = centerX + radius * Math.cos(startAngleRad);
      const y1 = centerY + radius * Math.sin(startAngleRad);
      const x2 = centerX + radius * Math.cos(endAngleRad);
      const y2 = centerY + radius * Math.sin(endAngleRad);

      const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z',
      ].join(' ');

      currentAngle = endAngle;

      return {
        ...category,
        pathData,
      };
    });
  };

  const pieSegments = chartType === 'pie' ? generatePieChart() : [];

  const dateRangeOptions = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
  ];

  const typeOptions = [
    { value: 'expense', label: 'Expenses', icon: <TrendingDown className="h-4 w-4" /> },
    { value: 'income', label: 'Income', icon: <TrendingUp className="h-4 w-4" /> },
    { value: 'both', label: 'Both', icon: <BarChart3 className="h-4 w-4" /> },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Category Breakdown</CardTitle>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setChartType('pie')}
                className={cn(
                  'p-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  chartType === 'pie'
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                )}
                aria-label="Switch to pie chart view"
                aria-pressed={chartType === 'pie'}
              >
                <PieChart className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={cn(
                  'p-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  chartType === 'bar'
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                )}
                aria-label="Switch to bar chart view"
                aria-pressed={chartType === 'bar'}
              >
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Select
              options={typeOptions}
              value={selectedType}
              onChange={(value) => setSelectedType(value as any)}
            />
            <Select
              options={dateRangeOptions}
              value={dateRange}
              onChange={(value) => onDateRangeChange?.(value)}
            />
          </div>
        </CardHeader>

        <CardContent>
          {chartType === 'pie' ? (
            <div className="flex justify-center">
              <div className="relative">
                <svg
                  width="240"
                  height="240"
                  className="transform -rotate-90"
                  role="img"
                  aria-labelledby="pie-chart-title"
                  aria-describedby="pie-chart-desc"
                >
                  <title id="pie-chart-title">Category breakdown pie chart</title>
                  <desc id="pie-chart-desc">
                    {`Pie chart showing ${selectedType} breakdown by category. Total: ${formatCurrency(categoryData.totalAmount)}`}
                  </desc>
                  {pieSegments.map((segment) => (
                    <path
                      key={segment.category}
                      d={segment.pathData}
                      fill={segment.color}
                      className="hover:opacity-80 transition-opacity duration-200 cursor-pointer focus:outline-none focus:opacity-80"
                      tabIndex={0}
                      role="button"
                      aria-label={`${segment.category}: ${formatCurrency(segment.amount)} (${segment.percentage.toFixed(1)}%)`}
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">
                      {formatCurrency(categoryData.totalAmount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Total {selectedType === 'both' ? 'Amount' : selectedType}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {categoryData.data.map((category, index) => (
                <div key={category.category} className="flex items-center">
                  <div className="flex items-center flex-1 min-w-0">
                    <span className="text-lg mr-2">{category.icon}</span>
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {category.category.charAt(0).toUpperCase() + category.category.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 ml-4">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${category.percentage}%`,
                          backgroundColor: category.color,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-16 text-right">
                      {formatCurrency(category.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend/Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {categoryData.data.map((category) => (
              <div
                key={category.category}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-lg">{category.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {category.category.charAt(0).toUpperCase() + category.category.slice(1)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {category.transactionCount} transaction{category.transactionCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(category.amount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {category.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>

          {categoryData.data.length === 0 && (
            <div className="text-center py-8" role="status" aria-live="polite">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
              <p className="text-gray-500">
                No {selectedType === 'both' ? 'transactions' : selectedType} data for this period
              </p>
            </div>
          )}

          {/* Summary */}
          {categoryData.data.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {categoryData.data.length}
                  </div>
                  <div className="text-sm text-gray-600">Categories</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {categoryData.data.reduce((sum, cat) => sum + cat.transactionCount, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Transactions</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}