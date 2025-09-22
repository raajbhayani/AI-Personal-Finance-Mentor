'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DollarSign,
  Home,
  CreditCard,
  Target,
  TrendingUp,
  PieChart,
  Settings,
  HelpCircle,
  LogOut,
  X,
  Wallet,
  Calendar,
  Users,
  MessageCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils/cn';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string;
}

const sidebarItems: SidebarItem[] = [
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

const bottomItems: SidebarItem[] = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help & Support', href: '/help', icon: HelpCircle },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'w-64'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                FinanceMentor
              </span>
            </Link>
            <button
              onClick={onToggle}
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group relative',
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-emerald-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-700'
                  )}
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      onToggle();
                    }
                  }}
                >
                  <Icon className={cn('h-5 w-5 mr-3', isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600')} />
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
            {bottomItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group',
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-emerald-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-700'
                  )}
                >
                  <Icon className={cn('h-5 w-5 mr-3', isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600')} />
                  {item.name}
                </Link>
              );
            })}

            <button className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group">
              <LogOut className="h-5 w-5 mr-3 text-red-500" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}