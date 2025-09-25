'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  CreditCard,
  Target,
  PieChart,
  MessageCircle,
  DollarSign,
  Wallet,
  TrendingUp,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface MobileNavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string;
}

const primaryNavItems: MobileNavItem[] = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Transactions', href: '/transactions', icon: CreditCard },
  { name: 'Budgets', href: '/budgets', icon: Wallet },
  { name: 'Goals', href: '/goals', icon: Target },
  { name: 'More', href: '/menu', icon: Menu },
];

interface MobileBottomNavProps {
  onMenuPress?: () => void;
}

export default function MobileBottomNav({ onMenuPress }: MobileBottomNavProps) {
  const pathname = usePathname();

  const isRouteActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    if (href === '/menu') {
      return false; // Menu is not a real route
    }
    return pathname.startsWith(href);
  };

  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
    }
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center py-2 px-4">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = isRouteActive(item.href);
          const isMenu = item.href === '/menu';

          if (isMenu) {
            return (
              <button
                key={item.name}
                onClick={handleMenuPress}
                className={cn(
                  'flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 min-w-[60px] touch-manipulation',
                  'active:scale-95 active:bg-gray-100'
                )}
              >
                <div className={cn(
                  'p-2 rounded-full transition-all duration-200',
                  'bg-gray-100 text-gray-600'
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs mt-1 text-gray-600 font-medium">
                  {item.name}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 min-w-[60px] touch-manipulation relative',
                'active:scale-95',
                isActive ? 'text-blue-600' : 'text-gray-600 active:bg-gray-100'
              )}
            >
              <div className={cn(
                'p-2 rounded-full transition-all duration-200',
                isActive
                  ? 'bg-blue-100 text-blue-600 shadow-sm'
                  : 'bg-transparent'
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={cn(
                'text-xs mt-1 font-medium transition-colors',
                isActive ? 'text-blue-600' : 'text-gray-600'
              )}>
                {item.name}
              </span>
              {isActive && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
              )}
              {item.badge && (
                <div className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                  {item.badge}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// Enhanced Mobile Navigation Menu Overlay
interface MobileMenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const additionalNavItems: MobileNavItem[] = [
  { name: 'Analytics', href: '/analytics', icon: PieChart },
  { name: 'Investments', href: '/investments', icon: TrendingUp },
  { name: 'AI Chat', href: '/chat', icon: MessageCircle },
  { name: 'Reports', href: '/reports', icon: PieChart },
];

export function MobileMenuOverlay({ isOpen, onClose }: MobileMenuOverlayProps) {
  const pathname = usePathname();

  const isRouteActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  if (!isOpen) return null;

  return (
    <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[70vh] overflow-y-auto">
        {/* Handle bar */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors touch-manipulation"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="px-6 py-4 space-y-2">
          {additionalNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = isRouteActive(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center px-4 py-3 rounded-xl transition-all duration-200 touch-manipulation',
                  'active:scale-[0.98] active:bg-gray-100',
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <div className={cn(
                  'p-2 rounded-lg mr-3',
                  isActive ? 'bg-blue-100' : 'bg-gray-100'
                )}>
                  <Icon className={cn(
                    'h-5 w-5',
                    isActive ? 'text-blue-600' : 'text-gray-600'
                  )} />
                </div>
                <span className="font-medium">{item.name}</span>
                {item.badge && (
                  <span className="ml-auto px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="px-6 py-4 border-t border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/transactions/add"
              onClick={onClose}
              className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-xl font-medium transition-all duration-200 touch-manipulation active:scale-[0.98]"
            >
              <DollarSign className="h-5 w-5 mr-2" />
              Add Transaction
            </Link>
            <Link
              href="/goals/create"
              onClick={onClose}
              className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-xl font-medium transition-all duration-200 touch-manipulation active:scale-[0.98]"
            >
              <Target className="h-5 w-5 mr-2" />
              New Goal
            </Link>
          </div>
        </div>

        {/* Safe area padding for devices with home indicator */}
        <div className="h-safe-area-inset-bottom" />
      </div>
    </div>
  );
}