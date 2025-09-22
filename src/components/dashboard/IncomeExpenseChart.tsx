'use client';

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, MoreHorizontal, Calendar } from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';

interface ChartDataPoint {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

interface IncomeExpenseChartProps {
  data?: ChartDataPoint[];
  period?: 'last6months' | 'last12months' | 'year';
}

const defaultData: ChartDataPoint[] = [
  { month: 'Mar', income: 8200, expenses: 6100, net: 2100 },
  { month: 'Apr', income: 8500, expenses: 6300, net: 2200 },
  { month: 'May', income: 8300, expenses: 5900, net: 2400 },
  { month: 'Jun', income: 8700, expenses: 6500, net: 2200 },
  { month: 'Jul', income: 8600, expenses: 6200, net: 2400 },
  { month: 'Aug', income: 9000, expenses: 6800, net: 2200 },
  { month: 'Sep', income: 8800, expenses: 6200, net: 2600 },
];

export default function IncomeExpenseChart({
  data = defaultData,
  period = 'last6months',
}: IncomeExpenseChartProps) {
  const [activePoint, setActivePoint] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(period);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate chart dimensions and scales
  const chartWidth = 600;
  const chartHeight = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Find min and max values for scaling
  const allValues = data.flatMap(d => [d.income, d.expenses]);
  const minValue = 0;
  const maxValue = Math.max(...allValues) * 1.1;

  // Create scales
  const xScale = (index: number) => (index / (data.length - 1)) * innerWidth;
  const yScale = (value: number) => innerHeight - ((value - minValue) / (maxValue - minValue)) * innerHeight;

  // Generate paths
  const generatePath = (values: number[]) => {
    return values
      .map((value, index) => {
        const x = xScale(index);
        const y = yScale(value);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  const incomePath = generatePath(data.map(d => d.income));
  const expensePath = generatePath(data.map(d => d.expenses));

  // Generate area paths (for fill)
  const generateAreaPath = (values: number[]) => {
    const linePath = generatePath(values);
    const lastX = xScale(values.length - 1);
    const firstX = xScale(0);
    const bottom = yScale(0);
    return `${linePath} L ${lastX} ${bottom} L ${firstX} ${bottom} Z`;
  };

  const incomeAreaPath = generateAreaPath(data.map(d => d.income));
  const expenseAreaPath = generateAreaPath(data.map(d => d.expenses));

  // Calculate totals and averages
  const totalIncome = data.reduce((sum, d) => sum + d.income, 0);
  const totalExpenses = data.reduce((sum, d) => sum + d.expenses, 0);
  const avgIncome = totalIncome / data.length;
  const avgExpenses = totalExpenses / data.length;
  const netDifference = totalIncome - totalExpenses;

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Income vs Expenses</CardTitle>
          <div className="flex items-center space-x-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="last6months">Last 6 Months</option>
              <option value="last12months">Last 12 Months</option>
              <option value="year">This Year</option>
            </select>
            <button className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-emerald-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-emerald-600 mr-2" />
              <span className="text-sm font-medium text-emerald-600">Avg Income</span>
            </div>
            <div className="text-2xl font-bold text-emerald-700">
              {formatCurrency(avgIncome)}
            </div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-sm font-medium text-red-600">Avg Expenses</span>
            </div>
            <div className="text-2xl font-bold text-red-700">
              {formatCurrency(avgExpenses)}
            </div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <span className="text-sm font-medium text-blue-600">Net Difference</span>
            </div>
            <div className={`text-2xl font-bold ${netDifference >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
              {formatCurrency(netDifference)}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="relative bg-gray-50 rounded-lg p-4">
          <svg width={chartWidth} height={chartHeight} className="w-full">
            <defs>
              <linearGradient id="incomeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#10B981', stopOpacity: 0.3 }} />
                <stop offset="100%" style={{ stopColor: '#10B981', stopOpacity: 0.05 }} />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#EF4444', stopOpacity: 0.3 }} />
                <stop offset="100%" style={{ stopColor: '#EF4444', stopOpacity: 0.05 }} />
              </linearGradient>
            </defs>

            <g transform={`translate(${padding.left}, ${padding.top})`}>
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = ratio * innerHeight;
                return (
                  <line
                    key={ratio}
                    x1={0}
                    y1={y}
                    x2={innerWidth}
                    y2={y}
                    stroke="#E5E7EB"
                    strokeWidth={1}
                    strokeDasharray="2,2"
                  />
                );
              })}

              {/* Area fills */}
              <path d={incomeAreaPath} fill="url(#incomeGradient)" />
              <path d={expenseAreaPath} fill="url(#expenseGradient)" />

              {/* Lines */}
              <path
                d={incomePath}
                fill="none"
                stroke="#10B981"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={expensePath}
                fill="none"
                stroke="#EF4444"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {data.map((point, index) => (
                <g key={index}>
                  <circle
                    cx={xScale(index)}
                    cy={yScale(point.income)}
                    r={activePoint === index ? 6 : 4}
                    fill="#10B981"
                    stroke="white"
                    strokeWidth={2}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setActivePoint(index)}
                    onMouseLeave={() => setActivePoint(null)}
                  />
                  <circle
                    cx={xScale(index)}
                    cy={yScale(point.expenses)}
                    r={activePoint === index ? 6 : 4}
                    fill="#EF4444"
                    stroke="white"
                    strokeWidth={2}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setActivePoint(index)}
                    onMouseLeave={() => setActivePoint(null)}
                  />
                </g>
              ))}

              {/* X-axis labels */}
              {data.map((point, index) => (
                <text
                  key={index}
                  x={xScale(index)}
                  y={innerHeight + 20}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  {point.month}
                </text>
              ))}

              {/* Y-axis labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const value = minValue + ratio * (maxValue - minValue);
                const y = (1 - ratio) * innerHeight;
                return (
                  <text
                    key={ratio}
                    x={-10}
                    y={y + 4}
                    textAnchor="end"
                    className="text-xs fill-gray-600"
                  >
                    {formatCurrency(value)}
                  </text>
                );
              })}
            </g>
          </svg>

          {/* Tooltip */}
          {activePoint !== null && (
            <div className="absolute top-4 right-4 bg-white shadow-lg rounded-lg p-3 border">
              <div className="text-sm font-medium text-gray-900 mb-2">
                {data[activePoint].month}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Income</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(data[activePoint].income)}
                  </span>
                </div>
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Expenses</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(data[activePoint].expenses)}
                  </span>
                </div>
                <div className="border-t pt-1 mt-1">
                  <div className="flex items-center justify-between space-x-4">
                    <span className="text-sm text-gray-600">Net</span>
                    <span className={`text-sm font-medium ${
                      data[activePoint].net >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(data[activePoint].net)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 mt-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Income</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Expenses</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}