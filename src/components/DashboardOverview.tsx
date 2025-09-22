import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { DashboardStats } from '@/types';

const mockStats: DashboardStats = {
  totalIncome: 5000,
  totalExpenses: 3200,
  currentBalance: 1800,
  budgetUtilization: 75,
  goalsProgress: 60,
};

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats>(mockStats);

  const statsCards = [
    {
      title: 'Current Balance',
      value: `$${stats.currentBalance.toLocaleString()}`,
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: DollarSign,
    },
    {
      title: 'Monthly Income',
      value: `$${stats.totalIncome.toLocaleString()}`,
      change: '+8.2%',
      changeType: 'positive' as const,
      icon: TrendingUp,
    },
    {
      title: 'Monthly Expenses',
      value: `$${stats.totalExpenses.toLocaleString()}`,
      change: '-3.1%',
      changeType: 'negative' as const,
      icon: TrendingDown,
    },
    {
      title: 'Goals Progress',
      value: `${stats.goalsProgress}%`,
      change: '+5.4%',
      changeType: 'positive' as const,
      icon: Target,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your financial overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white p-6 rounded-lg shadow-soft border border-gray-100 hover:shadow-medium transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className="p-3 bg-primary-50 rounded-lg">
                  <Icon className="h-6 w-6 text-primary-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span
                  className={`text-sm font-medium ${
                    card.changeType === 'positive' ? 'text-success-600' : 'text-error-600'
                  }`}
                >
                  {card.change}
                </span>
                <span className="text-sm text-gray-500 ml-2">from last month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-soft border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors">
            <h3 className="font-medium text-gray-900">Add Transaction</h3>
            <p className="text-sm text-gray-600 mt-1">Record a new income or expense</p>
          </button>
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors">
            <h3 className="font-medium text-gray-900">Create Budget</h3>
            <p className="text-sm text-gray-600 mt-1">Set spending limits for categories</p>
          </button>
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors">
            <h3 className="font-medium text-gray-900">Ask AI</h3>
            <p className="text-sm text-gray-600 mt-1">Get personalized financial advice</p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-soft border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {[
            { description: 'Grocery Store', amount: -67.50, category: 'Food', date: '2 hours ago' },
            { description: 'Salary Deposit', amount: 3000, category: 'Income', date: '1 day ago' },
            { description: 'Electric Bill', amount: -89.99, category: 'Utilities', date: '2 days ago' },
          ].map((transaction, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
              <div>
                <p className="font-medium text-gray-900">{transaction.description}</p>
                <p className="text-sm text-gray-500">{transaction.category} • {transaction.date}</p>
              </div>
              <span
                className={`font-semibold ${
                  transaction.amount > 0 ? 'text-success-600' : 'text-gray-900'
                }`}
              >
                {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}