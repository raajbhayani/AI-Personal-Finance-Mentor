'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Calendar, Filter, Download, Upload, TrendingUp, TrendingDown } from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import Select from '../ui/Select';
import TransactionTable from './TransactionTable';
import CategoryBreakdown from './CategoryBreakdown';
import AddTransactionModal from './AddTransactionModal';
import EditTransactionModal from './EditTransactionModal';
import { Transaction } from './TransactionTable';
import { formatCurrency } from '../../lib/utils/dashboard';
import { cn } from '../../lib/utils/cn';

interface TransactionManagementProps {
  className?: string;
}

// Mock data for demonstration
const mockTransactions: Transaction[] = [
  {
    id: '1',
    description: 'Salary Payment',
    amount: 5000,
    type: 'income',
    category: 'salary',
    date: '2024-01-15',
    status: 'completed',
    tags: ['monthly', 'primary-income'],
    notes: 'Regular monthly salary'
  },
  {
    id: '2',
    description: 'Grocery Shopping',
    amount: 150,
    type: 'expense',
    category: 'food',
    date: '2024-01-14',
    status: 'completed',
    tags: ['weekly', 'essentials']
  },
  {
    id: '3',
    description: 'Netflix Subscription',
    amount: 15.99,
    type: 'expense',
    category: 'entertainment',
    date: '2024-01-13',
    status: 'completed',
    tags: ['subscription', 'monthly']
  },
  {
    id: '4',
    description: 'Freelance Project',
    amount: 800,
    type: 'income',
    category: 'freelance',
    date: '2024-01-12',
    status: 'pending',
    notes: 'Web development project'
  },
  {
    id: '5',
    description: 'Gas Bill',
    amount: 120,
    type: 'expense',
    category: 'bills',
    date: '2024-01-11',
    status: 'completed',
    tags: ['utility', 'monthly']
  },
];

export default function TransactionManagement({ className }: TransactionManagementProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [isLoading, setIsLoading] = useState(false);

  // Calculate totals and summary
  const summary = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.type === 'expense' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const pending = transactions
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expenses,
      netIncome: income - expenses,
      pending,
      totalTransactions: transactions.length,
    };
  }, [transactions]);

  const handleAddTransaction = async (data: any) => {
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      description: data.description,
      amount: data.amount,
      type: data.type,
      category: data.category,
      date: data.date.toISOString().split('T')[0],
      status: 'completed',
      notes: data.notes,
      tags: data.tags,
    };

    setTransactions(prev => [newTransaction, ...prev]);
    setIsLoading(false);
  };

  const handleEditTransaction = async (data: any) => {
    if (!editingTransaction) return;

    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const updatedTransaction: Transaction = {
      ...editingTransaction,
      description: data.description,
      amount: data.amount,
      type: data.type,
      category: data.category,
      date: data.date.toISOString().split('T')[0],
      status: data.status,
      notes: data.notes,
      tags: data.tags,
    };

    setTransactions(prev =>
      prev.map(t => t.id === editingTransaction.id ? updatedTransaction : t)
    );

    setEditingTransaction(null);
    setIsLoading(false);
  };

  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this transaction? This action cannot be undone.'
    );

    if (!confirmDelete) return;

    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    setTransactions(prev => prev.filter(t => t.id !== transactionId));
    setIsLoading(false);
  };

  const dateRangeOptions = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
  ];

  return (
    <div className={cn('space-y-6', className)} role="main" aria-labelledby="transaction-title">
      {/* Screen reader announcement for changes */}
      <div id="live-region" aria-live="polite" aria-atomic="true" className="sr-only">
        {isLoading && "Processing transaction..."}
      </div>

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 id="transaction-title" className="text-2xl font-bold text-gray-900">Transaction Management</h1>
          <p className="text-gray-600 mt-1">
            Track, manage, and analyze your financial transactions
          </p>
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <Select
            options={dateRangeOptions}
            value={dateRange}
            onChange={(value) => setDateRange(value as any)}
            className="w-full sm:w-auto"
          />
          <Button variant="outline" size="sm" aria-label="Export transactions">
            <Download className="h-4 w-4 mr-2" aria-hidden="true" />
            Export
          </Button>
          <Button variant="outline" size="sm" aria-label="Import transactions">
            <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
            Import
          </Button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            aria-label="Add new transaction"
          >
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <section aria-labelledby="summary-title" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <h2 id="summary-title" className="sr-only">Financial Summary</h2>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(summary.income)}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full" aria-hidden="true">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(summary.expenses)}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full" aria-hidden="true">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Income</p>
                <p className={cn(
                  "text-2xl font-bold",
                  summary.netIncome >= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {formatCurrency(summary.netIncome)}
                </p>
              </div>
              <div className={cn(
                "p-3 rounded-full",
                summary.netIncome >= 0 ? "bg-emerald-100" : "bg-red-100"
              )} aria-hidden="true">
                {summary.netIncome >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-amber-600">
                  {formatCurrency(summary.pending)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {transactions.filter(t => t.status === 'pending').length} transactions
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full" aria-hidden="true">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Category Breakdown */}
      <CategoryBreakdown
        transactions={transactions}
        dateRange={dateRange}
        onDateRangeChange={(range) => setDateRange(range as any)}
      />

      {/* Transaction Table */}
      <TransactionTable
        transactions={transactions}
        onEdit={handleEditClick}
        onDelete={handleDeleteTransaction}
        isLoading={isLoading}
      />

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddTransaction}
      />

      <EditTransactionModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTransaction(null);
        }}
        onSubmit={handleEditTransaction}
        transaction={editingTransaction}
      />
    </div>
  );
}