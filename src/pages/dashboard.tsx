import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useQuery } from '@apollo/client';
import { DollarSign, TrendingUp, TrendingDown, Target, AlertCircle, Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import {
  GET_DASHBOARD_STATS,
  GET_RECENT_TRANSACTIONS,
  GET_USER_PROFILE,
  GET_ACTIVE_GOALS
} from '@/lib/graphql/queries/dashboard';

interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  activeGoals: number;
  completedGoals: number;
  budgetAdherence: number;
  topSpendingCategory: string;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  createdAt: string;
}

interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  status: string;
  priority: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  preferredCurrency: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // GraphQL queries
  const {
    data: statsData,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useQuery(GET_DASHBOARD_STATS, {
    skip: !isAuthenticated,
    errorPolicy: 'all'
  });

  const {
    data: transactionsData,
    loading: transactionsLoading,
    error: transactionsError
  } = useQuery(GET_RECENT_TRANSACTIONS, {
    variables: { limit: 5 },
    skip: !isAuthenticated,
    errorPolicy: 'all'
  });

  const {
    data: userProfile,
    loading: userLoading,
    error: userError
  } = useQuery(GET_USER_PROFILE, {
    skip: !isAuthenticated,
    errorPolicy: 'all'
  });

  const {
    data: goalsData,
    loading: goalsLoading,
    error: goalsError
  } = useQuery(GET_ACTIVE_GOALS, {
    variables: { limit: 3 },
    skip: !isAuthenticated,
    errorPolicy: 'all'
  });

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

    if (!token) {
      // Redirect to login with return URL
      router.push(`/login?redirect=${encodeURIComponent('/dashboard')}`);
      return;
    }

    setIsAuthenticated(true);
    setIsLoading(false);
  }, [router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  const stats: DashboardStats = statsData?.getDashboardStats || {
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savingsRate: 0,
    activeGoals: 0,
    completedGoals: 0,
    budgetAdherence: 0,
    topSpendingCategory: 'other'
  };

  const recentTransactions: Transaction[] = transactionsData?.getTransactions?.transactions || [];
  const user: User | null = userProfile?.me || null;
  const goals: Goal[] = goalsData?.getGoals?.goals || [];

  const isDataLoading = statsLoading || transactionsLoading || userLoading || goalsLoading;
  const hasErrors = statsError || transactionsError || userError || goalsError;

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

    if (diffDays === 0) {
      if (diffHours === 0) {
        return 'Just now';
      }
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return '1 day ago';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const statsCards = [
    {
      title: 'Current Balance',
      value: formatCurrency(stats.totalBalance),
      change: stats.savingsRate > 0 ? `+${stats.savingsRate.toFixed(1)}% savings rate` : 'No savings',
      changeType: stats.savingsRate > 0 ? 'positive' as const : 'neutral' as const,
      icon: DollarSign,
    },
    {
      title: 'Monthly Income',
      value: formatCurrency(stats.monthlyIncome),
      change: stats.monthlyIncome > 0 ? 'This month' : 'No income recorded',
      changeType: stats.monthlyIncome > 0 ? 'positive' as const : 'neutral' as const,
      icon: TrendingUp,
    },
    {
      title: 'Monthly Expenses',
      value: formatCurrency(stats.monthlyExpenses),
      change: stats.topSpendingCategory ? `Top: ${stats.topSpendingCategory}` : 'No expenses recorded',
      changeType: 'neutral' as const,
      icon: TrendingDown,
    },
    {
      title: 'Active Goals',
      value: `${stats.activeGoals}`,
      change: stats.completedGoals > 0 ? `${stats.completedGoals} completed` : 'No completed goals',
      changeType: stats.activeGoals > 0 ? 'positive' as const : 'neutral' as const,
      icon: Target,
    },
  ];

  return (
    <>
      <Head>
        <title>Dashboard - AI Personal Finance Mentor</title>
        <meta name="description" content="Your personal finance dashboard - track expenses, budgets, and goals" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back{user?.name ? `, ${user.name}` : ''}!
              </h1>
              <p className="text-gray-600">Here's your financial overview for today.</p>
            </div>

            {hasErrors && (
              <div className="flex items-center space-x-2 text-amber-600">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">Some data couldn't be loaded</span>
                <button
                  onClick={() => refetchStats()}
                  className="text-sm underline hover:no-underline"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* Loading State */}
          {isDataLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading your dashboard...</span>
            </div>
          )}

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
                        card.changeType === 'positive' ? 'text-success-600' :
                        card.changeType === 'negative' ? 'text-error-600' : 'text-gray-500'
                      }`}
                    >
                      {card.change}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow-soft border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => router.push('/transactions/new')}
                className="p-4 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <h3 className="font-medium text-gray-900">Add Transaction</h3>
                <p className="text-sm text-gray-600 mt-1">Record a new income or expense</p>
              </button>
              <button
                onClick={() => router.push('/budgets/new')}
                className="p-4 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <h3 className="font-medium text-gray-900">Create Budget</h3>
                <p className="text-sm text-gray-600 mt-1">Set spending limits for categories</p>
              </button>
              <button
                onClick={() => router.push('/ai-chat')}
                className="p-4 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <h3 className="font-medium text-gray-900">Ask AI</h3>
                <p className="text-sm text-gray-600 mt-1">Get personalized financial advice</p>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-lg shadow-soft border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <button
                onClick={() => router.push('/transactions')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View all
              </button>
            </div>

            {transactionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading transactions...</span>
              </div>
            ) : recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {transaction.category} • {formatDate(transaction.date)}
                      </p>
                    </div>
                    <span
                      className={`font-semibold ${
                        transaction.type === 'income' ? 'text-success-600' : 'text-gray-900'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No recent transactions found.</p>
                <button
                  onClick={() => router.push('/transactions/new')}
                  className="mt-2 text-primary-600 hover:text-primary-700 font-medium"
                >
                  Add your first transaction
                </button>
              </div>
            )}
          </div>

          {/* Active Goals */}
          {goals.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-soft border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Active Goals</h2>
                <button
                  onClick={() => router.push('/goals')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View all
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {goals.map((goal) => {
                  const progress = (goal.currentAmount / goal.targetAmount) * 100;
                  return (
                    <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">{goal.title}</h3>
                      <div className="mb-2">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>{formatCurrency(goal.currentAmount)}</span>
                          <span>{formatCurrency(goal.targetAmount)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">
                        {progress.toFixed(1)}% complete • Target: {new Date(goal.targetDate).toLocaleDateString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}