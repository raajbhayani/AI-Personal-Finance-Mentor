import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, Trophy, Target, Star, DollarSign, Calendar, Shield } from 'lucide-react';

export type NotificationType =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'achievement'
  | 'budget-warning'
  | 'budget-exceeded'
  | 'goal-achieved'
  | 'goal-milestone'
  | 'transaction-confirmed'
  | 'transaction-failed'
  | 'bill-reminder'
  | 'security-alert';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  persistent?: boolean;
  read?: boolean;
  timestamp?: Date;
  action?: {
    label: string;
    onClick: () => void;
  };
  metadata?: {
    goalId?: string;
    amount?: number;
    progress?: number;
    budgetName?: string;
    merchant?: string;
    categoryName?: string;
    dueDate?: string;
    transactionId?: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;

  // Achievement-specific methods
  showGoalCompleted: (goalTitle: string, amount: number, goalId: string) => void;
  showProgressMilestone: (goalTitle: string, progress: number, goalId: string) => void;
  showGoalCreated: (goalTitle: string, goalId: string) => void;
  showProgressAdded: (goalTitle: string, amount: number, goalId: string) => void;

  // Financial alert methods
  showBudgetWarning: (budgetName: string, spent: number, threshold: number) => void;
  showBudgetExceeded: (budgetName: string, spent: number, budget: number) => void;
  showTransactionConfirmed: (amount: number, merchant: string, transactionId?: string) => void;
  showTransactionFailed: (amount: number, merchant: string, reason?: string) => void;
  showBillReminder: (categoryName: string, amount: number, dueDate: string) => void;
  showSecurityAlert: (message?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>): string => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || (notification.persistent ? 0 : 5000),
      priority: notification.priority || 'medium',
      read: false,
      timestamp: new Date(),
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove notification after duration (unless persistent)
    if (newNotification.duration && newNotification.duration > 0 && !newNotification.persistent) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    // Play sound for high priority notifications
    if (newNotification.priority === 'high' || newNotification.priority === 'urgent') {
      playNotificationSound();
    }

    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Achievement-specific notification methods
  const showGoalCompleted = (goalTitle: string, amount: number, goalId: string) => {
    addNotification({
      type: 'achievement',
      title: '🎉 Goal Completed!',
      message: `Congratulations! You've successfully reached your "${goalTitle}" goal of $${amount.toLocaleString()}!`,
      duration: 8000,
      action: {
        label: 'View Goal',
        onClick: () => {
          // Navigate to specific goal or open goal details
          console.log('Navigate to goal:', goalId);
        }
      },
      metadata: {
        goalId,
        amount,
        progress: 100
      }
    });
  };

  const showProgressMilestone = (goalTitle: string, progress: number, goalId: string) => {
    const milestones = [25, 50, 75, 90];
    const milestone = milestones.find(m => Math.abs(progress - m) < 1);

    if (milestone) {
      addNotification({
        type: 'achievement',
        title: `🎯 Milestone Reached!`,
        message: `You're ${milestone}% towards your "${goalTitle}" goal! Keep up the great work!`,
        duration: 6000,
        action: {
          label: 'View Progress',
          onClick: () => {
            console.log('Navigate to goal:', goalId);
          }
        },
        metadata: {
          goalId,
          progress: milestone
        }
      });
    }
  };

  const showGoalCreated = (goalTitle: string, goalId: string) => {
    addNotification({
      type: 'success',
      title: 'Goal Created Successfully!',
      message: `Your new goal "${goalTitle}" has been created and is ready to track.`,
      duration: 4000,
      metadata: { goalId }
    });
  };

  const showProgressAdded = (goalTitle: string, amount: number, goalId: string) => {
    addNotification({
      type: 'success',
      title: 'Progress Updated!',
      message: `Added $${amount.toLocaleString()} to your "${goalTitle}" goal. You're getting closer!`,
      duration: 4000,
      metadata: { goalId, amount }
    });
  };

  // Financial alert notification methods
  const showBudgetWarning = (budgetName: string, spent: number, threshold: number) => {
    const percentage = Math.round((spent / threshold) * 100);
    addNotification({
      type: 'budget-warning',
      title: `Budget Alert: ${budgetName}`,
      message: `You've spent ${formatCurrency(spent)} (${percentage}%) of your ${formatCurrency(threshold)} ${budgetName} budget.`,
      priority: 'medium',
      duration: 6000,
      action: {
        label: 'View Budget',
        onClick: () => console.log('Navigate to budget:', budgetName)
      },
      metadata: { budgetName, amount: spent }
    });
  };

  const showBudgetExceeded = (budgetName: string, spent: number, budget: number) => {
    const overage = spent - budget;
    addNotification({
      type: 'budget-exceeded',
      title: `Budget Exceeded: ${budgetName}`,
      message: `You've exceeded your ${formatCurrency(budget)} ${budgetName} budget by ${formatCurrency(overage)}.`,
      priority: 'high',
      duration: 8000,
      action: {
        label: 'Review Spending',
        onClick: () => console.log('Navigate to budget details:', budgetName)
      },
      metadata: { budgetName, amount: spent }
    });
  };

  const showTransactionConfirmed = (amount: number, merchant: string, transactionId?: string) => {
    addNotification({
      type: 'transaction-confirmed',
      title: 'Transaction Confirmed',
      message: `${formatCurrency(Math.abs(amount))} transaction at ${merchant} has been processed successfully.`,
      priority: 'low',
      duration: 4000,
      metadata: { amount, merchant, transactionId }
    });
  };

  const showTransactionFailed = (amount: number, merchant: string, reason?: string) => {
    addNotification({
      type: 'transaction-failed',
      title: 'Transaction Failed',
      message: `${formatCurrency(Math.abs(amount))} transaction at ${merchant} was declined${reason ? `: ${reason}` : ''}.`,
      priority: 'high',
      duration: 6000,
      action: {
        label: 'Retry Payment',
        onClick: () => console.log('Retry transaction:', { amount, merchant })
      },
      metadata: { amount, merchant }
    });
  };

  const showBillReminder = (categoryName: string, amount: number, dueDate: string) => {
    const dueDateObj = new Date(dueDate);
    const formattedDate = dueDateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    addNotification({
      type: 'bill-reminder',
      title: 'Bill Due Soon',
      message: `Your ${categoryName} bill of ${formatCurrency(amount)} is due on ${formattedDate}.`,
      priority: 'medium',
      duration: 6000,
      action: {
        label: 'Pay Now',
        onClick: () => console.log('Navigate to bill payment:', { categoryName, amount })
      },
      metadata: { categoryName, amount, dueDate }
    });
  };

  const showSecurityAlert = (message?: string) => {
    addNotification({
      type: 'security-alert',
      title: 'Security Alert',
      message: message || 'Unusual account activity detected. Please review your recent transactions and account settings.',
      priority: 'urgent',
      persistent: true,
      action: {
        label: 'Review Account',
        onClick: () => console.log('Navigate to security settings')
      }
    });
  };

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    showGoalCompleted,
    showProgressMilestone,
    showGoalCreated,
    showProgressAdded,
    showBudgetWarning,
    showBudgetExceeded,
    showTransactionConfirmed,
    showTransactionFailed,
    showBillReminder,
    showSecurityAlert,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

// Notification Toast Component
export function NotificationToast({ notification, onRemove }: {
  notification: Notification;
  onRemove: (id: string) => void;
}) {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-400" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-400" />;
      case 'achievement':
      case 'goal-achieved':
        return <Trophy className="h-5 w-5 text-yellow-400" />;
      case 'goal-milestone':
        return <Target className="h-5 w-5 text-blue-400" />;
      case 'budget-warning':
        return <AlertCircle className="h-5 w-5 text-yellow-400" />;
      case 'budget-exceeded':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'transaction-confirmed':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'transaction-failed':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'bill-reminder':
        return <Calendar className="h-5 w-5 text-blue-400" />;
      case 'security-alert':
        return <Shield className="h-5 w-5 text-red-400" />;
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'success':
      case 'transaction-confirmed':
        return 'bg-green-50 border-green-200';
      case 'error':
      case 'transaction-failed':
      case 'budget-exceeded':
      case 'security-alert':
        return 'bg-red-50 border-red-200';
      case 'warning':
      case 'budget-warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
      case 'bill-reminder':
      case 'goal-milestone':
        return 'bg-blue-50 border-blue-200';
      case 'achievement':
      case 'goal-achieved':
        return 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  return (
    <div
      className={`
        max-w-sm w-full shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 ease-in-out
        ${getBgColor()}
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-gray-900">
              {notification.title}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {notification.message}
            </p>
            {notification.action && (
              <div className="mt-3">
                <button
                  onClick={notification.action.onClick}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  {notification.action.label}
                </button>
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-transparent rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={() => onRemove(notification.id)}
            >
              <span className="sr-only">Close</span>
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Notification Container Component
export function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed top-0 right-0 z-50 p-6 space-y-4 pointer-events-none">
      {notifications.map((notification) => (
        <div key={notification.id} className="animate-slide-in-from-top">
          <NotificationToast
            notification={notification}
            onRemove={removeNotification}
          />
        </div>
      ))}
    </div>
  );
}