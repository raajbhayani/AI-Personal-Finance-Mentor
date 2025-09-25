'use client';

import React from 'react';
import {
  DollarSign,
  Target,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Shield,
  TrendingUp
} from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';
import { ComponentErrorBoundary } from '../ui/ErrorBoundary';

export default function NotificationDemo() {
  const {
    showBudgetWarning,
    showBudgetExceeded,
    showGoalCompleted,
    showProgressMilestone,
    showTransactionConfirmed,
    showTransactionFailed,
    showBillReminder,
    showSecurityAlert,
    addNotification
  } = useNotification();

  const demoButtons = [
    {
      category: 'Budget Alerts',
      icon: DollarSign,
      color: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-600',
      buttons: [
        {
          label: 'Budget Warning (80%)',
          action: () => showBudgetWarning('Groceries', 800, 1000),
          description: 'Show warning when budget reaches 80%'
        },
        {
          label: 'Budget Exceeded',
          action: () => showBudgetExceeded('Entertainment', 650, 500),
          description: 'Alert when budget is exceeded'
        }
      ]
    },
    {
      category: 'Goal Updates',
      icon: Target,
      color: 'bg-green-50 border-green-200',
      iconColor: 'text-green-600',
      buttons: [
        {
          label: 'Goal Achieved 🎉',
          action: () => showGoalCompleted('Emergency Fund', 10000, 'goal-1'),
          description: 'Celebrate goal completion'
        },
        {
          label: 'Milestone (75%)',
          action: () => showProgressMilestone('Vacation Fund', 75, 'goal-2'),
          description: 'Show progress milestone'
        }
      ]
    },
    {
      category: 'Transactions',
      icon: CreditCard,
      color: 'bg-purple-50 border-purple-200',
      iconColor: 'text-purple-600',
      buttons: [
        {
          label: 'Transaction Confirmed',
          action: () => showTransactionConfirmed(-89.45, 'Whole Foods Market', 'txn-123'),
          description: 'Confirm successful transaction'
        },
        {
          label: 'Transaction Failed',
          action: () => showTransactionFailed(-156.78, 'Amazon', 'Insufficient funds'),
          description: 'Alert for failed transaction'
        }
      ]
    },
    {
      category: 'Bills & Reminders',
      icon: Calendar,
      color: 'bg-orange-50 border-orange-200',
      iconColor: 'text-orange-600',
      buttons: [
        {
          label: 'Bill Due Soon',
          action: () => {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 3);
            showBillReminder('Electric Bill', 156.78, dueDate.toISOString());
          },
          description: 'Remind about upcoming bill'
        },
        {
          label: 'Overdue Bill',
          action: () => {
            const overdue = new Date();
            overdue.setDate(overdue.getDate() - 2);
            showBillReminder('Credit Card Payment', 2341.56, overdue.toISOString());
          },
          description: 'Alert for overdue payment'
        }
      ]
    },
    {
      category: 'Security Alerts',
      icon: Shield,
      color: 'bg-red-50 border-red-200',
      iconColor: 'text-red-600',
      buttons: [
        {
          label: 'Security Alert',
          action: () => showSecurityAlert(),
          description: 'Show security warning'
        },
        {
          label: 'Custom Security Alert',
          action: () => showSecurityAlert('New login detected from unknown device in San Francisco, CA'),
          description: 'Custom security message'
        }
      ]
    },
    {
      category: 'Custom Notifications',
      icon: TrendingUp,
      color: 'bg-gray-50 border-gray-200',
      iconColor: 'text-gray-600',
      buttons: [
        {
          label: 'Success Message',
          action: () => addNotification({
            type: 'success',
            title: 'Settings Updated',
            message: 'Your notification preferences have been saved successfully.',
            priority: 'low'
          }),
          description: 'Generic success notification'
        },
        {
          label: 'Info Message',
          action: () => addNotification({
            type: 'info',
            title: 'Market Update',
            message: 'Your investment portfolio gained 2.5% this week. Total gain: $156.78',
            priority: 'medium',
            action: {
              label: 'View Portfolio',
              onClick: () => console.log('Navigate to portfolio')
            }
          }),
          description: 'Information with action'
        }
      ]
    }
  ];

  return (
    <ComponentErrorBoundary componentName="NotificationDemo">
      <div className="space-y-8 p-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notification System Demo</h1>
          <p className="text-gray-600">
            Test different types of financial notifications and alerts. Click the buttons below to trigger various notification types.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {demoButtons.map((category) => {
            const Icon = category.icon;
            return (
              <div
                key={category.category}
                className={`p-6 rounded-lg border ${category.color}`}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-2 rounded-lg bg-white ${category.iconColor}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {category.category}
                  </h3>
                </div>

                <div className="space-y-3">
                  {category.buttons.map((button, index) => (
                    <div key={index} className="space-y-2">
                      <button
                        onClick={button.action}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="font-medium text-gray-900">{button.label}</div>
                        <div className="text-sm text-gray-600 mt-1">{button.description}</div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Usage Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Use</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• Click any button above to trigger a notification</p>
            <p>• Check the notification bell icon in the top navigation for unread count</p>
            <p>• Click the bell to open the notification center</p>
            <p>• Notifications with high/urgent priority will play a sound</p>
            <p>• Security alerts are persistent and require manual dismissal</p>
            <p>• Most notifications auto-dismiss after a few seconds</p>
          </div>
        </div>

        {/* Integration Examples */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Integration Examples</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">Budget Monitoring</h4>
              <p className="text-sm text-gray-600 mt-1">
                Automatically trigger budget warnings when spending reaches 80% and budget exceeded alerts when limits are surpassed.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Goal Progress</h4>
              <p className="text-sm text-gray-600 mt-1">
                Celebrate milestones and achievements with visual and audio feedback to keep users motivated.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Transaction Monitoring</h4>
              <p className="text-sm text-gray-600 mt-1">
                Provide immediate feedback for successful transactions and clear alerts for failed payments.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Security Monitoring</h4>
              <p className="text-sm text-gray-600 mt-1">
                High-priority persistent alerts for unusual account activity or security concerns.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ComponentErrorBoundary>
  );
}