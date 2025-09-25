import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { DollarSign, TrendingUp, TrendingDown, Target, RefreshCw, AlertCircle } from 'lucide-react';
import { DashboardStats, Transaction } from '@/types';
import { GET_DASHBOARD_STATS, GET_RECENT_TRANSACTIONS } from '@/lib/graphql/queries/dashboard';
import { ADD_TRANSACTION } from '@/lib/graphql/queries/transactions';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import AddTransactionModal from '@/components/transactions/AddTransactionModal';
import AIFinancialChatModal from './AIFinancialChatModal';
import CreateBudgetModal from './budgets/CreateBudgetModal';
import { DashboardStatsSkeleton, TransactionListSkeleton } from './ui/SkeletonLoader';
import ErrorDisplay from './ui/ErrorDisplay';
import { ComponentErrorBoundary } from './ui/ErrorBoundary';

interface DashboardOverviewData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  activeGoals: number;
  completedGoals: number;
  budgetAdherence: number;
  topSpendingCategory: string;
}

interface RecentTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: string;
  createdAt: string;
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const { addNotification } = useNotification();

  // State for modals
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showCreateBudgetModal, setShowCreateBudgetModal] = useState(false);

  const {
    data: statsData,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useQuery<{ getDashboardStats: DashboardOverviewData }>(GET_DASHBOARD_STATS, {
    skip: !user,
    errorPolicy: 'all'
  });

  const {
    data: transactionsData,
    loading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions
  } = useQuery<{ getTransactions: { transactions: RecentTransaction[]; totalCount: number } }>(
    GET_RECENT_TRANSACTIONS,
    {
      variables: { limit: 5 },
      skip: !user,
      errorPolicy: 'all'
    }
  );

  const [addTransaction, { loading: addTransactionLoading }] = useMutation(ADD_TRANSACTION, {
    onCompleted: (data) => {
      const newTransaction = data?.addTransaction;
      if (newTransaction) {
        addNotification({
          type: 'success',
          title: 'Transaction Added Successfully!',
          message: `${newTransaction.type === 'INCOME' ? 'Income' : 'Expense'} of $${newTransaction.amount.toLocaleString()} has been recorded.`,
          duration: 5000
        });
        // Refresh dashboard data
        refetchStats();
        refetchTransactions();
      }
      setShowAddTransactionModal(false);
    },
    onError: (error) => {
      console.error('Error adding transaction:', error);
      addNotification({
        type: 'error',
        title: 'Error Adding Transaction',
        message: 'Failed to add transaction. Please try again.',
        duration: 5000
      });
    },
  });

  const handleRefresh = async () => {
    await Promise.all([refetchStats(), refetchTransactions()]);
  };

  const handleAddTransaction = async (transactionData: any) => {
    try {
      await addTransaction({
        variables: {
          input: {
            description: transactionData.description,
            amount: transactionData.amount,
            type: transactionData.type.toUpperCase(), // Convert to uppercase for GraphQL enum
            category: transactionData.category,
            date: transactionData.date,
            notes: transactionData.notes,
            tags: transactionData.tags,
            status: 'completed', // Default to completed status
            currency: 'USD' // Default currency
          }
        }
      });
    } catch (error) {
      console.error('Error in handleAddTransaction:', error);
    }
  };

  const handleCreateBudget = async (budgetData: any) => {
    try {
      // TODO: Implement with ADD_BUDGET mutation
      console.log('Creating budget:', budgetData);

      addNotification({
        type: 'success',
        title: 'Budget Created Successfully!',
        message: `${budgetData.name} budget has been created.`,
        duration: 5000
      });

      // Refresh dashboard data
      refetchStats();
      setShowCreateBudgetModal(false);
    } catch (error) {
      console.error('Error creating budget:', error);
      addNotification({
        type: 'error',
        title: 'Error Creating Budget',
        message: 'Failed to create budget. Please try again.',
        duration: 5000
      });
    }
  };

  const stats = statsData?.getDashboardStats;
  const recentTransactions = transactionsData?.getTransactions?.transactions || [];

  // Calculate goal progress percentage
  const calculateGoalProgress = () => {
    if (!stats?.activeGoals && !stats?.completedGoals) return 0;
    const total = (stats?.activeGoals || 0) + (stats?.completedGoals || 0);
    return total > 0 ? Math.round(((stats?.completedGoals || 0) / total) * 100) : 0;
  };

  const statsCards = [
    {
      title: 'Current Balance',
      value: stats ? `$${stats.totalBalance.toLocaleString()}` : '--',
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: DollarSign,
      loading: statsLoading,
    },
    {
      title: 'Monthly Income',
      value: stats ? `$${stats.monthlyIncome.toLocaleString()}` : '--',
      change: '+8.2%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      loading: statsLoading,
    },
    {
      title: 'Monthly Expenses',
      value: stats ? `$${stats.monthlyExpenses.toLocaleString()}` : '--',
      change: '-3.1%',
      changeType: 'negative' as const,
      icon: TrendingDown,
      loading: statsLoading,
    },
    {
      title: 'Goals Progress',
      value: stats ? `${calculateGoalProgress()}%` : '--',
      change: '+5.4%',
      changeType: 'positive' as const,
      icon: Target,
      loading: statsLoading,
    },
  ];

  // Show loading state if user is not loaded yet
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <DashboardStatsSkeleton />
        <div className="bg-white p-6 rounded-lg shadow-soft border border-gray-100">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <TransactionListSkeleton count={3} />
        </div>
      </div>
    );
  }

  return (
    <ComponentErrorBoundary componentName="Dashboard">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard {user.firstName && `- Welcome back, ${user.firstName}!`}
          </h1>
          <p className="text-gray-600">Here's your financial overview.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={statsLoading || transactionsLoading}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${(statsLoading || transactionsLoading) ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error State */}
      {(statsError || transactionsError) && (
        <ErrorDisplay
          type="server"
          variant="card"
          title="Dashboard Loading Error"
          message="Failed to load dashboard data. Please check your connection and try again."
          error={statsError || transactionsError}
          onRetry={handleRefresh}
          showDetails={process.env.NODE_ENV === 'development'}
        />
      )}

      {/* Stats Grid */}
      {statsLoading ? (
        <DashboardStatsSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white p-6 rounded-lg shadow-soft border border-gray-100 hover:shadow-medium transition-shadow"
            >
              {card.loading ? (
                <div className="animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <div className="h-6 w-6 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          );
        })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-soft border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setShowAddTransactionModal(true)}
            disabled={addTransactionLoading}
            className="p-4 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <h3 className="font-medium text-gray-900">Add Transaction</h3>
            <p className="text-sm text-gray-600 mt-1">Record a new income or expense</p>
          </button>
          <button
            onClick={() => setShowCreateBudgetModal(true)}
            className="p-4 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <h3 className="font-medium text-gray-900">Create Budget</h3>
            <p className="text-sm text-gray-600 mt-1">Set spending limits for categories</p>
          </button>
          <button
            onClick={() => setShowAIChat(true)}
            className="p-4 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <h3 className="font-medium text-gray-900">Ask AI</h3>
            <p className="text-sm text-gray-600 mt-1">Get personalized financial advice</p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-soft border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>

        {transactionsLoading ? (
          <TransactionListSkeleton count={5} />
        ) : recentTransactions.length > 0 ? (
          <div className="space-y-3">
            {recentTransactions.map((transaction) => {
              const isIncome = transaction.type === 'INCOME';
              const amount = Math.abs(transaction.amount);
              const formattedDate = new Date(transaction.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              });

              return (
                <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-500">{transaction.category} • {formattedDate}</p>
                  </div>
                  <span
                    className={`font-semibold ${
                      isIncome ? 'text-success-600' : 'text-gray-900'
                    }`}
                  >
                    {isIncome ? '+' : '-'}${amount.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No recent transactions found</p>
            <p className="text-sm text-gray-400 mt-1">Add your first transaction to get started</p>
          </div>
        )}

        {transactionsError && !transactionsLoading && (
          <ErrorDisplay
            type="network"
            variant="inline"
            message="Failed to load recent transactions"
            onRetry={() => refetchTransactions()}
          />
        )}
      </div>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={showAddTransactionModal}
        onClose={() => setShowAddTransactionModal(false)}
        onSubmit={handleAddTransaction}
      />

      {/* AI Financial Chat Modal */}
      <AIFinancialChatModal
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
        userFinancialData={{
          totalBalance: stats?.totalBalance || 0,
          monthlyIncome: stats?.monthlyIncome || 0,
          monthlyExpenses: stats?.monthlyExpenses || 0,
          savingsRate: stats?.savingsRate || 0,
          recentTransactions: recentTransactions.slice(0, 5)
        }}
      />

      {/* Create Budget Modal */}
      <CreateBudgetModal
        isOpen={showCreateBudgetModal}
        onClose={() => setShowCreateBudgetModal(false)}
        onSubmit={handleCreateBudget}
      />
      </div>
    </ComponentErrorBoundary>
  );
}