'use client';

import React from 'react';
import { cn } from '../../lib/utils/cn';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  animate?: boolean;
}

export function Skeleton({
  className,
  width,
  height,
  rounded = 'md',
  animate = true,
  style,
  ...props
}: SkeletonProps) {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  const skeletonStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...style,
  };

  return (
    <div
      className={cn(
        'bg-gray-200',
        roundedClasses[rounded],
        animate && 'animate-pulse',
        className
      )}
      style={skeletonStyle}
      {...props}
    />
  );
}

// Pre-built skeleton components for common use cases
export function SkeletonCard({ children, ...props }: { children?: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('bg-white border border-gray-200 rounded-xl p-6 space-y-4', props.className)}>
      {children || (
        <>
          <div className="flex items-center justify-between">
            <Skeleton width={120} height={20} />
            <Skeleton width={60} height={20} />
          </div>
          <Skeleton width="100%" height={40} />
          <div className="space-y-2">
            <Skeleton width="80%" height={16} />
            <Skeleton width="60%" height={16} />
          </div>
        </>
      )}
    </div>
  );
}

export function SkeletonChart({ ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('bg-white border border-gray-200 rounded-xl p-6 space-y-4', props.className)}>
      <div className="flex items-center justify-between">
        <Skeleton width={150} height={24} />
        <Skeleton width={80} height={32} rounded="lg" />
      </div>
      <div className="space-y-3">
        <Skeleton width="100%" height={200} rounded="lg" />
        <div className="flex justify-center space-x-4">
          <Skeleton width={60} height={16} />
          <Skeleton width={60} height={16} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTransaction({ ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center space-x-4 p-4 border border-gray-100 rounded-lg', props.className)}>
      <Skeleton width={40} height={40} rounded="full" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton width={120} height={16} />
          <Skeleton width={80} height={16} />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton width={100} height={14} />
          <Skeleton width={60} height={14} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonBalanceCard({ ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('bg-white border border-gray-200 rounded-xl p-6 space-y-4', props.className)}>
      <div className="flex items-center justify-between">
        <Skeleton width={100} height={16} />
        <Skeleton width={32} height={32} rounded="lg" />
      </div>
      <div className="space-y-2">
        <Skeleton width={120} height={32} />
        <Skeleton width={80} height={16} />
      </div>
    </div>
  );
}

export default Skeleton;