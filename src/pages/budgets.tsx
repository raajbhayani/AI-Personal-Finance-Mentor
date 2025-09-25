import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import BudgetOverview from '@/components/budgets/BudgetOverview';
import { useAuth } from '@/contexts/AuthContext';

export default function BudgetsPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view budgets</h1>
          <p className="text-gray-600">You need to be authenticated to access budget management.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <BudgetOverview />
    </Layout>
  );
}