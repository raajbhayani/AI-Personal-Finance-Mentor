import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useQuery, useMutation } from '@apollo/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import {
  Plus,
  Target,
  TrendingUp,
  Award,
  Filter,
  Search,
  Edit3,
  Trash2,
  Calendar,
  DollarSign,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  TrendingDown,
  PiggyBank,
  Star,
  Flag,
  MoreHorizontal
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

import Layout from '@/components/layout/Layout';
import {
  GET_GOALS,
  ADD_GOAL,
  UPDATE_GOAL,
  DELETE_GOAL,
  ADD_GOAL_PROGRESS,
} from '@/lib/graphql/queries/goals';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface Goal {
  id: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  isRecurring: boolean;
  reminderFrequency?: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  createdAt: string;
  updatedAt: string;
  progressPercentage: number;
  remainingAmount: number;
  isCompleted: boolean;
  daysRemaining: number;
  monthlySavingsNeeded: number;
  milestones: GoalMilestone[];
}

interface GoalMilestone {
  id: string;
  amount: number;
  date: string;
  description?: string;
  isAchieved: boolean;
  createdAt: string;
}

interface GoalFilters {
  category?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  isCompleted?: boolean;
  search?: string;
}

interface AddGoalInput {
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount?: number;
  targetDate: string;
  category: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  isRecurring?: boolean;
  reminderFrequency?: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
}

const GOAL_CATEGORIES = [
  { value: 'EMERGENCY_FUND', label: 'Emergency Fund', icon: '🚨', color: 'red' },
  { value: 'VACATION', label: 'Vacation', icon: '🏖️', color: 'blue' },
  { value: 'HOUSE_DOWN_PAYMENT', label: 'House Down Payment', icon: '🏠', color: 'green' },
  { value: 'CAR_PURCHASE', label: 'Car Purchase', icon: '🚗', color: 'purple' },
  { value: 'RETIREMENT', label: 'Retirement', icon: '🏖️', color: 'orange' },
  { value: 'EDUCATION', label: 'Education', icon: '🎓', color: 'indigo' },
  { value: 'DEBT_PAYOFF', label: 'Debt Payoff', icon: '💳', color: 'red' },
  { value: 'INVESTMENT', label: 'Investment', icon: '📈', color: 'green' },
  { value: 'WEDDING', label: 'Wedding', icon: '💒', color: 'pink' },
  { value: 'BUSINESS', label: 'Business', icon: '💼', color: 'blue' },
  { value: 'OTHER', label: 'Other', icon: '🎯', color: 'gray' },
];

const PRIORITY_OPTIONS = [
  { value: 'HIGH', label: 'High Priority', color: 'text-red-600 bg-red-50' },
  { value: 'MEDIUM', label: 'Medium Priority', color: 'text-yellow-600 bg-yellow-50' },
  { value: 'LOW', label: 'Low Priority', color: 'text-green-600 bg-green-50' },
];

