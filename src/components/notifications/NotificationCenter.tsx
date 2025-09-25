'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  Calendar,
  ChevronDown,
  MoreVertical,
  ExternalLink,
  Archive
} from 'lucide-react';
import {
  BaseNotification,
  NotificationType,
  NotificationPriority,
  NotificationStats
} from '@/types/notifications';
import {
  getNotificationIcon,
  getNotificationColor,
  getPriorityColor,
  formatCurrency
} from '@/lib/utils/notifications';
import { cn } from '@/lib/utils/cn';

interface NotificationCenterProps {
  notifications: BaseNotification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  stats: NotificationStats;
}

interface NotificationItemProps {
  notification: BaseNotification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onAction?: (notification: BaseNotification) => void;
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onAction
}: NotificationItemProps) {
  const [showActions, setShowActions] = useState(false);
  const colors = getNotificationColor(notification.type);
  const icon = getNotificationIcon(notification.type);
  const priorityColor = getPriorityColor(notification.priority);

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return timestamp.toLocaleDateString();
  };

  const formatNotificationData = () => {
    if (!notification.data) return null;

    const { amount, budgetName, goalName, merchant, percentage } = notification.data;

    return (
      <div className="mt-2 text-sm text-gray-600 space-y-1">
        {amount && (
          <div>Amount: <span className="font-medium">{formatCurrency(amount)}</span></div>
        )}
        {merchant && (
          <div>Merchant: <span className="font-medium">{merchant}</span></div>
        )}
        {budgetName && (
          <div>Budget: <span className="font-medium">{budgetName}</span></div>
        )}
        {goalName && (
          <div>Goal: <span className="font-medium">{goalName}</span></div>
        )}
        {percentage !== undefined && (
          <div>Progress: <span className="font-medium">{Math.round(percentage)}%</span></div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'relative p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer',
        !notification.read && 'bg-blue-50'
      )}
      onClick={() => !notification.read && onMarkAsRead(notification.id)}
    >
      {/* Priority indicator */}
      {notification.priority !== 'low' && (
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 w-1',
            priorityColor
          )}
        />
      )}

      <div className="flex items-start space-x-3 pl-2">
        {/* Icon */}
        <div className={cn('text-lg flex-shrink-0 mt-0.5', colors.icon)}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className={cn(
                  'text-sm font-medium text-gray-900',
                  !notification.read && 'font-semibold'
                )}>
                  {notification.title}
                </h4>
                {!notification.read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {notification.message}
              </p>
              {formatNotificationData()}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {formatTimeAgo(notification.timestamp)}
                </span>
                {(notification.type === 'budget-exceeded' || notification.type === 'goal-achieved') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction?.(notification);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>View Details</span>
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(!showActions);
                }}
                className="p-1 rounded-full hover:bg-gray-200 transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button>

              {showActions && (
                <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                  {!notification.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsRead(notification.id);
                        setShowActions(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Mark as read</span>
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(notification.id);
                      setShowActions(false);
                    }}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 text-red-600 flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotificationCenter({
  notifications,
  isOpen,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
  stats
}: NotificationCenterProps) {
  const [filter, setFilter] = useState<'all' | NotificationType | NotificationPriority>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const centerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (centerRef.current && !centerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const filteredNotifications = notifications.filter(notification => {
    if (filter !== 'all') {
      if (filter === notification.type || filter === notification.priority) {
        // Match filter
      } else {
        return false;
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query)
      );
    }

    return true;
  }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const unreadNotifications = filteredNotifications.filter(n => !n.read);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-end pt-16 pr-4">
      <div
        ref={centerRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-md h-[600px] flex flex-col animate-in slide-in-from-right-5 duration-300"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              {stats.unread > 0 && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {stats.unread}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Search and filters */}
          <div className="mt-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'flex items-center space-x-1 px-3 py-1 text-sm border rounded-lg transition-colors',
                  showFilters
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                )}
              >
                <Filter className="w-4 h-4" />
                <span>Filter</span>
                <ChevronDown className={cn('w-4 h-4 transition-transform', showFilters && 'rotate-180')} />
              </button>

              {stats.unread > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Mark all read</span>
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear all</span>
                </button>
              )}
            </div>

            {/* Filter options */}
            {showFilters && (
              <div className="p-3 border border-gray-200 rounded-lg bg-gray-50 space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="all">All Types</option>
                    <option value="budget-warning">Budget Warnings</option>
                    <option value="budget-exceeded">Budget Exceeded</option>
                    <option value="goal-achieved">Goal Achieved</option>
                    <option value="goal-milestone">Goal Milestones</option>
                    <option value="transaction-confirmed">Transactions</option>
                    <option value="bill-reminder">Bill Reminders</option>
                    <option value="security-alert">Security Alerts</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Bell className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div>
              {unreadNotifications.length > 0 && (
                <div className="p-3 bg-blue-50 border-b border-blue-100">
                  <h3 className="text-sm font-medium text-blue-900">
                    Unread ({unreadNotifications.length})
                  </h3>
                </div>
              )}

              {filteredNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={onMarkAsRead}
                  onDelete={onDelete}
                  onAction={(notification) => {
                    // Handle navigation to relevant page
                    console.log('Navigate to:', notification.type, notification.data);
                    onClose();
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer stats */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Total: {stats.total}</span>
              <span>Unread: {stats.unread}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}