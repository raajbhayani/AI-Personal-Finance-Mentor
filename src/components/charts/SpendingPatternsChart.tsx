'use client';

import React, { useMemo } from 'react';
import { TrendingDown, TrendingUp, Calendar } from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';
import Select from '../ui/Select';
import { LineChart, BarChart, getThemeColors, createGradient } from './ChartWrapper';
import { formatCurrency } from '../../lib/utils/dashboard';
import { ChartData, ChartOptions } from 'chart.js';

interface SpendingData {
  date: string;
  amount: number;
  category: string;
}

interface SpendingPatternsChartProps {
  data: SpendingData[];
  dateRange: 'week' | 'month' | 'quarter' | 'year';
  onDateRangeChange: (range: string) => void;
  className?: string;
}

const mockSpendingData: SpendingData[] = [
  // January 2024
  { date: '2024-01-01', amount: 450, category: 'food' },
  { date: '2024-01-01', amount: 120, category: 'transport' },
  { date: '2024-01-01', amount: 80, category: 'entertainment' },
  { date: '2024-01-02', amount: 200, category: 'shopping' },
  { date: '2024-01-03', amount: 350, category: 'bills' },
  { date: '2024-01-05', amount: 90, category: 'food' },
  { date: '2024-01-08', amount: 180, category: 'transport' },
  { date: '2024-01-10', amount: 420, category: 'food' },
  { date: '2024-01-12', amount: 150, category: 'entertainment' },
  { date: '2024-01-15', amount: 300, category: 'shopping' },
  { date: '2024-01-18', amount: 110, category: 'food' },
  { date: '2024-01-20', amount: 95, category: 'transport' },
  { date: '2024-01-22', amount: 250, category: 'bills' },
  { date: '2024-01-25', amount: 180, category: 'entertainment' },
  { date: '2024-01-28', amount: 320, category: 'food' },
  { date: '2024-01-30', amount: 140, category: 'shopping' },

  // February 2024
  { date: '2024-02-01', amount: 480, category: 'food' },
  { date: '2024-02-01', amount: 130, category: 'transport' },
  { date: '2024-02-03', amount: 220, category: 'shopping' },
  { date: '2024-02-05', amount: 380, category: 'bills' },
  { date: '2024-02-08', amount: 95, category: 'food' },
  { date: '2024-02-10', amount: 160, category: 'entertainment' },
  { date: '2024-02-12', amount: 200, category: 'transport' },
  { date: '2024-02-15', amount: 390, category: 'food' },
  { date: '2024-02-18', amount: 170, category: 'shopping' },
  { date: '2024-02-20', amount: 120, category: 'entertainment' },
  { date: '2024-02-22', amount: 100, category: 'transport' },
  { date: '2024-02-25', amount: 280, category: 'bills' },
  { date: '2024-02-28', amount: 150, category: 'food' },

  // March 2024
  { date: '2024-03-01', amount: 520, category: 'food' },
  { date: '2024-03-03', amount: 240, category: 'shopping' },
  { date: '2024-03-05', amount: 400, category: 'bills' },
  { date: '2024-03-08', amount: 110, category: 'food' },
  { date: '2024-03-10', amount: 180, category: 'entertainment' },
  { date: '2024-03-12', amount: 150, category: 'transport' },
  { date: '2024-03-15', amount: 350, category: 'food' },
  { date: '2024-03-18', amount: 190, category: 'shopping' },
  { date: '2024-03-20', amount: 140, category: 'entertainment' },
  { date: '2024-03-22', amount: 90, category: 'transport' },
  { date: '2024-03-25', amount: 300, category: 'bills' },
  { date: '2024-03-28', amount: 170, category: 'food' },
];

