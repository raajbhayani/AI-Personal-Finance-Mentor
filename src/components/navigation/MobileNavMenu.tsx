'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  CreditCard,
  Wallet,
  Target,
  TrendingUp,
  PieChart,
  MessageCircle,
  Calendar,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  X,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { cn } from '../../lib/utils/cn';

interface MobileNavMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const mainMenuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Transactions', href: '/transactions', icon: CreditCard },
  { name: 'Budgets', href: '/budgets', icon: Wallet },
  { name: 'Goals', href: '/goals', icon: Target },
  { name: 'Investments', href: '/investments', icon: TrendingUp },
  { name: 'Analytics', href: '/analytics', icon: PieChart },
  { name: 'AI Chat', href: '/chat', icon: MessageCircle },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Family', href: '/family', icon: Users, badge: 'New' },
];

const bottomMenuItems = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help & Support', href: '/help', icon: HelpCircle },
];

export default function MobileNavMenu({ isOpen, onClose }: MobileNavMenuProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { addNotification } = useNotification();

  const handleLogout = async () => {
    try {
      await logout();
      addNotification({
        type: 'success',
        title: 'Logged Out',
        message: 'You have been successfully logged out.',
        duration: 3000
      });
      onClose();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Logout Error',
        message: 'Failed to log out. Please try again.',
        duration: 5000
      });
    }
  };

  const isRouteActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Mobile Navigation Menu */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-emerald-600">
            <Link
              href="/dashboard"
              className="flex items-center space-x-3"
              onClick={onClose}
            >
              <div className="p-2 bg-white/20 rounded-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                FinanceMentor
              </span>
            </Link>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-emerald-50 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-semibold">
                  {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User'}
                </p>
                <p className="text-xs text-gray-600">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {mainMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = isRouteActive(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group',
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-emerald-50 text-blue-700 border-l-4 border-blue-600 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-700'
                  )}
                  onClick={onClose}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 mr-4',
                      isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'
                    )}
                  />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="border-t border-gray-200 p-4 space-y-2">
            {bottomMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = isRouteActive(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group',
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-emerald-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-700'
                  )}
                  onClick={onClose}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 mr-4',
                      isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}

            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
            >
              <LogOut className="h-5 w-5 mr-4 text-red-500" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}