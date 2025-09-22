'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownLeft, MoreHorizontal, Filter, Plus } from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  merchant?: string;
  icon?: string;
}

interface RecentTransactionsProps {
  transactions?: Transaction[];
  onViewAll?: () => void;
  onAddTransaction?: () => void;
}

const defaultTransactions: Transaction[] = [
  {
    id: '1',
    description: 'Salary Deposit',
    amount: 5200.00,
    type: 'income',
    category: 'Salary',
    date: '2024-09-20',
    status: 'completed',
    merchant: 'Acme Corp',
    icon: '💼',
  },
  {
    id: '2',
    description: 'Grocery Shopping',
    amount: 156.78,
    type: 'expense',
    category: 'Food & Dining',
    date: '2024-09-19',
    status: 'completed',
    merchant: 'Whole Foods',
    icon: '🛒',
  },
  {
    id: '3',
    description: 'Netflix Subscription',
    amount: 15.99,
    type: 'expense',
    category: 'Entertainment',
    date: '2024-09-18',
    status: 'completed',
    merchant: 'Netflix',
    icon: '📺',
  },
  {
    id: '4',
    description: 'Freelance Payment',
    amount: 850.00,
    type: 'income',
    category: 'Freelance',
    date: '2024-09-17',
    status: 'pending',
    merchant: 'Design Studio',
    icon: '💻',
  },
  {
    id: '5',
    description: 'Gas Station',
    amount: 45.20,
    type: 'expense',
    category: 'Transportation',
    date: '2024-09-17',
    status: 'completed',
    merchant: 'Shell',
    icon: '⛽',
  },
  {
    id: '6',
    description: 'Coffee Shop',
    amount: 12.50,
    type: 'expense',
    category: 'Food & Dining',
    date: '2024-09-16',
    status: 'completed',
    merchant: 'Starbucks',
    icon: '☕',
  },
];

export default function RecentTransactions({
  transactions = defaultTransactions,
  onViewAll,
  onAddTransaction,
}: RecentTransactionsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Recent Transactions</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button size="sm" onClick={onAddTransaction}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.slice(0, 6).map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200 group"
            >
              <div className="flex items-center space-x-4 flex-1">
                {/* Transaction Icon */}
                <div className="flex-shrink-0">
                  {transaction.icon ? (
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                      {transaction.icon}
                    </div>
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'income'
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="h-5 w-5" />
                      ) : (
                        <ArrowDownLeft className="h-5 w-5" />
                      )}
                    </div>
                  )}
                </div>

                {/* Transaction Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {transaction.description}
                    </p>
                    <p className={`text-sm font-semibold ${
                      transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>{transaction.merchant}</span>
                      <span>•</span>
                      <span>{transaction.category}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {formatDate(transaction.date)}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <button className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={onViewAll} className="w-full">
            View All Transactions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}