'use client';

import React, { useState } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  DollarSign,
  Target,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Save,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useFormSubmission } from '@/hooks/useApiState';
import { ButtonLoading } from '../ui/Loading';
import ErrorDisplay from '../ui/ErrorDisplay';
import { cn } from '@/lib/utils/cn';

interface NotificationPreferences {
  email: {
    enabled: boolean;
    frequency: 'instant' | 'daily' | 'weekly';
    budgetAlerts: boolean;
    goalReminders: boolean;
    transactionAlerts: boolean;
    securityAlerts: boolean;
    weeklyReports: boolean;
    monthlyReports: boolean;
    marketingEmails: boolean;
  };
  push: {
    enabled: boolean;
    budgetAlerts: boolean;
    goalReminders: boolean;
    transactionAlerts: boolean;
    securityAlerts: boolean;
    billReminders: boolean;
    newsUpdates: boolean;
  };
  sms: {
    enabled: boolean;
    securityAlerts: boolean;
    budgetAlerts: boolean;
    billReminders: boolean;
  };
  inApp: {
    enabled: boolean;
    sounds: boolean;
    budgetAlerts: boolean;
    goalReminders: boolean;
    transactionAlerts: boolean;
    newsUpdates: boolean;
  };
}

interface NotificationCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  preferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
    inApp: boolean;
  };
}

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      enabled: true,
      frequency: 'daily',
      budgetAlerts: true,
      goalReminders: true,
      transactionAlerts: false,
      securityAlerts: true,
      weeklyReports: true,
      monthlyReports: true,
      marketingEmails: false,
    },
    push: {
      enabled: true,
      budgetAlerts: true,
      goalReminders: true,
      transactionAlerts: false,
      securityAlerts: true,
      billReminders: true,
      newsUpdates: false,
    },
    sms: {
      enabled: false,
      securityAlerts: true,
      budgetAlerts: false,
      billReminders: false,
    },
    inApp: {
      enabled: true,
      sounds: true,
      budgetAlerts: true,
      goalReminders: true,
      transactionAlerts: true,
      newsUpdates: false,
    },
  });

  const [hasChanges, setHasChanges] = useState(false);

  const { submit, isSubmitting, error: submitError } = useFormSubmission();

  const notificationCategories: NotificationCategory[] = [
    {
      id: 'budget-alerts',
      title: 'Budget Alerts',
      description: 'Get notified when you exceed budget limits or reach spending thresholds',
      icon: DollarSign,
      preferences: {
        email: preferences.email.budgetAlerts,
        push: preferences.push.budgetAlerts,
        sms: preferences.sms.budgetAlerts,
        inApp: preferences.inApp.budgetAlerts,
      },
    },
    {
      id: 'goal-reminders',
      title: 'Goal Reminders',
      description: 'Reminders about your financial goals and progress updates',
      icon: Target,
      preferences: {
        email: preferences.email.goalReminders,
        push: preferences.push.goalReminders,
        sms: false,
        inApp: preferences.inApp.goalReminders,
      },
    },
    {
      id: 'security-alerts',
      title: 'Security Alerts',
      description: 'Important security notifications and login alerts',
      icon: AlertTriangle,
      preferences: {
        email: preferences.email.securityAlerts,
        push: preferences.push.securityAlerts,
        sms: preferences.sms.securityAlerts,
        inApp: true,
      },
    },
    {
      id: 'transaction-alerts',
      title: 'Transaction Alerts',
      description: 'Notifications for new transactions and account activity',
      icon: TrendingUp,
      preferences: {
        email: preferences.email.transactionAlerts,
        push: preferences.push.transactionAlerts,
        sms: false,
        inApp: preferences.inApp.transactionAlerts,
      },
    },
    {
      id: 'bill-reminders',
      title: 'Bill Reminders',
      description: 'Reminders for upcoming bills and payment due dates',
      icon: Calendar,
      preferences: {
        email: false,
        push: preferences.push.billReminders,
        sms: preferences.sms.billReminders,
        inApp: false,
      },
    },
  ];

  const updatePreference = (
    category: keyof NotificationPreferences,
    key: string,
    value: boolean | string
  ) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const updateCategoryPreference = (
    categoryId: string,
    channel: 'email' | 'push' | 'sms' | 'inApp',
    enabled: boolean
  ) => {
    const updates: Partial<NotificationPreferences> = {};

    switch (categoryId) {
      case 'budget-alerts':
        if (channel === 'email') updates.email = { ...preferences.email, budgetAlerts: enabled };
        if (channel === 'push') updates.push = { ...preferences.push, budgetAlerts: enabled };
        if (channel === 'sms') updates.sms = { ...preferences.sms, budgetAlerts: enabled };
        if (channel === 'inApp') updates.inApp = { ...preferences.inApp, budgetAlerts: enabled };
        break;
      case 'goal-reminders':
        if (channel === 'email') updates.email = { ...preferences.email, goalReminders: enabled };
        if (channel === 'push') updates.push = { ...preferences.push, goalReminders: enabled };
        if (channel === 'inApp') updates.inApp = { ...preferences.inApp, goalReminders: enabled };
        break;
      case 'security-alerts':
        if (channel === 'email') updates.email = { ...preferences.email, securityAlerts: enabled };
        if (channel === 'push') updates.push = { ...preferences.push, securityAlerts: enabled };
        if (channel === 'sms') updates.sms = { ...preferences.sms, securityAlerts: enabled };
        break;
      case 'transaction-alerts':
        if (channel === 'email') updates.email = { ...preferences.email, transactionAlerts: enabled };
        if (channel === 'push') updates.push = { ...preferences.push, transactionAlerts: enabled };
        if (channel === 'inApp') updates.inApp = { ...preferences.inApp, transactionAlerts: enabled };
        break;
      case 'bill-reminders':
        if (channel === 'push') updates.push = { ...preferences.push, billReminders: enabled };
        if (channel === 'sms') updates.sms = { ...preferences.sms, billReminders: enabled };
        break;
    }

    setPreferences(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await submit(preferences, async (data) => {
      // Mock API call
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true, message: 'Notification preferences updated' });
        }, 1000);
      });
    }, {
      successMessage: 'Notification preferences updated successfully!',
      errorMessage: 'Failed to update notification preferences. Please try again.',
    });

    if (result) {
      setHasChanges(false);
    }
  };

  const ToggleSwitch = ({
    enabled,
    onChange,
    disabled = false
  }: {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        enabled ? 'bg-blue-600' : 'bg-gray-200',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
          enabled ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Channels</h2>

        <div className="space-y-6">
          {/* Email Notifications */}
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <Mail className="w-6 h-6 text-gray-400 mt-1" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">Email Notifications</h3>
                <p className="text-sm text-gray-600">Receive notifications via email</p>
                {preferences.email.enabled && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Frequency
                    </label>
                    <select
                      value={preferences.email.frequency}
                      onChange={(e) => updatePreference('email', 'frequency', e.target.value)}
                      className="text-sm border border-gray-300 rounded-md px-2 py-1"
                    >
                      <option value="instant">Instant</option>
                      <option value="daily">Daily Digest</option>
                      <option value="weekly">Weekly Summary</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
            <ToggleSwitch
              enabled={preferences.email.enabled}
              onChange={(enabled) => updatePreference('email', 'enabled', enabled)}
            />
          </div>

          {/* Push Notifications */}
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <Bell className="w-6 h-6 text-gray-400 mt-1" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">Push Notifications</h3>
                <p className="text-sm text-gray-600">Receive push notifications on your devices</p>
              </div>
            </div>
            <ToggleSwitch
              enabled={preferences.push.enabled}
              onChange={(enabled) => updatePreference('push', 'enabled', enabled)}
            />
          </div>

          {/* SMS Notifications */}
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <Smartphone className="w-6 h-6 text-gray-400 mt-1" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">SMS Notifications</h3>
                <p className="text-sm text-gray-600">Receive important alerts via SMS</p>
              </div>
            </div>
            <ToggleSwitch
              enabled={preferences.sms.enabled}
              onChange={(enabled) => updatePreference('sms', 'enabled', enabled)}
            />
          </div>

          {/* In-App Notifications */}
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <Volume2 className="w-6 h-6 text-gray-400 mt-1" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">In-App Notifications</h3>
                <p className="text-sm text-gray-600">Show notifications within the application</p>
                {preferences.inApp.enabled && (
                  <div className="mt-2 flex items-center space-x-2">
                    <ToggleSwitch
                      enabled={preferences.inApp.sounds}
                      onChange={(enabled) => updatePreference('inApp', 'sounds', enabled)}
                    />
                    <span className="text-sm text-gray-600">Play notification sounds</span>
                  </div>
                )}
              </div>
            </div>
            <ToggleSwitch
              enabled={preferences.inApp.enabled}
              onChange={(enabled) => updatePreference('inApp', 'enabled', enabled)}
            />
          </div>
        </div>
      </div>

      {/* Notification Categories */}
      <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Types</h2>

        <div className="space-y-6">
          {notificationCategories.map((category) => {
            const Icon = category.icon;
            const isSecurityCategory = category.id === 'security-alerts';

            return (
              <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3 mb-4">
                  <Icon className="w-6 h-6 text-gray-400 mt-1" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{category.title}</h3>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Email */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Email</span>
                    <ToggleSwitch
                      enabled={category.preferences.email}
                      onChange={(enabled) => updateCategoryPreference(category.id, 'email', enabled)}
                      disabled={!preferences.email.enabled}
                    />
                  </div>

                  {/* Push */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Push</span>
                    <ToggleSwitch
                      enabled={category.preferences.push}
                      onChange={(enabled) => updateCategoryPreference(category.id, 'push', enabled)}
                      disabled={!preferences.push.enabled}
                    />
                  </div>

                  {/* SMS */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">SMS</span>
                    <ToggleSwitch
                      enabled={category.preferences.sms}
                      onChange={(enabled) => updateCategoryPreference(category.id, 'sms', enabled)}
                      disabled={!preferences.sms.enabled || (!isSecurityCategory && category.id !== 'budget-alerts' && category.id !== 'bill-reminders')}
                    />
                  </div>

                  {/* In-App */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">In-App</span>
                    <ToggleSwitch
                      enabled={category.preferences.inApp}
                      onChange={(enabled) => updateCategoryPreference(category.id, 'inApp', enabled)}
                      disabled={!preferences.inApp.enabled || (isSecurityCategory)}
                    />
                  </div>
                </div>

                {isSecurityCategory && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-yellow-800">
                        Security alerts are always enabled for in-app notifications
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Additional Email Preferences */}
      {preferences.email.enabled && (
        <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Email Preferences</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Weekly Reports</h4>
                <p className="text-sm text-gray-600">Get a weekly summary of your financial activity</p>
              </div>
              <ToggleSwitch
                enabled={preferences.email.weeklyReports}
                onChange={(enabled) => updatePreference('email', 'weeklyReports', enabled)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Monthly Reports</h4>
                <p className="text-sm text-gray-600">Receive detailed monthly financial reports</p>
              </div>
              <ToggleSwitch
                enabled={preferences.email.monthlyReports}
                onChange={(enabled) => updatePreference('email', 'monthlyReports', enabled)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Marketing Emails</h4>
                <p className="text-sm text-gray-600">Receive tips, news, and product updates</p>
              </div>
              <ToggleSwitch
                enabled={preferences.email.marketingEmails}
                onChange={(enabled) => updatePreference('email', 'marketingEmails', enabled)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {submitError && (
        <ErrorDisplay
          type="validation"
          variant="card"
          error={submitError}
          onRetry={() => handleSubmit(new Event('submit') as any)}
        />
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !hasChanges}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <ButtonLoading text="Saving..." />
          ) : (
            <>
              <Save className="w-4 h-4 mr-2 inline" />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
}