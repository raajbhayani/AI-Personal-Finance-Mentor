export type NotificationType =
  | 'budget-warning'
  | 'budget-exceeded'
  | 'goal-achieved'
  | 'goal-milestone'
  | 'transaction-confirmed'
  | 'transaction-failed'
  | 'bill-reminder'
  | 'security-alert'
  | 'system'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface FinancialNotificationData {
  amount?: number;
  budgetName?: string;
  goalName?: string;
  categoryName?: string;
  transactionId?: string;
  percentage?: number;
  threshold?: number;
  currentValue?: number;
  targetValue?: number;
  merchant?: string;
  dueDate?: string;
}

export interface BaseNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  timestamp: Date;
  read: boolean;
  dismissed: boolean;
  persistent?: boolean;
  autoHideMs?: number;
  data?: FinancialNotificationData;
}

export interface ToastNotification extends BaseNotification {
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface ActionableNotification extends BaseNotification {
  actions?: NotificationAction[];
}

export interface NotificationPreferences {
  enabled: boolean;
  budgetWarnings: boolean;
  goalUpdates: boolean;
  transactionAlerts: boolean;
  billReminders: boolean;
  securityAlerts: boolean;
  soundEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}