export default function GoalsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    showGoalCompleted,
    showProgressMilestone,
    showGoalCreated,
    showProgressAdded,
    addNotification
  } = useNotification();

  // State for filters and search
  const [filters, setFilters] = useState<GoalFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [chartView, setChartView] = useState<'overview' | 'progress' | 'categories'>('overview');

  // Form state
  const [goalForm, setGoalForm] = useState<AddGoalInput>({
    title: '',
    description: '',
    targetAmount: 0,
    currentAmount: 0,
    targetDate: '',
    category: 'OTHER',
    priority: 'MEDIUM',
    isRecurring: false,
    reminderFrequency: 'MONTHLY',
  });

  const [progressForm, setProgressForm] = useState({
    amount: 0,
    description: '',
  });

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent('/goals')}`);
    }
  }, [isAuthenticated, authLoading, router]);

  // GraphQL queries and mutations
  const {
    data: goalsData,
    loading: goalsLoading,
    error: goalsError,
    refetch: refetchGoals,
  } = useQuery(GET_GOALS, {
    variables: {
      filters,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
      sortBy,
      sortOrder,
    },
    skip: !isAuthenticated || authLoading,
    errorPolicy: 'all',
  });

  const [addGoal, { loading: addLoading }] = useMutation(ADD_GOAL, {
    onCompleted: (data) => {
      const newGoal = data?.addGoal;
      if (newGoal) {
        showGoalCreated(newGoal.title, newGoal.id);
      }
      setShowCreateModal(false);
      resetForm();
      refetchGoals();
    },
    onError: (error) => {
      console.error('Error adding goal:', error);
      addNotification({
        type: 'error',
        title: 'Error Creating Goal',
        message: 'Failed to create goal. Please try again.',
        duration: 5000
      });
    },
  });

  const [updateGoal, { loading: updateLoading }] = useMutation(UPDATE_GOAL, {
    onCompleted: (data) => {
      const updatedGoal = data?.updateGoal;
      if (updatedGoal) {
        addNotification({
          type: 'success',
          title: 'Goal Updated',
          message: `"${updatedGoal.title}" has been updated successfully.`,
          duration: 4000
        });
      }
      setShowEditModal(false);
      setSelectedGoal(null);
      resetForm();
      refetchGoals();
    },
    onError: (error) => {
      console.error('Error updating goal:', error);
      addNotification({
        type: 'error',
        title: 'Error Updating Goal',
        message: 'Failed to update goal. Please try again.',
        duration: 5000
      });
    },
  });

  const [deleteGoal] = useMutation(DELETE_GOAL, {
    onCompleted: (data) => {
      const deletedGoal = data?.deleteGoal;
      if (deletedGoal) {
        addNotification({
          type: 'success',
          title: 'Goal Deleted',
          message: `"${deletedGoal.title}" has been deleted successfully.`,
          duration: 4000
        });
      }
      refetchGoals();
    },
    onError: (error) => {
      console.error('Error deleting goal:', error);
      addNotification({
        type: 'error',
        title: 'Error Deleting Goal',
        message: 'Failed to delete goal. Please try again.',
        duration: 5000
      });
    },
  });

  const [addGoalProgress] = useMutation(ADD_GOAL_PROGRESS, {
    onCompleted: (data) => {
      const updatedGoal = data?.addGoalProgress;
      if (updatedGoal && selectedGoal) {
        const progressAmount = progressForm.amount;
        const newProgress = updatedGoal.progressPercentage;
        const oldProgress = selectedGoal.progressPercentage;

        // Show progress added notification
        showProgressAdded(selectedGoal.title, progressAmount, selectedGoal.id);

        // Check for milestone achievement
        showProgressMilestone(selectedGoal.title, newProgress, selectedGoal.id);

        // Check for goal completion
        if (updatedGoal.isCompleted && !selectedGoal.isCompleted) {
          showGoalCompleted(selectedGoal.title, selectedGoal.targetAmount, selectedGoal.id);
        }
      }
      setShowProgressModal(false);
      setSelectedGoal(null);
      setProgressForm({ amount: 0, description: '' });
      refetchGoals();
    },
    onError: (error) => {
      console.error('Error adding goal progress:', error);
      addNotification({
        type: 'error',
        title: 'Error Adding Progress',
        message: 'Failed to add progress. Please try again.',
        duration: 5000
      });
    },
  });

  // Memoized values
  const goals = useMemo(() => {
    return goalsData?.getGoals?.edges?.map((edge: any) => edge.node) || [];
  }, [goalsData]);

  const pageInfo = goalsData?.getGoals?.pageInfo;
  const totalCount = goalsData?.getGoals?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Statistics
  const statistics = useMemo(() => {
    const activeGoals = goals.filter(g => !g.isCompleted);
    const completedGoals = goals.filter(g => g.isCompleted);
    const totalTargetAmount = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalCurrentAmount = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;
    const avgProgress = goals.length > 0 ? goals.reduce((sum, g) => sum + g.progressPercentage, 0) / goals.length : 0;

    return {
      totalGoals: goals.length,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      totalTargetAmount,
      totalCurrentAmount,
      overallProgress,
      avgProgress,
    };
  }, [goals]);

  // Chart data
  const chartData = useMemo(() => {
    // Overview chart - progress by category
    const categoryData = GOAL_CATEGORIES.map(category => {
      const categoryGoals = goals.filter(g => g.category.toUpperCase() === category.value);
      const totalTarget = categoryGoals.reduce((sum, g) => sum + g.targetAmount, 0);
      const totalCurrent = categoryGoals.reduce((sum, g) => sum + g.currentAmount, 0);
      return {
        category: category.label,
        target: totalTarget,
        current: totalCurrent,
        count: categoryGoals.length,
      };
    }).filter(d => d.count > 0);

    // Progress chart - monthly progress simulation
    const progressData = goals.map(goal => ({
      label: goal.title,
      progress: goal.progressPercentage,
      remaining: 100 - goal.progressPercentage,
    }));

    // Categories doughnut chart
    const categoriesData = {
      labels: categoryData.map(d => d.category),
      datasets: [
        {
          data: categoryData.map(d => d.current),
          backgroundColor: [
            '#ef4444', '#3b82f6', '#10b981', '#8b5cf6',
            '#f59e0b', '#6366f1', '#ec4899', '#14b8a6',
            '#f97316', '#84cc16', '#64748b'
          ],
          borderWidth: 2,
          borderColor: '#ffffff',
        },
      ],
    };

    const overviewBarData = {
      labels: categoryData.map(d => d.category),
      datasets: [
        {
          label: 'Current Amount',
          data: categoryData.map(d => d.current),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
        {
          label: 'Target Amount',
          data: categoryData.map(d => d.target),
          backgroundColor: 'rgba(156, 163, 175, 0.3)',
          borderColor: 'rgba(156, 163, 175, 1)',
          borderWidth: 1,
        },
      ],
    };

    const progressBarData = {
      labels: progressData.slice(0, 10).map(d => d.label.substring(0, 15) + (d.label.length > 15 ? '...' : '')),
      datasets: [
        {
          label: 'Progress %',
          data: progressData.slice(0, 10).map(d => d.progress),
          backgroundColor: progressData.slice(0, 10).map(d =>
            d.progress >= 100 ? '#10b981' :
            d.progress >= 75 ? '#f59e0b' :
            d.progress >= 50 ? '#3b82f6' : '#ef4444'
          ),
          borderWidth: 1,
        },
      ],
    };

    return {
      categories: categoriesData,
      overview: overviewBarData,
      progress: progressBarData,
    };
  }, [goals]);

  // Handlers
  const resetForm = () => {
    setGoalForm({
      title: '',
      description: '',
      targetAmount: 0,
      currentAmount: 0,
      targetDate: '',
      category: 'OTHER',
      priority: 'MEDIUM',
      isRecurring: false,
      reminderFrequency: 'MONTHLY',
    });
  };

  const handleCreateGoal = async () => {
    try {
      await addGoal({
        variables: {
          input: {
            ...goalForm,
            targetAmount: parseFloat(goalForm.targetAmount.toString()),
            currentAmount: parseFloat(goalForm.currentAmount?.toString() || '0'),
            targetDate: new Date(goalForm.targetDate),
          },
        },
      });
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setGoalForm({
      title: goal.title,
      description: goal.description || '',
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      targetDate: goal.targetDate.split('T')[0],
      category: goal.category.toUpperCase(),
      priority: goal.priority,
      isRecurring: goal.isRecurring,
      reminderFrequency: goal.reminderFrequency || 'MONTHLY',
    });
    setShowEditModal(true);
  };

  const handleUpdateGoal = async () => {
    if (!selectedGoal) return;

    try {
      await updateGoal({
        variables: {
          id: selectedGoal.id,
          input: {
            ...goalForm,
            targetAmount: parseFloat(goalForm.targetAmount.toString()),
            currentAmount: parseFloat(goalForm.currentAmount?.toString() || '0'),
            targetDate: new Date(goalForm.targetDate),
          },
        },
      });
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const handleDeleteGoal = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      await deleteGoal({ variables: { id } });
    }
  };

  const handleAddProgress = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowProgressModal(true);
  };

  const handleSubmitProgress = async () => {
    if (!selectedGoal) return;

    try {
      await addGoalProgress({
        variables: {
          id: selectedGoal.id,
          amount: parseFloat(progressForm.amount.toString()),
          description: progressForm.description || undefined,
        },
      });
    } catch (error) {
      console.error('Error adding progress:', error);
    }
  };

  const applyFilters = (newFilters: Partial<GoalFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setCurrentPage(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPriorityColor = (priority: string) => {
    const option = PRIORITY_OPTIONS.find(p => p.value === priority);
    return option?.color || 'text-gray-600 bg-gray-50';
  };

  const getCategoryInfo = (category: string) => {
    return GOAL_CATEGORIES.find(c => c.value === category.toUpperCase()) || GOAL_CATEGORIES[GOAL_CATEGORIES.length - 1];
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Financial Goals - AI Personal Finance Mentor</title>
        <meta name="description" content="Track and manage your financial goals - save for your dreams" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Financial Goals</h1>
              <p className="text-gray-600">Track your progress and achieve your financial dreams</p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Goal
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-soft border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Goals</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{statistics.totalGoals}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-soft border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{statistics.completedGoals}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-soft border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Saved</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {formatCurrency(statistics.totalCurrentAmount)}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <PiggyBank className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-soft border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overall Progress</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">
                    {statistics.overallProgress.toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="bg-white rounded-lg shadow-soft border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Goals Analytics</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setChartView('overview')}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      chartView === 'overview'
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setChartView('progress')}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      chartView === 'progress'
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Progress
                  </button>
                  <button
                    onClick={() => setChartView('categories')}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      chartView === 'categories'
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Categories
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {chartView === 'overview' && (
                <div className="h-64">
                  <Bar
                    data={chartData.overview}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        title: {
                          display: true,
                          text: 'Goal Progress by Category',
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: (value) => formatCurrency(Number(value)),
                          },
                        },
                      },
                    }}
                  />
                </div>
              )}

              {chartView === 'progress' && (
                <div className="h-64">
                  <Bar
                    data={chartData.progress}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        title: {
                          display: true,
                          text: 'Individual Goal Progress',
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                          ticks: {
                            callback: (value) => `${value}%`,
                          },
                        },
                      },
                    }}
                  />
                </div>
              )}

              {chartView === 'categories' && (
                <div className="h-64 flex justify-center">
                  <div className="w-64">
                    <Doughnut
                      data={chartData.categories}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'right',
                          },
                          title: {
                            display: true,
                            text: 'Savings by Category',
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white p-6 rounded-lg shadow-soft border border-gray-100">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search goals..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      applyFilters({ search: e.target.value || undefined });
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    showFilters
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </button>

                <button
                  onClick={() => refetchGoals()}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={filters.category || ''}
                    onChange={(e) => applyFilters({ category: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Categories</option>
                    {GOAL_CATEGORIES.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={filters.priority || ''}
                    onChange={(e) => applyFilters({ priority: e.target.value as any || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Priorities</option>
                    {PRIORITY_OPTIONS.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Goals Grid */}
          <div className="bg-white rounded-lg shadow-soft border border-gray-100 overflow-hidden">
            {goalsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading goals...</span>
              </div>
            ) : goalsError ? (
              <div className="flex items-center justify-center py-12">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <span className="ml-2 text-red-600">Error loading goals</span>
              </div>
            ) : goals.length === 0 ? (
              <div className="text-center py-12">
                <Target className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No financial goals found</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first financial goal.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Goal
                </button>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {goals.map((goal) => {
                    const categoryInfo = getCategoryInfo(goal.category);
                    const priorityColor = getPriorityColor(goal.priority);

                    return (
                      <div key={goal.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">{categoryInfo.icon}</div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priorityColor}`}>
                                {goal.priority.toLowerCase()} priority
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1">
                            {goal.isCompleted && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                            <div className="relative group">
                              <button className="p-1 rounded hover:bg-gray-100">
                                <MoreHorizontal className="w-4 h-4 text-gray-500" />
                              </button>
                              <div className="absolute right-0 top-8 w-32 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                <button
                                  onClick={() => handleEditGoal(goal)}
                                  className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center"
                                >
                                  <Edit3 className="w-3 h-3 mr-2" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleAddProgress(goal)}
                                  className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center"
                                >
                                  <Plus className="w-3 h-3 mr-2" />
                                  Add Progress
                                </button>
                                <button
                                  onClick={() => handleDeleteGoal(goal.id, goal.title)}
                                  className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 text-red-600 flex items-center"
                                >
                                  <Trash2 className="w-3 h-3 mr-2" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {goal.description && (
                          <p className="text-sm text-gray-600 mb-4">{goal.description}</p>
                        )}

                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>{formatCurrency(goal.currentAmount)}</span>
                            <span>{formatCurrency(goal.targetAmount)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full transition-all duration-300 ${
                                goal.isCompleted ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min(goal.progressPercentage, 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>{goal.progressPercentage.toFixed(1)}% complete</span>
                            <span>{goal.daysRemaining} days left</span>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center justify-between">
                            <span>Target Date:</span>
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(goal.targetDate)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Monthly Needed:</span>
                            <span className="flex items-center">
                              <DollarSign className="w-3 h-3 mr-1" />
                              {formatCurrency(goal.monthlySavingsNeeded)}
                            </span>
                          </div>
                        </div>

                        {!goal.isCompleted && (
                          <button
                            onClick={() => handleAddProgress(goal)}
                            className="w-full mt-4 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium"
                          >
                            Add Progress
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-700">
                      <span>
                        Showing {(currentPage - 1) * pageSize + 1} to{' '}
                        {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>

                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNumber = i + 1;
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => setCurrentPage(pageNumber)}
                              className={`px-3 py-2 text-sm font-medium rounded-lg ${
                                currentPage === pageNumber
                                  ? 'bg-primary-600 text-white'
                                  : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Create Goal Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Goal</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Goal Title *
                    </label>
                    <input
                      type="text"
                      value={goalForm.title}
                      onChange={(e) => setGoalForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Emergency Fund"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={goalForm.description}
                      onChange={(e) => setGoalForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Optional description of your goal"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Amount *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={goalForm.targetAmount}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, targetAmount: parseFloat(e.target.value) || 0 }))}
                        placeholder="10000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={goalForm.currentAmount}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, currentAmount: parseFloat(e.target.value) || 0 }))}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        value={goalForm.category}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        {GOAL_CATEGORIES.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        value={goalForm.priority}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, priority: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        {PRIORITY_OPTIONS.map(priority => (
                          <option key={priority.value} value={priority.value}>
                            {priority.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Date *
                    </label>
                    <input
                      type="date"
                      value={goalForm.targetDate}
                      onChange={(e) => setGoalForm(prev => ({ ...prev, targetDate: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={goalForm.isRecurring}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, isRecurring: e.target.checked }))}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Recurring goal</span>
                    </label>
                  </div>

                  {goalForm.isRecurring && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reminder Frequency
                      </label>
                      <select
                        value={goalForm.reminderFrequency}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, reminderFrequency: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="WEEKLY">Weekly</option>
                        <option value="MONTHLY">Monthly</option>
                        <option value="QUARTERLY">Quarterly</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateGoal}
                    disabled={addLoading || !goalForm.title || !goalForm.targetAmount || !goalForm.targetDate}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {addLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Goal'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Goal Modal */}
        {showEditModal && selectedGoal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Goal</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Goal Title *
                    </label>
                    <input
                      type="text"
                      value={goalForm.title}
                      onChange={(e) => setGoalForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Emergency Fund"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={goalForm.description}
                      onChange={(e) => setGoalForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Optional description of your goal"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Amount *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={goalForm.targetAmount}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, targetAmount: parseFloat(e.target.value) || 0 }))}
                        placeholder="10000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={goalForm.currentAmount}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, currentAmount: parseFloat(e.target.value) || 0 }))}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        value={goalForm.category}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        {GOAL_CATEGORIES.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        value={goalForm.priority}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, priority: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        {PRIORITY_OPTIONS.map(priority => (
                          <option key={priority.value} value={priority.value}>
                            {priority.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Date *
                    </label>
                    <input
                      type="date"
                      value={goalForm.targetDate}
                      onChange={(e) => setGoalForm(prev => ({ ...prev, targetDate: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={goalForm.isRecurring}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, isRecurring: e.target.checked }))}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Recurring goal</span>
                    </label>
                  </div>

                  {goalForm.isRecurring && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reminder Frequency
                      </label>
                      <select
                        value={goalForm.reminderFrequency}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, reminderFrequency: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="WEEKLY">Weekly</option>
                        <option value="MONTHLY">Monthly</option>
                        <option value="QUARTERLY">Quarterly</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedGoal(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateGoal}
                    disabled={updateLoading || !goalForm.title || !goalForm.targetAmount || !goalForm.targetDate}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {updateLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Goal'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Progress Modal */}
        {showProgressModal && selectedGoal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Add Progress to "{selectedGoal.title}"
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount to Add *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={progressForm.amount}
                      onChange={(e) => setProgressForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      placeholder="100.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={progressForm.description}
                      onChange={(e) => setProgressForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="e.g., Salary bonus, tax refund"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Current Progress:</span>
                        <span>{formatCurrency(selectedGoal.currentAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>After Adding:</span>
                        <span>{formatCurrency(selectedGoal.currentAmount + progressForm.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Remaining:</span>
                        <span>{formatCurrency(Math.max(selectedGoal.targetAmount - selectedGoal.currentAmount - progressForm.amount, 0))}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowProgressModal(false);
                      setSelectedGoal(null);
                      setProgressForm({ amount: 0, description: '' });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitProgress}
                    disabled={progressForm.amount <= 0}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Add Progress
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}