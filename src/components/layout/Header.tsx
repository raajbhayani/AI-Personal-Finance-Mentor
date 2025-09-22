'use client';

import React from 'react';
import { Bell, Search, Menu, ChevronDown, Plus } from 'lucide-react';
import Button from '../ui/Button';

interface HeaderProps {
  onMenuToggle: () => void;
  userName?: string;
  userAvatar?: string;
}

export default function Header({ onMenuToggle, userName = 'John Doe', userAvatar }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="hidden lg:block">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome back, {userName.split(' ')[0]}!</p>
          </div>
        </div>

        {/* Center section - Search */}
        <div className="hidden md:flex flex-1 max-w-lg mx-8">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search transactions, goals, or anything..."
              className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          {/* Quick action button */}
          <Button size="sm" className="hidden md:flex">
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>

          {/* Search button for mobile */}
          <button className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 md:hidden">
            <Search className="h-5 w-5" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400"></span>
            </button>
          </div>

          {/* User menu */}
          <div className="relative">
            <button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-center space-x-2">
                {userAvatar ? (
                  <img
                    className="h-8 w-8 rounded-full object-cover"
                    src={userAvatar}
                    alt={userName}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-emerald-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {userName.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-500">Premium Member</p>
                </div>
              </div>
              <ChevronDown className="hidden md:block h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile header title */}
      <div className="block lg:hidden mt-4">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600">Welcome back, {userName.split(' ')[0]}!</p>
      </div>
    </header>
  );
}