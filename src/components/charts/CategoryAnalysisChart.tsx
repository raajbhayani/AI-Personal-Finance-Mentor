'use client';

import React, { useMemo, useState } from 'react';
import { PieChart as PieIcon, BarChart3, TrendingUp, TrendingDown, Info } from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { DoughnutChart, BarChart, getThemeColors } from './ChartWrapper';
import { formatCurrency } from '../../lib/utils/dashboard';
import { cn } from '../../lib/utils/cn';
import { ChartData, ChartOptions } from 'chart.js';

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  previousAmount?: number;
  icon: string;
}

interface CategoryAnalysisChartProps {
  data: CategoryData[];
  totalAmount: number;
  className?: string;
}

const categoryIcons: Record<string, string> = {
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

const mockCategoryData: CategoryData[] = [
  {
    category: 'food',
    amount: 1200,
    percentage: 30,
    transactionCount: 45,
    previousAmount: 1100,
    icon: '🍽️'
  },
  {
    category: 'transport',
    amount: 800,
    percentage: 20,
    transactionCount: 28,
    previousAmount: 750,
    icon: '🚗'
  },
  {
    category: 'bills',
    amount: 600,
    percentage: 15,
    transactionCount: 12,
    previousAmount: 620,
    icon: '⚡'
  },
  {
    category: 'shopping',
    amount: 500,
    percentage: 12.5,
    transactionCount: 18,
    previousAmount: 400,
    icon: '🛍️'
  },
  {
    category: 'entertainment',
    amount: 400,
    percentage: 10,
    transactionCount: 22,
    previousAmount: 350,
    icon: '🎬'
  },
  {
    category: 'healthcare',
    amount: 300,
    percentage: 7.5,
    transactionCount: 8,
    previousAmount: 250,
    icon: '🏥'
  },
  {
    category: 'fitness',
    amount: 200,
    percentage: 5,
    transactionCount: 15,
    previousAmount: 180,
    icon: '💪'
  }
];

export default function CategoryAnalysisChart({
  data = mockCategoryData,
  totalAmount = 4000,
  className
}: CategoryAnalysisChartProps) {
  const [chartType, setChartType] = useState<'doughnut' | 'bar'>('doughnut');

  // Prepare chart data
  const chartData: ChartData<'doughnut' | 'bar'> = useMemo(() => {
    const colors = getThemeColors(data.length);

    return {
      labels: data.map(item =>
        item.category.charAt(0).toUpperCase() + item.category.slice(1)
      ),
      datasets: [{
        label: 'Spending by Category',
        data: data.map(item => item.amount),
        backgroundColor: colors,
        borderColor: colors.map(color => color.replace('0.8', '1')),
        borderWidth: 2,
        hoverOffset: 4
      }]
    };
  }, [data]);

  // Chart options for doughnut
  const doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels && data.datasets.length) {
              return data.labels.map((label, i) => {
                const dataset = data.datasets[0];
                const value = dataset.data[i] as number;
                const percentage = ((value / totalAmount) * 100).toFixed(1);

                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: dataset.backgroundColor?.[i] as string,
                  strokeStyle: dataset.borderColor?.[i] as string,
                  lineWidth: dataset.borderWidth as number,
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed;
            const percentage = ((value / totalAmount) * 100).toFixed(1);
            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
          }
        }
      }
    }
  };

  // Chart options for bar
  const barOptions: ChartOptions<'bar'> = {
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
            const percentage = ((value / totalAmount) * 100).toFixed(1);
            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
          }
        }
      }
    },
    scales: {
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

  // Calculate insights
  const insights = useMemo(() => {
    const topCategory = data[0];
    const categoryWithMostTransactions = data.reduce((prev, current) =>
      prev.transactionCount > current.transactionCount ? prev : current
    );

    const categoriesWithIncrease = data.filter(cat =>
      cat.previousAmount && cat.amount > cat.previousAmount
    );

    const categoriesWithDecrease = data.filter(cat =>
      cat.previousAmount && cat.amount < cat.previousAmount
    );

    const biggestIncrease = categoriesWithIncrease.reduce((prev, current) => {
      const prevIncrease = prev.previousAmount ? prev.amount - prev.previousAmount : 0;
      const currentIncrease = current.previousAmount ? current.amount - current.previousAmount : 0;
      return currentIncrease > prevIncrease ? current : prev;
    }, categoriesWithIncrease[0]);

    const biggestDecrease = categoriesWithDecrease.reduce((prev, current) => {
      const prevDecrease = prev.previousAmount ? prev.previousAmount - prev.amount : 0;
      const currentDecrease = current.previousAmount ? current.previousAmount - current.amount : 0;
      return currentDecrease > prevDecrease ? current : prev;
    }, categoriesWithDecrease[0]);

    return {
      topCategory,
      categoryWithMostTransactions,
      biggestIncrease,
      biggestDecrease,
      totalCategories: data.length
    };
  }, [data]);

  return (
    <div className={className}>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Category Breakdown Chart */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Spending by Category</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={chartType === 'doughnut' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartType('doughnut')}
                    className="p-2"
                  >
                    <PieIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={chartType === 'bar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartType('bar')}
                    className="p-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {chartType === 'doughnut' ? (
                <DoughnutChart
                  data={chartData}
                  options={doughnutOptions}
                  height={400}
                />
              ) : (
                <BarChart
                  data={chartData}
                  options={barOptions}
                  height={400}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Category Details and Insights */}
        <div className="space-y-6">
          {/* Top Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Category Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.slice(0, 5).map((category, index) => {
                  const change = category.previousAmount
                    ? ((category.amount - category.previousAmount) / category.previousAmount) * 100
                    : 0;

                  return (
                    <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{category.icon}</span>
                        <div>
                          <div className="font-medium text-gray-900 capitalize">
                            {category.category}
                          </div>
                          <div className="text-sm text-gray-500">
                            {category.transactionCount} transactions
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(category.amount)}
                        </div>
                        {category.previousAmount && (
                          <div className={cn(
                            'text-xs flex items-center space-x-1',
                            change > 0 ? 'text-red-600' : 'text-emerald-600'
                          )}>
                            {change > 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            <span>{Math.abs(change).toFixed(1)}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Info className="h-5 w-5" />
                <span>Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Top spending category */}
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="text-sm font-medium text-blue-900 mb-1">
                    Highest Spending
                  </div>
                  <div className="text-sm text-blue-700">
                    <span className="capitalize font-semibold">{insights.topCategory?.category}</span> accounts for{' '}
                    <span className="font-semibold">{insights.topCategory?.percentage.toFixed(1)}%</span> of your total spending
                  </div>
                </div>

                {/* Most frequent category */}
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                  <div className="text-sm font-medium text-emerald-900 mb-1">
                    Most Frequent
                  </div>
                  <div className="text-sm text-emerald-700">
                    <span className="capitalize font-semibold">{insights.categoryWithMostTransactions?.category}</span> has{' '}
                    <span className="font-semibold">{insights.categoryWithMostTransactions?.transactionCount}</span> transactions this period
                  </div>
                </div>

                {/* Biggest increase */}
                {insights.biggestIncrease && (
                  <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                    <div className="text-sm font-medium text-red-900 mb-1">
                      Biggest Increase
                    </div>
                    <div className="text-sm text-red-700">
                      <span className="capitalize font-semibold">{insights.biggestIncrease.category}</span> increased by{' '}
                      <span className="font-semibold">
                        {formatCurrency(insights.biggestIncrease.amount - (insights.biggestIncrease.previousAmount || 0))}
                      </span>
                    </div>
                  </div>
                )}

                {/* Biggest decrease */}
                {insights.biggestDecrease && (
                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                    <div className="text-sm font-medium text-amber-900 mb-1">
                      Biggest Savings
                    </div>
                    <div className="text-sm text-amber-700">
                      <span className="capitalize font-semibold">{insights.biggestDecrease.category}</span> decreased by{' '}
                      <span className="font-semibold">
                        {formatCurrency((insights.biggestDecrease.previousAmount || 0) - insights.biggestDecrease.amount)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Recommendation */}
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <div className="text-sm font-medium text-purple-900 mb-1">
                    💡 Recommendation
                  </div>
                  <div className="text-sm text-purple-700">
                    Consider setting a budget limit for {insights.topCategory?.category} to better control your largest expense category.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}