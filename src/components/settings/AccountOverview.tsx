'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Calendar,
  Activity,
  TrendingUp,
  DollarSign,
  PieChart,
  Clock,
  MapPin,
  Shield,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDataFetching } from '@/hooks/useApiState';
import Loading, { CardLoading } from '../ui/Loading';
import ErrorDisplay from '../ui/ErrorDisplay';
import { ComponentErrorBoundary } from '../ui/ErrorBoundary';
import { cn } from '@/lib/utils/cn';

interface AccountStats {
  totalTransactions: number;
  totalSpent: number;
  totalSaved: number;
  budgetsCreated: number;
  goalsAchieved: number;
  activeGoals: number;
  averageMonthlySpending: number;
  topCategory: string;
  accountAge: number;
  lastActive: string;
}

interface ActivityItem {
  id: string;
  type: 'login' | 'transaction' | 'budget' | 'goal' | 'security';
  title: string;
  description: string;
  timestamp: string;
  location?: string;
  amount?: number;
}

interface SecuritySession {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  current: boolean;
}

const mockAccountStats: AccountStats = {
  totalTransactions: 1247,
  totalSpent: 45690.50,
  totalSaved: 12450.75,
  budgetsCreated: 8,
  goalsAchieved: 3,
  activeGoals: 5,
  averageMonthlySpending: 3807.54,
  topCategory: 'Food & Dining',
  accountAge: 18,
  lastActive: '2024-01-15T10:30:00Z'
};

const mockActivityData: ActivityItem[] = [
  {
    id: '1',
    type: 'login',
    title: 'Account Login',
    description: 'Logged in from Chrome on Windows',
    timestamp: '2024-01-15T10:30:00Z',
    location: 'New York, NY'
  },
  {
    id: '2',
    type: 'transaction',
    title: 'New Transaction Added',
    description: 'Grocery shopping at Whole Foods',
    timestamp: '2024-01-15T09:15:00Z',
    amount: -89.45
  },
  {
    id: '3',
    type: 'budget',
    title: 'Budget Created',
    description: 'Created monthly grocery budget',
    timestamp: '2024-01-14T16:20:00Z'
  },
  {
    id: '4',
    type: 'goal',
    title: 'Goal Milestone',
    description: 'Reached 75% of Emergency Fund goal',
    timestamp: '2024-01-14T12:00:00Z'
  },
  {
    id: '5',
    type: 'security',
    title: 'Password Changed',
    description: 'Account password was updated',
    timestamp: '2024-01-13T14:45:00Z'
  }
];

const mockSessionData: SecuritySession[] = [
  {
    id: '1',
    device: 'Windows PC',
    browser: 'Chrome 120.0',
    location: 'New York, NY',
    lastActive: '2024-01-15T10:30:00Z',
    current: true
  },
  {
    id: '2',
    device: 'iPhone 15',
    browser: 'Safari Mobile',
    location: 'New York, NY',
    lastActive: '2024-01-14T18:20:00Z',
    current: false
  },
  {
    id: '3',
    device: 'MacBook Pro',
    browser: 'Firefox 121.0',
    location: 'Brooklyn, NY',
    lastActive: '2024-01-12T22:15:00Z',
    current: false
  }
];

