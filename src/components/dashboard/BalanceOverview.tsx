'use client';

import React from 'react';
import { Wallet, TrendingUp, TrendingDown, DollarSign, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';
import { useState } from 'react';

interface BalanceData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  incomeChange: number;
  expenseChange: number;
  balanceChange: number;
}

interface BalanceOverviewProps {
  data?: BalanceData;
}

const defaultData: BalanceData = {
  totalBalance: 25750.80,
  monthlyIncome: 8500.00,
  monthlyExpenses: 6200.45,
  savingsRate: 27.1,
  incomeChange: 5.2,
  expenseChange: -2.8,
  balanceChange: 12.4,
};

export default function BalanceOverview({ data = defaultData }: BalanceOverviewProps) {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  const formatCurrency = (amount: number) => {
    if (!isBalanceVisible) return '••••••';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(1)}%`;
  };

  const cards = [
    {
      title: 'Total Balance',
      value: formatCurrency(data.totalBalance),
      change: data.balanceChange,
      icon: Wallet,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      primary: true,
    },
    {
      title: 'Monthly Income',
      value: formatCurrency(data.monthlyIncome),
      change: data.incomeChange,
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-50 to-emerald-100',
    },
    {
      title: 'Monthly Expenses',
      value: formatCurrency(data.monthlyExpenses),
      change: data.expenseChange,
      icon: TrendingDown,
      gradient: 'from-red-500 to-red-600',
      bgGradient: 'from-red-50 to-red-100',
    },
    {
      title: 'Savings Rate',
      value: isBalanceVisible ? `${data.savingsRate}%` : '••••',
      change: data.balanceChange,
      icon: DollarSign,
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const isPositive = card.change >= 0;
        const changeIcon = isPositive ? ArrowUp : ArrowDown;
        const changeColor = isPositive ? 'text-emerald-600' : 'text-red-600';
        const changeBg = isPositive ? 'bg-emerald-50' : 'bg-red-50';

        return (
          <Card
            key={card.title}
            className={`relative overflow-hidden ${card.primary ? 'ring-2 ring-blue-500/20' : ''}`}
            hover
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <div className="flex items-center space-x-1">
                {card.primary && (
                  <button
                    onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                    className="p-1.5 rounded-md hover:bg-gray-100 transition-colors duration-200"
                  >
                    {isBalanceVisible ? (
                      <Eye className="h-4 w-4 text-gray-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                )}
                <div className={`p-2 rounded-lg bg-gradient-to-r ${card.bgGradient}`}>
                  <Icon className={`h-5 w-5 bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {card.value}
                  </div>
                  <div className={`flex items-center mt-1 px-2 py-1 rounded-full text-xs font-medium ${changeBg} ${changeColor}`}>
                    {React.createElement(changeIcon, { className: 'h-3 w-3 mr-1' })}
                    {formatPercentage(card.change)}
                    <span className="ml-1 text-gray-500">vs last month</span>
                  </div>
                </div>
              </div>
            </CardContent>

            {/* Background decoration */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.gradient} opacity-5 rounded-full transform translate-x-16 -translate-y-16`}></div>
          </Card>
        );
      })}
    </div>
  );
}