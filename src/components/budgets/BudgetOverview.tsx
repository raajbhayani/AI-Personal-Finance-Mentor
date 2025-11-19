'use client';

import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { Plus, Filter, Search, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';
import { GET_BUDGETS, GET_ACTIVE_BUDGETS } from '../../lib/graphql/queries/budgets';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import BudgetComparisonCard from './BudgetComparisonCard';
import CreateBudgetModal from './CreateBudgetModal';
import { BudgetCardSkeleton } from '../ui/SkeletonLoader';
import ErrorDisplay from '../ui/ErrorDisplay';
import { ComponentErrorBoundary } from '../ui/ErrorBoundary';
import { cn } from '../../lib/utils/cn';

interface Budget {
  id: string;
  name: string;
  description: string;
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  period: string;
  startDate: string;
  endDate: string;
  status: string;
  categories: Array<{
    category: string;
    budgetedAmount: number;
    spentAmount: number;
    remaining: number;
    percentageUsed: number;
  }>;
}

export default function BudgetOverview() {
  const { user } = useAuth();
  const { addNotification } = useNotification();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'overbudget'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data: budgetsData,
    loading: budgetsLoading,
    error: budgetsError,
    refetch: refetchBudgets
  } = useQuery<{ getBudgets: { edges: { node: Budget }[] } }>(GET_BUDGETS, {
    skip: !user,
    errorPolicy: 'all'
  });

  const {
    data: activeBudgetsData,
    loading: activeBudgetsLoading
  } = useQuery<{ getActiveBudgets: Budget[] }>(GET_ACTIVE_BUDGETS, {
    skip: !user,
    errorPolicy: 'all'
  });

  const budgets = budgetsData?.getBudgets?.edges?.map(edge => edge.node) || [];
  const activeBudgets = activeBudgetsData?.getActiveBudgets || [];

  // Filter budgets based on status and search term
  const filteredBudgets = budgets.filter(budget => {
    const matchesSearch = budget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         budget.description.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    switch (filterStatus) {
      case 'active':
        return budget.status === 'active';
      case 'completed':
        return budget.status === 'completed';
      case 'overbudget':
        return budget.totalSpent > budget.totalBudget;
      default:
        return true;
    }
  });

  // Calculate summary statistics
  const totalBudgets = budgets.length;
  const activeBudgetsCount = budgets.filter(b => b.status === 'active').length;
  const overBudgetCount = budgets.filter(b => b.totalSpent > b.totalBudget).length;
  const totalBudgetAmount = activeBudgets.reduce((sum, b) => sum + b.totalBudget, 0);
  const totalSpentAmount = activeBudgets.reduce((sum, b) => sum + b.totalSpent, 0);

  const handleCreateBudget = async (budgetData: any) => {
    try {
      // This would be implemented with the ADD_BUDGET mutation
      console.log('Creating budget:', budgetData);

      addNotification({
        type: 'success',
        title: 'Budget Created!',
        message: `${budgetData.name} has been created successfully.`,
        duration: 5000
      });

      refetchBudgets();
    } catch (error) {
      console.error('Error creating budget:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to create budget. Please try again.',
        duration: 5000
      });
    }
  };

  if (!user) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <BudgetCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <ComponentErrorBoundary componentName="BudgetOverview">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget Management</h1>
          <p className="text-gray-600">Track your spending and stay within your limits</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Create Budget</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-soft border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Budgets</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalBudgets}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-soft border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Budgets</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{activeBudgetsCount}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-soft border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Budgeted</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${totalBudgetAmount.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-soft border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Over Budget</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{overBudgetCount}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-soft border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Budgets</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="overbudget">Over Budget</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search budgets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Budget Cards */}
      {budgetsLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <BudgetCardSkeleton key={i} />
          ))}
        </div>
      ) : budgetsError ? (
        <ErrorDisplay
          type="server"
          variant="card"
          title="Error loading budgets"
          error={budgetsError}
          onRetry={async () => { await refetchBudgets(); }}
          showDetails={process.env.NODE_ENV === 'development'}
        />
      ) : filteredBudgets.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterStatus !== 'all' ? 'No budgets found' : 'No budgets yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterStatus !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first budget to start tracking your spending'}
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Budget
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBudgets.map((budget) => (
            <BudgetComparisonCard key={budget.id} budget={budget} />
          ))}
        </div>
      )}

      {/* Create Budget Modal */}
      <CreateBudgetModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateBudget}
      />
      </div>
    </ComponentErrorBoundary>
  );
}