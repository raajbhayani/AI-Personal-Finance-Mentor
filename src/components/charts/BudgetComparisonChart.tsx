'use client';

import React, { useMemo } from 'react';
import { Target, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';
import { BarChart, LineChart, getThemeColors } from './ChartWrapper';
import { formatCurrency } from '../../lib/utils/dashboard';
import { cn } from '../../lib/utils/cn';
import { ChartData, ChartOptions } from 'chart.js';

interface BudgetItem {
  category: string;
  budgeted: number;
  actual: number;
  icon: string;
}

interface BudgetComparisonChartProps {
  data: BudgetItem[];
  period: 'month' | 'quarter' | 'year';
  className?: string;
}

const mockBudgetData: BudgetItem[] = [
  { category: 'Food & Dining', budgeted: 800, actual: 1200, icon: '🍽️' },
  { category: 'Transportation', budgeted: 500, actual: 480, icon: '🚗' },
  { category: 'Shopping', budgeted: 400, actual: 520, icon: '🛍️' },
  { category: 'Entertainment', budgeted: 300, actual: 280, icon: '🎬' },
  { category: 'Bills & Utilities', budgeted: 600, actual: 580, icon: '⚡' },
  { category: 'Healthcare', budgeted: 200, actual: 320, icon: '🏥' },
  { category: 'Fitness', budgeted: 150, actual: 130, icon: '💪' },
  { category: 'Education', budgeted: 250, actual: 180, icon: '📚' },
];

export default function BudgetComparisonChart({
  data = mockBudgetData,
  period = 'month',
  className
}: BudgetComparisonChartProps) {

  // Prepare comparison chart data
  const comparisonChartData: ChartData<'bar'> = useMemo(() => {
    return {
      labels: data.map(item => item.category),
      datasets: [
        {
          label: 'Budgeted',
          data: data.map(item => item.budgeted),
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Actual',
          data: data.map(item => item.actual),
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1,
          borderRadius: 4,
        }
      ]
    };
  }, [data]);

  // Prepare variance chart data (percentage over/under budget)
  const varianceChartData: ChartData<'bar'> = useMemo(() => {
    const variances = data.map(item => {
      const variance = ((item.actual - item.budgeted) / item.budgeted) * 100;
      return variance;
    });

    return {
      labels: data.map(item => item.category),
      datasets: [{
        label: 'Budget Variance (%)',
        data: variances,
        backgroundColor: variances.map(variance =>
          variance > 0 ? 'rgba(239, 68, 68, 0.7)' : 'rgba(16, 185, 129, 0.7)'
        ),
        borderColor: variances.map(variance =>
          variance > 0 ? 'rgb(239, 68, 68)' : 'rgb(16, 185, 129)'
        ),
        borderWidth: 1,
        borderRadius: 4,
      }]
    };
  }, [data]);

  // Calculate statistics
  const budgetStats = useMemo(() => {
    const totalBudgeted = data.reduce((sum, item) => sum + item.budgeted, 0);
    const totalActual = data.reduce((sum, item) => sum + item.actual, 0);
    const totalVariance = totalActual - totalBudgeted;
    const variancePercentage = (totalVariance / totalBudgeted) * 100;

    const overBudgetCategories = data.filter(item => item.actual > item.budgeted);
    const underBudgetCategories = data.filter(item => item.actual < item.budgeted);
    const onBudgetCategories = data.filter(item =>
      Math.abs(item.actual - item.budgeted) / item.budgeted <= 0.05 // Within 5%
    );

    const biggestOverspend = data.reduce((prev, current) => {
      const prevOverspend = prev.actual - prev.budgeted;
      const currentOverspend = current.actual - current.budgeted;
      return currentOverspend > prevOverspend ? current : prev;
    });

    const biggestUnderspend = data.reduce((prev, current) => {
      const prevUnderspend = prev.budgeted - prev.actual;
      const currentUnderspend = current.budgeted - current.actual;
      return currentUnderspend > prevUnderspend ? current : prev;
    });

    return {
      totalBudgeted,
      totalActual,
      totalVariance,
      variancePercentage,
      overBudgetCategories,
      underBudgetCategories,
      onBudgetCategories,
      biggestOverspend,
      biggestUnderspend
    };
  }, [data]);

  const comparisonOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value as number);
          }
        }
      }
    }
  };

  const varianceOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            return `Variance: ${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        ticks: {
          callback: function(value) {
            return `${value}%`;
          }
        },
        grid: {
          color: function(context) {
            return context.tick.value === 0 ? 'rgba(0, 0, 0, 0.3)' : 'rgba(107, 114, 128, 0.1)';
          }
        }
      }
    }
  };

  return (
    <div className={className}>
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Budget Overview Cards */}
        <div className="xl:col-span-1">
          <div className="space-y-4">
            {/* Total Budget vs Actual */}
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">Total Budget</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(budgetStats.totalBudgeted)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">Total Spent</div>
                  <div className={cn(
                    "text-2xl font-bold",
                    budgetStats.totalVariance > 0 ? "text-red-600" : "text-emerald-600"
                  )}>
                    {formatCurrency(budgetStats.totalActual)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">Variance</div>
                  <div className={cn(
                    "text-xl font-bold flex items-center justify-center space-x-1",
                    budgetStats.totalVariance > 0 ? "text-red-600" : "text-emerald-600"
                  )}>
                    {budgetStats.totalVariance > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span>
                      {budgetStats.totalVariance > 0 ? '+' : ''}
                      {formatCurrency(budgetStats.totalVariance)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {budgetStats.variancePercentage > 0 ? '+' : ''}
                    {budgetStats.variancePercentage.toFixed(1)}%
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Budget Status Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Budget Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm text-gray-600">On Track</span>
                  </div>
                  <span className="text-sm font-medium">
                    {budgetStats.onBudgetCategories.length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-gray-600">Over Budget</span>
                  </div>
                  <span className="text-sm font-medium">
                    {budgetStats.overBudgetCategories.length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm text-gray-600">Under Budget</span>
                  </div>
                  <span className="text-sm font-medium">
                    {budgetStats.underBudgetCategories.length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Charts */}
        <div className="xl:col-span-3 space-y-6">
          {/* Budget vs Actual Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Budget vs Actual Spending</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                data={comparisonChartData}
                options={comparisonOptions}
                height={300}
              />
            </CardContent>
          </Card>

          {/* Budget Variance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Variance by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                data={varianceChartData}
                options={varianceOptions}
                height={250}
              />
            </CardContent>
          </Card>

          {/* Detailed Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Category Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.map((item) => {
                  const variance = item.actual - item.budgeted;
                  const variancePercentage = (variance / item.budgeted) * 100;
                  const isOverBudget = variance > 0;
                  const isSignificantVariance = Math.abs(variancePercentage) > 5;

                  return (
                    <div
                      key={item.category}
                      className={cn(
                        'flex items-center justify-between p-4 rounded-lg border',
                        isOverBudget && isSignificantVariance
                          ? 'bg-red-50 border-red-200'
                          : !isOverBudget && isSignificantVariance
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-gray-50 border-gray-200'
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{item.icon}</span>
                        <div>
                          <div className="font-medium text-gray-900">
                            {item.category}
                          </div>
                          <div className="text-sm text-gray-600">
                            Budgeted: {formatCurrency(item.budgeted)}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(item.actual)}
                        </div>
                        <div className={cn(
                          'text-sm flex items-center space-x-1',
                          isOverBudget ? 'text-red-600' : 'text-emerald-600'
                        )}>
                          {isOverBudget ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          <span>
                            {variance > 0 ? '+' : ''}{formatCurrency(variance)}
                          </span>
                          <span className="text-xs">
                            ({variancePercentage > 0 ? '+' : ''}{variancePercentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}