export default function SpendingPatternsChart({
  data = mockSpendingData,
  dateRange,
  onDateRangeChange,
  className
}: SpendingPatternsChartProps) {

  const dateRangeOptions = [
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'quarter', label: 'Last 3 Months' },
    { value: 'year', label: 'Last 12 Months' },
  ];

  // Process data for daily spending trend
  const dailySpendingData = useMemo(() => {
    const dailyTotals: Record<string, number> = {};

    data.forEach(item => {
      const date = item.date;
      dailyTotals[date] = (dailyTotals[date] || 0) + item.amount;
    });

    const sortedDates = Object.keys(dailyTotals).sort();
    const last30Days = sortedDates.slice(-30);

    return {
      labels: last30Days.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      datasets: [{
        label: 'Daily Spending',
        data: last30Days.map(date => dailyTotals[date]),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    };
  }, [data]);

  // Process data for weekly comparison
  const weeklyComparisonData = useMemo(() => {
    const weeklyTotals: Record<string, number> = {};

    data.forEach(item => {
      const date = new Date(item.date);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      const weekKey = weekStart.toISOString().split('T')[0];
      weeklyTotals[weekKey] = (weeklyTotals[weekKey] || 0) + item.amount;
    });

    const sortedWeeks = Object.keys(weeklyTotals).sort();
    const last8Weeks = sortedWeeks.slice(-8);

    return {
      labels: last8Weeks.map(weekStart => {
        const d = new Date(weekStart);
        return `Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      }),
      datasets: [{
        label: 'Weekly Spending',
        data: last8Weeks.map(week => weeklyTotals[week]),
        backgroundColor: getThemeColors(1)[0],
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      }]
    };
  }, [data]);

  // Calculate spending statistics
  const spendingStats = useMemo(() => {
    const amounts = data.map(item => item.amount);
    const totalSpending = amounts.reduce((sum, amount) => sum + amount, 0);
    const averageDaily = totalSpending / 30; // Assuming 30-day period
    const maxDaily = Math.max(...Object.values(
      data.reduce((acc, item) => {
        acc[item.date] = (acc[item.date] || 0) + item.amount;
        return acc;
      }, {} as Record<string, number>)
    ));
    const minDaily = Math.min(...Object.values(
      data.reduce((acc, item) => {
        acc[item.date] = (acc[item.date] || 0) + item.amount;
        return acc;
      }, {} as Record<string, number>)
    ));

    // Calculate trend (comparing last 15 days to previous 15 days)
    const midpoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midpoint).reduce((sum, item) => sum + item.amount, 0);
    const secondHalf = data.slice(midpoint).reduce((sum, item) => sum + item.amount, 0);
    const trend = ((secondHalf - firstHalf) / firstHalf) * 100;

    return {
      totalSpending,
      averageDaily,
      maxDaily,
      minDaily,
      trend
    };
  }, [data]);

  const lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Spending: ${formatCurrency(context.parsed.y)}`;
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
          maxTicksLimit: 7
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(107, 114, 128, 0.1)'
        },
        ticks: {
          callback: function(value) {
            return formatCurrency(value as number);
          }
        }
      }
    }
  };

  const barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Total: ${formatCurrency(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(107, 114, 128, 0.1)'
        },
        ticks: {
          callback: function(value) {
            return formatCurrency(value as number);
          }
        }
      }
    }
  };

  return (
    <div className={className}>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Spending Statistics */}
        <div className="xl:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Spending Overview</CardTitle>
                <Select
                  options={dateRangeOptions}
                  value={dateRange}
                  onChange={onDateRangeChange}
                  className="w-32"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-600 mb-1">Total Spending</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {formatCurrency(spendingStats.totalSpending)}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Daily Average</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {formatCurrency(spendingStats.averageDaily)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-50 rounded-lg p-3">
                    <div className="text-xs text-emerald-600 mb-1">Lowest Day</div>
                    <div className="text-sm font-semibold text-emerald-900">
                      {formatCurrency(spendingStats.minDaily)}
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <div className="text-xs text-red-600 mb-1">Highest Day</div>
                    <div className="text-sm font-semibold text-red-900">
                      {formatCurrency(spendingStats.maxDaily)}
                    </div>
                  </div>
                </div>

                <div className={`rounded-lg p-4 ${
                  spendingStats.trend > 0 ? 'bg-red-50' : 'bg-emerald-50'
                }`}>
                  <div className="flex items-center space-x-2">
                    {spendingStats.trend > 0 ? (
                      <TrendingUp className="h-4 w-4 text-red-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-emerald-600" />
                    )}
                    <div className="text-sm font-medium">
                      <span className={spendingStats.trend > 0 ? 'text-red-600' : 'text-emerald-600'}>
                        {Math.abs(spendingStats.trend).toFixed(1)}%{' '}
                        {spendingStats.trend > 0 ? 'increase' : 'decrease'}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">vs. previous period</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="xl:col-span-2 space-y-6">
          {/* Daily Spending Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Daily Spending Trend</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart
                data={dailySpendingData}
                options={lineChartOptions}
                height={250}
              />
            </CardContent>
          </Card>

          {/* Weekly Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Spending Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                data={weeklyComparisonData}
                options={barChartOptions}
                height={250}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}