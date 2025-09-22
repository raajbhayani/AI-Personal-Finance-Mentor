'use client';

import React, { useState } from 'react';
import { TrendingDown, MoreHorizontal } from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';

interface ExpenseCategory {
  name: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
}

interface ExpenseChartProps {
  categories?: ExpenseCategory[];
  totalExpenses?: number;
}

const defaultCategories: ExpenseCategory[] = [
  { name: 'Food & Dining', amount: 1850.50, percentage: 29.8, color: '#3B82F6', icon: '🍽️' },
  { name: 'Transportation', amount: 1200.00, percentage: 19.4, color: '#10B981', icon: '🚗' },
  { name: 'Shopping', amount: 950.75, percentage: 15.3, color: '#F59E0B', icon: '🛍️' },
  { name: 'Bills & Utilities', amount: 800.00, percentage: 12.9, color: '#EF4444', icon: '⚡' },
  { name: 'Entertainment', amount: 650.20, percentage: 10.5, color: '#8B5CF6', icon: '🎬' },
  { name: 'Healthcare', amount: 450.00, percentage: 7.3, color: '#06B6D4', icon: '🏥' },
  { name: 'Other', amount: 298.00, percentage: 4.8, color: '#6B7280', icon: '📦' },
];

export default function ExpenseChart({
  categories = defaultCategories,
  totalExpenses = 6199.45,
}: ExpenseChartProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate pie chart segments
  const generatePieChart = () => {
    let currentAngle = 0;
    const radius = 90;
    const centerX = 120;
    const centerY = 120;

    return categories.map((category) => {
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
        isHovered: hoveredCategory === category.name,
      };
    });
  };

  const pieSegments = generatePieChart();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Expense Categories</CardTitle>
          <button className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <TrendingDown className="h-4 w-4" />
          <span>Total: {formatCurrency(totalExpenses)} this month</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center space-y-6 lg:space-y-0 lg:space-x-6">
          {/* Pie Chart */}
          <div className="relative flex-shrink-0">
            <svg width="240" height="240" className="transform -rotate-90">
              {pieSegments.map((segment) => (
                <path
                  key={segment.name}
                  d={segment.pathData}
                  fill={segment.color}
                  className={`transition-all duration-200 cursor-pointer ${
                    segment.isHovered ? 'opacity-80 transform scale-105' : 'opacity-100'
                  }`}
                  onMouseEnter={() => setHoveredCategory(segment.name)}
                  onMouseLeave={() => setHoveredCategory(null)}
                />
              ))}
            </svg>

            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalExpenses)}
                </div>
                <div className="text-sm text-gray-500">Total Spent</div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-3">
            {categories.map((category) => (
              <div
                key={category.name}
                className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                  hoveredCategory === category.name
                    ? 'bg-gray-50 shadow-sm'
                    : 'hover:bg-gray-50'
                }`}
                onMouseEnter={() => setHoveredCategory(category.name)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-lg">{category.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {category.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {category.percentage}% of total
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(category.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Average per category</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(totalExpenses / categories.length)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}