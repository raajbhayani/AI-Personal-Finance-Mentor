'use client';

import React, { useState } from 'react';
import Sidebar from '../layout/Sidebar';
import Header from '../layout/Header';
import MobileBottomNav, { MobileMenuOverlay } from '../navigation/MobileBottomNav';
import BalanceOverview from './BalanceOverview';
import RecentTransactions from './RecentTransactions';
import ExpenseChart from './ExpenseChart';
import IncomeExpenseChart from './IncomeExpenseChart';
import FinancialGoals from './FinancialGoals';
import DashboardSkeleton from './DashboardSkeleton';
import Alert from '../ui/Alert';

interface DashboardProps {
  userName?: string;
  userAvatar?: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export default function Dashboard({
  userName = 'John Doe',
  userAvatar,
  isLoading = false,
  error = null,
  onRetry
}: DashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleAddTransaction = () => {
    console.log('Add transaction clicked');
    // Handle add transaction logic
  };

  const handleViewAllTransactions = () => {
    console.log('View all transactions clicked');
    // Handle view all transactions logic
  };

  const handleAddGoal = () => {
    console.log('Add goal clicked');
    // Handle add goal logic
  };

  const handleViewAllGoals = () => {
    console.log('View all goals clicked');
    // Handle view all goals logic
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <Header
          onMenuToggle={handleSidebarToggle}
          userName={userName}
          userAvatar={userAvatar}
        />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 sm:p-6 pb-20 lg:pb-6">
          {/* Error State */}
          {error && (
            <div className="max-w-7xl mx-auto mb-6">
              <Alert
                variant="error"
                title="Failed to load dashboard data"
                dismissible
                onDismiss={onRetry}
              >
                {error}
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="mt-2 text-sm font-medium text-red-800 hover:text-red-700 underline"
                  >
                    Try again
                  </button>
                )}
              </Alert>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <DashboardSkeleton />
          ) : (
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Balance Overview Cards */}
              <section>
                <BalanceOverview />
              </section>

            {/* Charts and Transactions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Transactions - Takes 2 columns on large screens */}
              <div className="lg:col-span-2">
                <RecentTransactions
                  onAddTransaction={handleAddTransaction}
                  onViewAll={handleViewAllTransactions}
                />
              </div>

              {/* Financial Goals - Takes 1 column */}
              <div className="lg:col-span-1">
                <FinancialGoals
                  onAddGoal={handleAddGoal}
                  onViewAll={handleViewAllGoals}
                />
              </div>
            </div>

            {/* Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Income vs Expenses Chart - Takes 2 columns */}
              <div className="lg:col-span-2">
                <IncomeExpenseChart />
              </div>

              {/* Expense Categories Chart - Takes 1 column */}
              <div className="lg:col-span-1">
                <ExpenseChart />
              </div>
            </div>

            {/* Quick Actions Bar - Hidden on mobile (bottom nav replaces it) */}
            <section className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={handleAddTransaction}
                  className="flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors duration-200"
                >
                  <span className="text-2xl mr-3">💳</span>
                  <div className="text-left">
                    <div className="font-medium">Add Transaction</div>
                    <div className="text-sm text-blue-600">Record income or expense</div>
                  </div>
                </button>

                <button
                  onClick={handleAddGoal}
                  className="flex items-center justify-center p-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors duration-200"
                >
                  <span className="text-2xl mr-3">🎯</span>
                  <div className="text-left">
                    <div className="font-medium">Set Goal</div>
                    <div className="text-sm text-emerald-600">Create savings target</div>
                  </div>
                </button>

                <button className="flex items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors duration-200">
                  <span className="text-2xl mr-3">📊</span>
                  <div className="text-left">
                    <div className="font-medium">View Reports</div>
                    <div className="text-sm text-purple-600">Analyze spending patterns</div>
                  </div>
                </button>

                <button className="flex items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg transition-colors duration-200">
                  <span className="text-2xl mr-3">🤖</span>
                  <div className="text-left">
                    <div className="font-medium">AI Advisor</div>
                    <div className="text-sm text-orange-600">Get financial insights</div>
                  </div>
                </button>
              </div>
            </section>

              {/* Footer */}
              <footer className="text-center py-6">
                <p className="text-sm text-gray-500">
                  © 2024 FinanceMentor. Your financial success, powered by AI.
                </p>
              </footer>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav onMenuPress={() => setMobileMenuOpen(true)} />

      {/* Mobile Menu Overlay */}
      <MobileMenuOverlay
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </div>
  );
}