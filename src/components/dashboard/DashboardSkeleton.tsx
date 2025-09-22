'use client';

import React from 'react';
import { SkeletonCard, SkeletonChart, SkeletonTransaction, SkeletonBalanceCard } from '../ui/Skeleton';

export default function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Balance Overview Cards Skeleton */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBalanceCard key={index} />
          ))}
        </div>
      </section>

      {/* Charts and Transactions Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions Skeleton */}
        <div className="lg:col-span-2">
          <SkeletonCard className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-40 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex space-x-2">
                <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonTransaction key={index} />
              ))}
            </div>
            <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
          </SkeletonCard>
        </div>

        {/* Financial Goals Skeleton */}
        <div className="lg:col-span-1">
          <SkeletonCard className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
            {/* Overall Progress */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex justify-between">
                <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex justify-between">
                <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            {/* Goals List */}
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                      <div className="space-y-1">
                        <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-32 h-3 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="w-12 h-5 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </SkeletonCard>
        </div>
      </div>

      {/* Analytics Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expenses Chart Skeleton */}
        <div className="lg:col-span-2">
          <SkeletonChart />
        </div>

        {/* Expense Categories Chart Skeleton */}
        <div className="lg:col-span-1">
          <SkeletonCard className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-36 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex flex-col lg:flex-row items-center space-y-6 lg:space-y-0 lg:space-x-6">
              {/* Pie Chart */}
              <div className="w-60 h-60 bg-gray-200 rounded-full animate-pulse"></div>
              {/* Legend */}
              <div className="flex-1 space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="space-y-1">
                        <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </SkeletonCard>
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse mr-3"></div>
              <div className="space-y-1">
                <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-32 h-3 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}