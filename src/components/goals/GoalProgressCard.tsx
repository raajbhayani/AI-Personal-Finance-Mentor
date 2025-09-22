'use client';

import React, { useState } from 'react';
import {
  Target,
  Calendar,
  TrendingUp,
  Edit2,
  Trash2,
  Plus,
  Award,
  Clock,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import Card, { CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { formatCurrency, formatDate } from '../../lib/utils/dashboard';
import { cn } from '../../lib/utils/cn';

interface Goal {
  id: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  isRecurring: boolean;
  reminderFrequency?: 'weekly' | 'monthly' | 'quarterly';
  createdAt: string;
  updatedAt: string;
}

interface GoalProgressCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
  onAddProgress: (goalId: string) => void;
  className?: string;
}

const categoryIcons: Record<string, string> = {
  'emergency-fund': '🛡️',
  'vacation': '✈️',
  'house-down-payment': '🏠',
  'car-purchase': '🚗',
  'retirement': '👴',
  'education': '🎓',
  'debt-payoff': '💳',
  'investment': '📈',
  'wedding': '💒',
  'business': '💼',
  'other': '🎯',
};

const priorityColors = {
  low: 'text-gray-600 bg-gray-100',
  medium: 'text-yellow-700 bg-yellow-100',
  high: 'text-red-700 bg-red-100',
};

export default function GoalProgressCard({
  goal,
  onEdit,
  onDelete,
  onAddProgress,
  className
}: GoalProgressCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const progressPercentage = goal.targetAmount > 0
    ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
    : 0;

  const remainingAmount = goal.targetAmount - goal.currentAmount;
  const isCompleted = progressPercentage >= 100;
  const targetDate = new Date(goal.targetDate);
  const today = new Date();
  const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysRemaining < 0 && !isCompleted;
  const isNearDeadline = daysRemaining <= 30 && daysRemaining > 0 && !isCompleted;

  const calculateMonthlySavingsNeeded = () => {
    const monthsRemaining = Math.max(1, Math.ceil(daysRemaining / 30));
    return monthsRemaining > 0 ? remainingAmount / monthsRemaining : 0;
  };

  const getStatusColor = () => {
    if (isCompleted) return 'from-emerald-500 to-emerald-600';
    if (isOverdue) return 'from-red-500 to-red-600';
    if (isNearDeadline) return 'from-amber-500 to-amber-600';
    return 'from-blue-500 to-blue-600';
  };

  const getStatusText = () => {
    if (isCompleted) return 'Completed';
    if (isOverdue) return `${Math.abs(daysRemaining)} days overdue`;
    if (isNearDeadline) return `${daysRemaining} days left`;
    return `${daysRemaining} days remaining`;
  };

  return (
    <Card
      className={cn(
        'group transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
        isCompleted && 'ring-2 ring-emerald-200 bg-emerald-50/30',
        isOverdue && 'ring-2 ring-red-200 bg-red-50/30',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">
              {categoryIcons[goal.category] || '🎯'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {goal.title}
              </h3>
              {goal.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {goal.description}
                </p>
              )}
            </div>
          </div>

          {/* Priority Badge */}
          <span className={cn(
            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
            priorityColors[goal.priority]
          )}>
            {goal.priority} priority
          </span>
        </div>

        {/* Progress Section */}
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Progress</span>
              <span className="text-gray-600">
                {progressPercentage.toFixed(1)}%
              </span>
            </div>

            <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={cn(
                  'h-3 rounded-full transition-all duration-500 bg-gradient-to-r',
                  getStatusColor()
                )}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />

              {/* Completion Effect */}
              {isCompleted && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" />
              )}
            </div>
          </div>

          {/* Amount Information */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Current</div>
              <div className="font-semibold text-gray-900">
                {formatCurrency(goal.currentAmount)}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Target</div>
              <div className="font-semibold text-gray-900">
                {formatCurrency(goal.targetAmount)}
              </div>
            </div>
          </div>

          {/* Status and Timeline */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                Due {formatDate(goal.targetDate, 'short')}
              </span>
            </div>

            <div className={cn(
              'flex items-center space-x-1',
              isCompleted && 'text-emerald-600',
              isOverdue && 'text-red-600',
              isNearDeadline && 'text-amber-600'
            )}>
              {isCompleted ? (
                <Award className="h-4 w-4" />
              ) : isOverdue ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              <span className="font-medium">
                {getStatusText()}
              </span>
            </div>
          </div>

          {/* Savings Recommendation */}
          {!isCompleted && remainingAmount > 0 && daysRemaining > 0 && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <div className="flex items-start space-x-2">
                <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-blue-900 mb-1">
                    Monthly Savings Needed
                  </div>
                  <div className="text-sm text-blue-700">
                    Save <span className="font-semibold">
                      {formatCurrency(calculateMonthlySavingsNeeded())}
                    </span> per month to reach your goal on time.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Completion Celebration */}
          {isCompleted && (
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-emerald-600" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-emerald-900">
                    🎉 Goal Completed!
                  </div>
                  <div className="text-sm text-emerald-700">
                    Congratulations on reaching your financial goal!
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className={cn(
          'flex items-center justify-between mt-6 pt-4 border-t border-gray-200 transition-opacity duration-200',
          isHovered ? 'opacity-100' : 'opacity-60'
        )}>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(goal)}
              className="flex items-center space-x-1"
            >
              <Edit2 className="h-3 w-3" />
              <span>Edit</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(goal.id)}
              className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:border-red-300"
            >
              <Trash2 className="h-3 w-3" />
              <span>Delete</span>
            </Button>
          </div>

          {!isCompleted && (
            <Button
              size="sm"
              onClick={() => onAddProgress(goal.id)}
              className="flex items-center space-x-1"
            >
              <Plus className="h-3 w-3" />
              <span>Add Progress</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}