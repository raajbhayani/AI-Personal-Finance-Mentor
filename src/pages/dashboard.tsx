import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/layout/Layout';
import DashboardOverview from '@/components/DashboardOverview';

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

    if (!token) {
      // Redirect to login with return URL
      router.push(`/login?redirect=${encodeURIComponent('/dashboard')}`);
      return;
    }

    // TODO: Validate token with backend
    // For now, assume token is valid if it exists
    setIsAuthenticated(true);
    setIsLoading(false);
  }, [router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Dashboard - AI Personal Finance Mentor</title>
        <meta name="description" content="Your personal finance dashboard - track expenses, budgets, and goals" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Layout>
        <DashboardOverview />
      </Layout>
    </>
  );
}