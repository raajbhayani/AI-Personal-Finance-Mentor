import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import ProfileSettings from '@/components/settings/ProfileSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import AccountOverview from '@/components/settings/AccountOverview';
import { useAuth } from '@/contexts/AuthContext';
import { ComponentErrorBoundary } from '@/components/ui/ErrorBoundary';
import { User, Shield, Bell, BarChart3, CreditCard, Globe } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'account' | 'billing' | 'preferences';

const settingsTabs = [
  {
    id: 'profile' as SettingsTab,
    name: 'Profile',
    icon: User,
    description: 'Manage your personal information'
  },
  {
    id: 'security' as SettingsTab,
    name: 'Security',
    icon: Shield,
    description: 'Password and security settings'
  },
  {
    id: 'notifications' as SettingsTab,
    name: 'Notifications',
    icon: Bell,
    description: 'Configure your notification preferences'
  },
  {
    id: 'account' as SettingsTab,
    name: 'Account',
    icon: BarChart3,
    description: 'View account statistics and activity'
  },
  {
    id: 'billing' as SettingsTab,
    name: 'Billing',
    icon: CreditCard,
    description: 'Manage your subscription and billing'
  },
  {
    id: 'preferences' as SettingsTab,
    name: 'Preferences',
    icon: Globe,
    description: 'App preferences and customization'
  }
];

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="h-96 bg-gray-200 rounded-lg"></div>
            <div className="lg:col-span-3 h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to access settings</h1>
          <p className="text-gray-600">You need to be authenticated to manage your account settings.</p>
        </div>
      </Layout>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'account':
        return <AccountOverview />;
      case 'billing':
        return (
          <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing & Subscription</h2>
            <p className="text-gray-600">Billing management coming soon...</p>
          </div>
        );
      case 'preferences':
        return (
          <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">App Preferences</h2>
            <p className="text-gray-600">Preference settings coming soon...</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      <ComponentErrorBoundary componentName="Settings">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
          </div>

          {/* Settings Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <nav className="space-y-1">
                {settingsTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'w-full flex items-start p-3 text-left text-sm font-medium rounded-lg transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      )}
                    >
                      <Icon className={cn('h-5 w-5 mr-3 mt-0.5', isActive ? 'text-blue-600' : 'text-gray-400')} />
                      <div>
                        <div className="font-medium">{tab.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{tab.description}</div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </ComponentErrorBoundary>
    </Layout>
  );
}