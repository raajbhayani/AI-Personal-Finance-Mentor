'use client';

import React, { useState } from 'react';
import { useDataFetching, useFormSubmission } from '../../hooks/useApiState';
import { useAsync } from '../../hooks/useAsync';
import Loading, { PageLoading, CardLoading, ButtonLoading } from '../ui/Loading';
import ErrorDisplay from '../ui/ErrorDisplay';
import { DashboardStatsSkeleton, TransactionListSkeleton, ChartSkeleton } from '../ui/SkeletonLoader';
import { ComponentErrorBoundary } from '../ui/ErrorBoundary';

// Mock API functions for demonstration
const mockFetchData = (): Promise<{ name: string; value: number }[]> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.3) {
        resolve([
          { name: 'Item 1', value: 100 },
          { name: 'Item 2', value: 200 },
          { name: 'Item 3', value: 300 },
        ]);
      } else {
        reject(new Error('Failed to fetch data from server'));
      }
    }, 2000);
  });
};

const mockSubmitForm = (data: { name: string; email: string }): Promise<{ id: string; message: string }> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.2) {
        resolve({
          id: Date.now().toString(),
          message: `Form submitted successfully for ${data.name}`,
        });
      } else {
        reject(new Error('Network error: Could not submit form'));
      }
    }, 1500);
  });
};

export default function LoadingErrorExample() {
  const [formData, setFormData] = useState({ name: '', email: '' });

  // Example 1: Using useDataFetching hook
  const {
    data: fetchedData,
    loading: dataLoading,
    error: dataError,
    fetch: fetchData,
    retry: retryFetch,
    canRetry,
  } = useDataFetching<{ name: string; value: number }[]>();

  // Example 2: Using useFormSubmission hook
  const {
    data: submitResult,
    isSubmitting,
    error: submitError,
    submit: submitForm,
  } = useFormSubmission<{ name: string; email: string }, { id: string; message: string }>();

  // Example 3: Using useAsync hook
  const {
    data: asyncData,
    loading: asyncLoading,
    error: asyncError,
    execute: executeAsync,
    retry: retryAsync,
    canRetry: canRetryAsync,
  } = useAsync(mockFetchData, [], { immediate: false, maxRetries: 2 });

  const handleFetchData = () => {
    fetchData(mockFetchData, {
      showSuccessNotification: true,
      successMessage: 'Data loaded successfully!',
    });
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    submitForm(formData, mockSubmitForm, {
      successMessage: 'Form submitted successfully!',
      errorMessage: 'Failed to submit form. Please try again.',
    });
  };

  return (
    <ComponentErrorBoundary componentName="LoadingErrorExample">
      <div className="space-y-8 p-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Loading & Error States Examples</h1>
          <p className="text-gray-600">
            Comprehensive examples of loading states, error handling, and retry mechanisms.
          </p>
        </div>

        {/* Example 1: Data Fetching with Loading & Error States */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Data Fetching Example</h2>

          <div className="flex space-x-4 mb-6">
            <button
              onClick={handleFetchData}
              disabled={dataLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {dataLoading ? <ButtonLoading text="Loading..." /> : 'Fetch Data'}
            </button>

            {dataError && canRetry && (
              <button
                onClick={() => retryFetch(mockFetchData)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Retry
              </button>
            )}
          </div>

          {dataLoading && <CardLoading />}

          {dataError && (
            <ErrorDisplay
              type="network"
              variant="card"
              error={dataError}
              onRetry={canRetry ? async () => { await retryFetch(mockFetchData); } : undefined}
              canRetry={canRetry}
            />
          )}

          {fetchedData && !dataLoading && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Fetched Data:</h3>
              {fetchedData.map((item, index) => (
                <div key={index} className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>{item.name}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Example 2: Form Submission */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Form Submission Example</h2>

          <form onSubmit={handleSubmitForm} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !formData.name || !formData.email}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <ButtonLoading text="Submitting..." /> : 'Submit Form'}
            </button>
          </form>

          {submitError && (
            <div className="mt-4">
              <ErrorDisplay
                type="validation"
                variant="toast"
                error={submitError}
                onRetry={() => handleSubmitForm(new Event('submit') as any)}
              />
            </div>
          )}

          {submitResult && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">{submitResult.message}</p>
            </div>
          )}
        </div>

        {/* Example 3: Different Loading Variants */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Loading Variants</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Spinner Variants</h3>
              <div className="space-y-4">
                <Loading variant="spinner" size="sm" text="Small spinner" />
                <Loading variant="spinner" size="md" text="Medium spinner" />
                <Loading variant="spinner" size="lg" text="Large spinner" />
                <Loading variant="dots" text="Dots animation" />
                <Loading variant="pulse" text="Pulse animation" />
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">Skeleton Loaders</h3>
              <div className="space-y-4">
                <DashboardStatsSkeleton />
                <ChartSkeleton className="h-48" />
                <TransactionListSkeleton count={3} />
              </div>
            </div>
          </div>
        </div>

        {/* Example 4: Error Variants */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Error Display Variants</h2>

          <div className="space-y-6">
            <ErrorDisplay
              type="network"
              variant="inline"
              message="Inline error message"
              onRetry={() => console.log('Retry clicked')}
            />

            <ErrorDisplay
              type="server"
              variant="toast"
              title="Server Error"
              message="Something went wrong on our end"
              onRetry={() => console.log('Retry clicked')}
            />

            <ErrorDisplay
              type="not-found"
              variant="card"
              onGoHome={() => console.log('Go home clicked')}
            />
          </div>
        </div>

        {/* Example 5: Async Hook */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Async Hook Example</h2>

          <div className="flex space-x-4 mb-6">
            <button
              onClick={executeAsync}
              disabled={asyncLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {asyncLoading ? <ButtonLoading text="Loading..." /> : 'Execute Async'}
            </button>

            {asyncError && canRetryAsync && (
              <button
                onClick={retryAsync}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Retry Async
              </button>
            )}
          </div>

          {asyncLoading && <Loading variant="spinner" text="Executing async operation..." />}

          {asyncError && (
            <ErrorDisplay
              type="generic"
              variant="card"
              error={asyncError}
              onRetry={canRetryAsync ? retryAsync : undefined}
              canRetry={canRetryAsync}
            />
          )}

          {asyncData && !asyncLoading && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Async Result:</h3>
              {asyncData.map((item, index) => (
                <div key={index} className="flex justify-between p-2 bg-purple-50 rounded">
                  <span>{item.name}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ComponentErrorBoundary>
  );
}