'use client';

import React from 'react';
import {
  DollarSign,
  TrendingUp,
  PiggyBank,
  CreditCard,
  Calculator,
  Target,
  BarChart3,
  Lightbulb
} from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  message: string;
  icon: React.ReactNode;
  category: 'budgeting' | 'investing' | 'saving' | 'analysis';
}

interface QuickActionsProps {
  onActionClick: (message: string) => void;
  disabled?: boolean;
}

const quickActions: QuickAction[] = [
  {
    id: 'budget-help',
    label: 'Budget Help',
    message: 'Can you help me create a monthly budget based on my income and expenses?',
    icon: <Calculator className="h-4 w-4" />,
    category: 'budgeting'
  },
  {
    id: 'expense-analysis',
    label: 'Expense Analysis',
    message: 'Analyze my spending patterns and suggest areas where I can cut costs.',
    icon: <BarChart3 className="h-4 w-4" />,
    category: 'analysis'
  },
  {
    id: 'saving-tips',
    label: 'Saving Tips',
    message: 'What are some effective strategies to save money each month?',
    icon: <PiggyBank className="h-4 w-4" />,
    category: 'saving'
  },
  {
    id: 'investment-advice',
    label: 'Investment Advice',
    message: 'What investment options would you recommend for someone just starting out?',
    icon: <TrendingUp className="h-4 w-4" />,
    category: 'investing'
  },
  {
    id: 'debt-management',
    label: 'Debt Strategy',
    message: 'Help me create a strategy to pay off my debts more efficiently.',
    icon: <CreditCard className="h-4 w-4" />,
    category: 'budgeting'
  },
  {
    id: 'financial-goals',
    label: 'Financial Goals',
    message: 'How should I set and track my financial goals for this year?',
    icon: <Target className="h-4 w-4" />,
    category: 'budgeting'
  },
  {
    id: 'emergency-fund',
    label: 'Emergency Fund',
    message: 'How much should I have in my emergency fund and how do I build it?',
    icon: <DollarSign className="h-4 w-4" />,
    category: 'saving'
  },
  {
    id: 'financial-tips',
    label: 'Money Tips',
    message: 'Give me some quick financial tips to improve my money management.',
    icon: <Lightbulb className="h-4 w-4" />,
    category: 'analysis'
  }
];

const categoryColors = {
  budgeting: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
  investing: 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700',
  saving: 'from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700',
  analysis: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
};

export default function QuickActions({
  onActionClick,
  disabled = false
}: QuickActionsProps) {
  return (
    <div className="p-4 border-t border-gray-200 bg-gray-50">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-gray-700 mb-1">
          Quick Questions
        </h3>
        <p className="text-xs text-gray-500">
          Click on any topic to get started
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => onActionClick(action.message)}
            disabled={disabled}
            className={`
              relative p-3 rounded-lg text-white text-left transition-all duration-200
              transform hover:scale-105 hover:shadow-md active:scale-95
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
              bg-gradient-to-r ${categoryColors[action.category]}
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            `}
            aria-label={`Ask about ${action.label.toLowerCase()}`}
          >
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 mt-0.5 opacity-90">
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm leading-tight">
                  {action.label}
                </div>
              </div>
            </div>

            {/* Shine effect on hover */}
            <div className="absolute inset-0 rounded-lg opacity-0 hover:opacity-20 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12" />
          </button>
        ))}
      </div>

      {/* Additional Help */}
      <div className="mt-3 pt-3 border-t border-gray-300">
        <p className="text-xs text-gray-500 text-center">
          Or type your own question below
        </p>
      </div>
    </div>
  );
}