export default function AccountOverview() {
  const { user } = useAuth();
  const [showBalance, setShowBalance] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'year'>('month');

  const {
    data: accountStats,
    loading: statsLoading,
    error: statsError,
    fetch: fetchStats
  } = useDataFetching<AccountStats>();

  const {
    data: recentActivity,
    loading: activityLoading,
    error: activityError,
    fetch: fetchActivity
  } = useDataFetching<ActivityItem[]>();

  const {
    data: activeSessions,
    loading: sessionsLoading,
    error: sessionsError,
    fetch: fetchSessions
  } = useDataFetching<SecuritySession[]>();

  useEffect(() => {
    fetchStats(async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockAccountStats;
    });

    fetchActivity(async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return mockActivityData;
    });

    fetchSessions(async () => {
      await new Promise(resolve => setTimeout(resolve, 600));
      return mockSessionData;
    });
  }, []);

  const formatCurrency = (amount: number) => {
    if (!showBalance) return '••••••';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'login': return <User className="w-4 h-4" />;
      case 'transaction': return <DollarSign className="w-4 h-4" />;
      case 'budget': return <PieChart className="w-4 h-4" />;
      case 'goal': return <TrendingUp className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityIconColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'login': return 'text-blue-600 bg-blue-50';
      case 'transaction': return 'text-green-600 bg-green-50';
      case 'budget': return 'text-purple-600 bg-purple-50';
      case 'goal': return 'text-orange-600 bg-orange-50';
      case 'security': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <ComponentErrorBoundary componentName="AccountOverview">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Account Overview</h2>
            <p className="text-gray-600 mt-1">Your account statistics and recent activity</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showBalance ? 'Hide' : 'Show'} Balances</span>
            </button>
            <button className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </button>
          </div>
        </div>

        {/* Account Statistics */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Account Statistics</h3>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as 'week' | 'month' | 'year')}
              className="text-sm border border-gray-300 rounded-md px-2 py-1"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          {statsLoading ? (
            <CardLoading />
          ) : statsError ? (
            <ErrorDisplay
              type="network"
              variant="inline"
              error={statsError}
              onRetry={() => fetchStats(async () => mockAccountStats)}
            />
          ) : accountStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {accountStats.totalTransactions.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Transactions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(accountStats.totalSpent)}
                </div>
                <div className="text-sm text-gray-600">Total Spent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(accountStats.totalSaved)}
                </div>
                <div className="text-sm text-gray-600">Total Saved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(accountStats.averageMonthlySpending)}
                </div>
                <div className="text-sm text-gray-600">Avg. Monthly</div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <PieChart className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {accountStats?.budgetsCreated || 0}
                </div>
                <div className="text-sm text-gray-600">Budgets Created</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {accountStats?.goalsAchieved || 0} / {accountStats?.activeGoals || 0}
                </div>
                <div className="text-sm text-gray-600">Goals Achieved</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {accountStats?.accountAge || 0} months
                </div>
                <div className="text-sm text-gray-600">Account Age</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>

          {activityLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          ) : activityError ? (
            <ErrorDisplay
              type="network"
              variant="inline"
              error={activityError}
              onRetry={() => fetchActivity(async () => mockActivityData)}
            />
          ) : recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={cn('p-2 rounded-lg', getActivityIconColor(activity.type))}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{activity.title}</h4>
                      {activity.amount && (
                        <span className={cn(
                          'text-sm font-medium',
                          activity.amount > 0 ? 'text-green-600' : 'text-red-600'
                        )}>
                          {activity.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(activity.amount))}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    {activity.location && (
                      <div className="flex items-center space-x-1 mt-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{activity.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(activity.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No recent activity found</p>
            </div>
          )}
        </div>

        {/* Active Sessions */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Active Sessions</h3>

          {sessionsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-8 w-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : sessionsError ? (
            <ErrorDisplay
              type="network"
              variant="inline"
              error={sessionsError}
              onRetry={() => fetchSessions(async () => mockSessionData)}
            />
          ) : activeSessions && activeSessions.length > 0 ? (
            <div className="space-y-4">
              {activeSessions.map((session) => (
                <div key={session.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <Shield className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{session.device}</h4>
                      {session.current && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{session.browser}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{session.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          Last active: {formatDate(session.lastActive)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!session.current && (
                    <button className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors">
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No active sessions found</p>
            </div>
          )}
        </div>

        {/* Account Summary */}
        {accountStats && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Top Spending Category</h4>
                <p className="text-2xl font-bold text-blue-600">{accountStats.topCategory}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Last Active</h4>
                <p className="text-lg text-gray-700">{formatDate(accountStats.lastActive)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ComponentErrorBoundary>
  );
}