import {
  NotificationType,
  NotificationPriority,
  BaseNotification,
  ToastNotification,
  FinancialNotificationData
} from '@/types/notifications';

export const getNotificationIcon = (type: NotificationType): string => {
  switch (type) {
    case 'budget-warning':
    case 'budget-exceeded':
      return '⚠️';
    case 'goal-achieved':
      return '🎉';
    case 'goal-milestone':
      return '🎯';
    case 'transaction-confirmed':
      return '✅';
    case 'transaction-failed':
      return '❌';
    case 'bill-reminder':
      return '📋';
    case 'security-alert':
      return '🔒';
    case 'success':
      return '✅';
    case 'warning':
      return '⚠️';
    case 'error':
      return '❌';
    case 'info':
      return 'ℹ️';
    case 'system':
    default:
      return '🔔';
  }
};

export const getNotificationColor = (type: NotificationType): {
  bg: string;
  border: string;
  text: string;
  icon: string;
} => {
  switch (type) {
    case 'budget-warning':
    case 'warning':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-800',
        icon: 'text-yellow-600'
      };
    case 'budget-exceeded':
    case 'transaction-failed':
    case 'security-alert':
    case 'error':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        icon: 'text-red-600'
      };
    case 'goal-achieved':
    case 'transaction-confirmed':
    case 'success':
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        icon: 'text-green-600'
      };
    case 'goal-milestone':
    case 'bill-reminder':
    case 'info':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        icon: 'text-blue-600'
      };
    case 'system':
    default:
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-800',
        icon: 'text-gray-600'
      };
  }
};

export const getPriorityColor = (priority: NotificationPriority): string => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-500';
    case 'high':
      return 'bg-orange-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'low':
    default:
      return 'bg-gray-400';
  }
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const formatPercentage = (percentage: number): string => {
  return `${Math.round(percentage)}%`;
};

export const createNotificationId = (): string => {
  return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const getNotificationDuration = (
  type: NotificationType,
  priority: NotificationPriority
): number => {
  // Duration in milliseconds
  if (priority === 'urgent' || type === 'security-alert') {
    return 0; // Persistent until dismissed
  }

  switch (priority) {
    case 'high':
      return 8000;
    case 'medium':
      return 6000;
    case 'low':
    default:
      return 4000;
  }
};

export const shouldPlaySound = (
  type: NotificationType,
  priority: NotificationPriority
): boolean => {
  return priority === 'urgent' || priority === 'high' ||
         type === 'security-alert' || type === 'goal-achieved';
};

export const createFinancialNotification = (
  type: NotificationType,
  data: FinancialNotificationData,
  priority: NotificationPriority = 'medium'
): Omit<BaseNotification, 'id' | 'timestamp' | 'read' | 'dismissed'> => {
  let title = '';
  let message = '';

  switch (type) {
    case 'budget-warning':
      title = `Budget Alert: ${data.budgetName}`;
      message = `You've spent ${formatPercentage(data.percentage || 0)} of your ${data.budgetName} budget (${formatCurrency(data.amount || 0)})`;
      break;

    case 'budget-exceeded':
      title = `Budget Exceeded: ${data.budgetName}`;
      message = `You've exceeded your ${data.budgetName} budget by ${formatCurrency((data.amount || 0) - (data.threshold || 0))}`;
      break;

    case 'goal-achieved':
      title = `🎉 Goal Achieved!`;
      message = `Congratulations! You've reached your "${data.goalName}" goal of ${formatCurrency(data.targetValue || 0)}`;
      break;

    case 'goal-milestone':
      title = `Goal Progress: ${data.goalName}`;
      message = `You're ${formatPercentage(data.percentage || 0)} of the way to your ${data.goalName} goal!`;
      break;

    case 'transaction-confirmed':
      title = 'Transaction Confirmed';
      message = `${formatCurrency(data.amount || 0)} transaction at ${data.merchant} has been processed`;
      break;

    case 'transaction-failed':
      title = 'Transaction Failed';
      message = `${formatCurrency(data.amount || 0)} transaction at ${data.merchant} was declined`;
      break;

    case 'bill-reminder':
      title = 'Bill Due Soon';
      message = `Your ${data.categoryName} bill of ${formatCurrency(data.amount || 0)} is due on ${data.dueDate}`;
      break;

    case 'security-alert':
      title = 'Security Alert';
      message = 'Unusual account activity detected. Please review your recent transactions.';
      break;

    default:
      title = 'Notification';
      message = 'You have a new notification';
  }

  return {
    type,
    title,
    message,
    priority,
    data,
    persistent: priority === 'urgent' || type === 'security-alert',
    autoHideMs: getNotificationDuration(type, priority)
  };
};

export const playNotificationSound = async (): Promise<void> => {
  try {
    // Create a simple notification sound using Web Audio API
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