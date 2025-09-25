'use client';

import React, { useEffect, useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { BaseNotification, NotificationAction } from '@/types/notifications';
import {
  getNotificationIcon,
  getNotificationColor,
  getPriorityColor,
  formatCurrency
} from '@/lib/utils/notifications';
import { cn } from '@/lib/utils/cn';

interface ToastNotificationProps {
  notification: BaseNotification;
  onDismiss: (id: string) => void;
  onAction?: (action: NotificationAction) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  className?: string;
}

export default function ToastNotification({
  notification,
  onDismiss,
  onAction,
  position = 'top-right',
  className
}: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const colors = getNotificationColor(notification.type);
  const icon = getNotificationIcon(notification.type);
  const priorityColor = getPriorityColor(notification.priority);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-hide for non-persistent notifications
    if (!notification.persistent && notification.autoHideMs && notification.autoHideMs > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, notification.autoHideMs);

      return () => clearTimeout(timer);
    }
  }, [notification.persistent, notification.autoHideMs]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  const getAnimationClasses = () => {
    const baseClasses = 'transition-all duration-300 ease-in-out';

    if (isExiting) {
      return `${baseClasses} opacity-0 transform translate-x-full scale-95`;
    }

    if (isVisible) {
      return `${baseClasses} opacity-100 transform translate-x-0 scale-100`;
    }

    return `${baseClasses} opacity-0 transform translate-x-full scale-95`;
  };

  const formatNotificationData = () => {
    if (!notification.data) return null;

    const { amount, budgetName, goalName, merchant, percentage } = notification.data;

    return (
      <div className="mt-2 text-sm">
        {amount && (
          <div className="font-medium">
            Amount: {formatCurrency(amount)}
          </div>
        )}
        {merchant && (
          <div className="text-gray-600">
            Merchant: {merchant}
          </div>
        )}
        {budgetName && (
          <div className="text-gray-600">
            Budget: {budgetName}
          </div>
        )}
        {goalName && (
          <div className="text-gray-600">
            Goal: {goalName}
          </div>
        )}
        {percentage && (
          <div className="text-gray-600">
            Progress: {Math.round(percentage)}%
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'fixed z-50 max-w-sm w-full',
        getPositionClasses(),
        getAnimationClasses(),
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div
        className={cn(
          'relative p-4 rounded-lg shadow-lg border backdrop-blur-sm',
          colors.bg,
          colors.border,
          'bg-opacity-95'
        )}
      >
        {/* Priority indicator */}
        {notification.priority !== 'low' && (
          <div
            className={cn(
              'absolute top-0 left-0 w-full h-1 rounded-t-lg',
              priorityColor
            )}
          />
        )}

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className={cn(
            'absolute top-2 right-2 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors',
            colors.text
          )}
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="pr-8">
          <div className="flex items-start space-x-3">
            {/* Icon */}
            <div className={cn('text-lg flex-shrink-0 mt-0.5', colors.icon)}>
              {icon}
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              <div className={cn('font-semibold text-sm', colors.text)}>
                {notification.title}
              </div>
              <div className={cn('text-sm mt-1', colors.text, 'opacity-90')}>
                {notification.message}
              </div>

              {/* Additional data */}
              {formatNotificationData()}

              {/* Timestamp */}
              <div className="text-xs opacity-70 mt-2">
                {notification.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Actions */}
          {notification.data && (notification.type === 'budget-exceeded' || notification.type === 'goal-achieved') && (
            <div className="mt-3 flex space-x-2">
              <button
                onClick={() => {
                  // Navigate to relevant page
                  console.log('Navigate to details');
                  handleDismiss();
                }}
                className={cn(
                  'inline-flex items-center px-3 py-1 text-xs font-medium rounded-md',
                  'bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors',
                  colors.text
                )}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View Details
              </button>
            </div>
          )}
        </div>

        {/* Progress bar for auto-hide */}
        {!notification.persistent && notification.autoHideMs && notification.autoHideMs > 0 && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-black bg-opacity-10 rounded-b-lg overflow-hidden">
            <div
              className="h-full bg-black bg-opacity-20 rounded-b-lg transition-all ease-linear"
              style={{
                animation: `toast-progress ${notification.autoHideMs}ms linear forwards`
              }}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes toast-progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

interface ToastContainerProps {
  notifications: BaseNotification[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxVisible?: number;
}

export function ToastContainer({
  notifications,
  onDismiss,
  position = 'top-right',
  maxVisible = 5
}: ToastContainerProps) {
  // Show only the most recent notifications
  const visibleNotifications = notifications
    .filter(n => !n.dismissed)
    .slice(-maxVisible)
    .reverse();

  const getStackOffset = (index: number) => {
    const isTop = position.includes('top');
    const offset = index * 80; // 80px spacing between notifications
    return isTop ? `${offset}px` : `-${offset}px`;
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className="pointer-events-auto"
          style={{
            transform: `translateY(${getStackOffset(index)})`,
            zIndex: 1000 - index
          }}
        >
          <ToastNotification
            notification={notification}
            onDismiss={onDismiss}
            position={position}
          />
        </div>
      ))}
    </div>
  );
}