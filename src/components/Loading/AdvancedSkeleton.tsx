'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
  ...props
}: SkeletonProps) {
  const baseClasses = cn(
    'bg-gray-200 dark:bg-gray-700',
    {
      'animate-pulse': animation === 'pulse',
      'animate-wave': animation === 'wave',
      'rounded-full': variant === 'circular',
      'rounded-lg': variant === 'rounded',
      'rounded-sm': variant === 'text',
    },
    className
  );

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return <div className={baseClasses} style={style} {...props} />;
}

// Dashboard skeleton components
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton width={200} height={32} variant="text" />
        <Skeleton width={120} height={40} variant="rounded" />
      </div>

      {/* Balance cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton width={80} height={16} variant="text" />
              <Skeleton width={32} height={32} variant="circular" />
            </div>
            <Skeleton width={120} height={28} variant="text" className="mb-2" />
            <Skeleton width={100} height={16} variant="text" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <Skeleton width={180} height={24} variant="text" className="mb-4" />
          <Skeleton width="100%" height={200} variant="rounded" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <Skeleton width={160} height={24} variant="text" className="mb-4" />
          <Skeleton width="100%" height={200} variant="rounded" />
        </div>
      </div>

      {/* Recent transactions skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <Skeleton width={180} height={24} variant="text" className="mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="flex items-center space-x-3">
                <Skeleton width={40} height={40} variant="circular" />
                <div>
                  <Skeleton width={120} height={16} variant="text" className="mb-1" />
                  <Skeleton width={80} height={14} variant="text" />
                </div>
              </div>
              <Skeleton width={80} height={20} variant="text" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Transaction list skeleton
export function TransactionListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Skeleton width={48} height={48} variant="circular" />
              <div className="space-y-2">
                <Skeleton width={160} height={16} variant="text" />
                <Skeleton width={120} height={14} variant="text" />
              </div>
            </div>
            <div className="text-right space-y-2">
              <Skeleton width={80} height={18} variant="text" />
              <Skeleton width={60} height={14} variant="text" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Chart skeleton
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <Skeleton width={180} height={24} variant="text" />
        <Skeleton width={100} height={32} variant="rounded" />
      </div>

      {/* Chart area */}
      <div className="relative" style={{ height }}>
        <Skeleton width="100%" height="100%" variant="rounded" />

        {/* Overlay some chart-like elements */}
        <div className="absolute inset-0 p-4">
          <div className="flex items-end justify-between h-full">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton
                key={i}
                width={20}
                height={Math.random() * 60 + 40}
                variant="rounded"
                className="bg-gray-300/50"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 mt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-2">
            <Skeleton width={12} height={12} variant="circular" />
            <Skeleton width={60} height={14} variant="text" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Form skeleton
export function FormSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton width={100} height={16} variant="text" />
          <Skeleton width="100%" height={48} variant="rounded" />
        </div>
      ))}
      <Skeleton width={120} height={48} variant="rounded" />
    </div>
  );
}

// Table skeleton
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} width={80} height={16} variant="text" />
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4">
            <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, j) => (
                <Skeleton key={j} width={100} height={16} variant="text" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Card grid skeleton
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton width={32} height={32} variant="circular" />
            <Skeleton width={60} height={20} variant="rounded" />
          </div>
          <Skeleton width="100%" height={80} variant="rounded" className="mb-4" />
          <Skeleton width={120} height={16} variant="text" className="mb-2" />
          <Skeleton width="100%" height={14} variant="text" />
        </div>
      ))}
    </div>
  );
}

// Loading spinner with text
export function LoadingSpinner({
  size = 'md',
  text = 'Loading...',
  className = ''
}: {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center space-y-3', className)}>
      <div className={cn('animate-spin rounded-full border-b-2 border-blue-600', sizeClasses[size])} />
      {text && <p className="text-sm text-gray-600">{text}</p>}
    </div>
  );
}

// Shimmer animation for skeleton loader
export function ShimmerSkeleton({
  width = '100%',
  height = '1rem',
  className = ''
}: {
  width?: string | number;
  height?: string | number;
  className?: string;
}) {
  return (
    <div
      className={cn('bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-size-200 animate-shimmer rounded', className)}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}