'use client';

import React from 'react';
import { Target, Calendar, Plus, MoreHorizontal, TrendingUp } from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';

interface FinancialGoal {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  icon: string;
}

interface FinancialGoalsProps {
  goals?: FinancialGoal[];
  onAddGoal?: () => void;
  onViewAll?: () => void;
}

const defaultGoals: FinancialGoal[] = [
  {
    id: '1',
    title: 'Emergency Fund',
    description: '6 months of living expenses',
    targetAmount: 25000,
    currentAmount: 18500,
    targetDate: '2024-12-31',
    category: 'Emergency',
    priority: 'high',
    icon: '🛡️',
  },
  {
    id: '2',
    title: 'Dream Vacation',
    description: 'Trip to Japan',
    targetAmount: 8000,
    currentAmount: 3200,
    targetDate: '2025-06-15',
    category: 'Travel',
    priority: 'medium',
    icon: '✈️',
  },
  {
    id: '3',
    title: 'New Car',
    description: 'Down payment for Tesla Model 3',
    targetAmount: 15000,
    currentAmount: 7500,
    targetDate: '2025-03-01',
    category: 'Vehicle',
    priority: 'medium',
    icon: '🚗',
  },
  {
    id: '4',
    title: 'Home Renovation',
    description: 'Kitchen and bathroom upgrade',
    targetAmount: 30000,
    currentAmount: 5000,
    targetDate: '2025-09-01',
    category: 'Home',
    priority: 'low',
    icon: '🏠',
  },
];

export default function FinancialGoals({
  goals = defaultGoals,
  onAddGoal,
  onViewAll,
}: FinancialGoalsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getDaysRemaining = (targetDate: string) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-emerald-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Calculate total progress
  const totalTargetAmount = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalCurrentAmount = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const overallProgress = (totalCurrentAmount / totalTargetAmount) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Financial Goals</CardTitle>
          <div className="flex items-center space-x-2">
            <Button size="sm" onClick={onAddGoal}>
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
            <button className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-bold text-gray-900">
              {overallProgress.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
            <span>{formatCurrency(totalCurrentAmount)} saved</span>
            <span>{formatCurrency(totalTargetAmount)} target</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {goals.slice(0, 4).map((goal) => {
            const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
            const daysRemaining = getDaysRemaining(goal.targetDate);
            const isOverdue = daysRemaining < 0;

            return (
              <div
                key={goal.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{goal.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                      <p className="text-sm text-gray-600">{goal.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(goal.priority)}`}>
                      {goal.priority}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
                    </span>
                    <span className="text-sm font-bold text-gray-700">
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Goal Details */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>
                      {isOverdue ? 'Overdue' : `${daysRemaining} days left`}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Target className="h-4 w-4 mr-1" />
                    <span>{formatDate(goal.targetDate)}</span>
                  </div>
                </div>

                {/* Monthly Target */}
                {(() => {
                  const remaining = goal.targetAmount - goal.currentAmount;
                  const monthsRemaining = Math.max(1, Math.ceil(daysRemaining / 30));
                  const monthlyTarget = remaining / monthsRemaining;

                  return (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Monthly target:</span>
                        <span className="font-medium text-blue-600">
                          {formatCurrency(monthlyTarget)}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-emerald-600">
                {goals.filter(g => calculateProgress(g.currentAmount, g.targetAmount) >= 100).length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {goals.filter(g => getDaysRemaining(g.targetDate) < 90).length}
              </div>
              <div className="text-sm text-gray-600">Due Soon</div>
            </div>
          </div>
        </div>

        {/* View All Button */}
        <div className="mt-6">
          <Button variant="outline" onClick={onViewAll} className="w-full">
            <TrendingUp className="h-4 w-4 mr-2" />
            View All Goals
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}