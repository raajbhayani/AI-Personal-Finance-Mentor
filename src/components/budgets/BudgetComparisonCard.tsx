'use client';

import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

interface BudgetCategory {
  category: string;
  budgetedAmount: number;
  spentAmount: number;
  remaining: number;
  percentageUsed: number;
}

interface BudgetComparisonCardProps {
  budget: {
    id: string;
    name: string;
    totalBudget: number;
    totalSpent: number;
    totalRemaining: number;
    period: string;
    startDate: string;
    endDate: string;
    status: string;
    categories: BudgetCategory[];
  };
  className?: string;
}

export default function BudgetComparisonCard({ budget, className }: BudgetComparisonCardProps) {
  const overallPercentageUsed = budget.totalBudget > 0 ? (budget.totalSpent / budget.totalBudget) * 100 : 0;
  const isOverBudget = budget.totalSpent > budget.totalBudget;
  const isNearLimit = overallPercentageUsed >= 80 && !isOverBudget;

  const getStatusColor = (percentageUsed: number, isOver: boolean) => {
    if (isOver) return 'text-red-600 bg-red-50';
    if (percentageUsed >= 80) return 'text-yellow-600 bg-yellow-50';
    if (percentageUsed >= 60) return 'text-blue-600 bg-blue-50';
    return 'text-green-600 bg-green-50';
  };

  const getStatusIcon = (percentageUsed: number, isOver: boolean) => {
    if (isOver) return <AlertTriangle className="w-4 h-4" />;
    if (percentageUsed >= 80) return <TrendingUp className="w-4 h-4" />;
    if (percentageUsed >= 60) return <TrendingDown className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getBudgetProgress = (spent: number, budget: number) => {
    if (budget === 0) return 0;
    return Math.min((spent / budget) * 100, 100);
  };

  return (
    <div className={cn("bg-white rounded-lg shadow-soft border border-gray-200 overflow-hidden", className)}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{budget.name}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
            </p>
          </div>

          <div className={cn(
            "px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1",
            getStatusColor(overallPercentageUsed, isOverBudget)
          )}>
            {getStatusIcon(overallPercentageUsed, isOverBudget)}
            <span>
              {isOverBudget ? 'Over Budget' :
               isNearLimit ? 'Near Limit' :
               overallPercentageUsed >= 60 ? 'On Track' : 'Under Budget'}
            </span>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm text-gray-500">{overallPercentageUsed.toFixed(1)}% used</span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={cn(
                "h-3 rounded-full transition-all duration-300",
                isOverBudget ? "bg-red-500" :
                isNearLimit ? "bg-yellow-500" :
                overallPercentageUsed >= 60 ? "bg-blue-500" : "bg-green-500"
              )}
              style={{ width: `${Math.min(overallPercentageUsed, 100)}%` }}
            />
          </div>

          <div className="flex justify-between items-center mt-2 text-sm">
            <span className="text-gray-600">
              Spent: <span className="font-medium">${budget.totalSpent.toLocaleString()}</span>
            </span>
            <span className="text-gray-600">
              Budget: <span className="font-medium">${budget.totalBudget.toLocaleString()}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="p-6">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Category Breakdown</h4>

        <div className="space-y-4">
          {budget.categories.map((category, index) => {
            const isOverCategory = category.spentAmount > category.budgetedAmount;
            const categoryProgress = getBudgetProgress(category.spentAmount, category.budgetedAmount);

            return (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{category.category}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      ${category.spentAmount.toFixed(2)} / ${category.budgetedAmount.toFixed(2)}
                    </span>
                    {isOverCategory && (
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                    )}
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      isOverCategory ? "bg-red-500" :
                      categoryProgress >= 80 ? "bg-yellow-500" :
                      categoryProgress >= 60 ? "bg-blue-500" : "bg-green-500"
                    )}
                    style={{ width: `${Math.min(categoryProgress, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>{categoryProgress.toFixed(1)}% used</span>
                  <span className={cn(
                    "font-medium",
                    category.remaining >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {category.remaining >= 0 ? '+' : ''}${category.remaining.toFixed(2)} remaining
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Remaining</p>
              <p className={cn(
                "text-lg font-semibold mt-1",
                budget.totalRemaining >= 0 ? "text-green-600" : "text-red-600"
              )}>
                ${Math.abs(budget.totalRemaining).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Categories</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {budget.categories.length}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Period</p>
              <p className="text-lg font-semibold text-gray-900 mt-1 capitalize">
                {budget.period}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}