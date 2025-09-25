'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { designTokens } from '@/lib/design/tokens';
import { animations } from '@/lib/design/animations';

// Loading spinner component
interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  thickness?: 'thin' | 'medium' | 'thick';
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  color = 'primary',
  thickness = 'medium',
  className,
}: LoadingSpinnerProps) {
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const colors = {
    primary: `border-${designTokens.colors.primary[600]} border-t-transparent`,
    secondary: `border-${designTokens.colors.secondary[600]} border-t-transparent`,
    white: 'border-white border-t-transparent',
    gray: `border-${designTokens.colors.gray[600]} border-t-transparent`,
  };

  const thicknesses = {
    thin: 'border',
    medium: 'border-2',
    thick: 'border-4',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full',
        sizes[size],
        colors[color],
        thicknesses[thickness],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Loading dots component
interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'gray';
  className?: string;
}

export function LoadingDots({
  size = 'md',
  color = 'primary',
  className,
}: LoadingDotsProps) {
  const sizes = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const colors = {
    primary: `bg-${designTokens.colors.primary[600]}`,
    secondary: `bg-${designTokens.colors.secondary[600]}`,
    gray: `bg-${designTokens.colors.gray[600]}`,
  };

  return (
    <div
      className={cn('flex items-center space-x-1', className)}
      role="status"
      aria-label="Loading"
    >
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={cn(
            'rounded-full animate-pulse',
            sizes[size],
            colors[color]
          )}
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: '1s',
          }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Loading pulse component
interface LoadingPulseProps {
  className?: string;
  children?: React.ReactNode;
}

export function LoadingPulse({ className, children }: LoadingPulseProps) {
  return (
    <div className={cn('animate-pulse', className)}>
      {children || (
        <div className="bg-gray-200 rounded h-4 w-full" />
      )}
    </div>
  );
}

// Skeleton loader component
interface SkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular' | 'rounded';
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
}

export function Skeleton({
  variant = 'rectangular',
  width = '100%',
  height = '1rem',
  lines = 1,
  className,
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded-sm',
    rectangular: 'rounded-md',
    circular: 'rounded-full',
    rounded: 'rounded-lg',
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  if (lines > 1) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'bg-gray-200 animate-pulse',
              variantClasses[variant]
            )}
            style={{
              ...style,
              width: index === lines - 1 ? '75%' : style.width,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-gray-200 animate-pulse',
        variantClasses[variant],
        className
      )}
      style={style}
    />
  );
}

// Shimmer effect component
interface ShimmerProps {
  className?: string;
  children: React.ReactNode;
}

export function Shimmer({ className, children }: ShimmerProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {children}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}

// Progress bar component
interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  animated?: boolean;
  striped?: boolean;
  label?: string;
  showValue?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  color = 'primary',
  animated = false,
  striped = false,
  label,
  showValue = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const colors = {
    primary: `bg-${designTokens.colors.primary[600]}`,
    secondary: `bg-${designTokens.colors.secondary[600]}`,
    success: `bg-${designTokens.colors.success[600]}`,
    warning: `bg-${designTokens.colors.warning[600]}`,
    error: `bg-${designTokens.colors.error[600]}`,
  };

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-sm font-medium text-gray-700">{label}</span>
          )}
          {showValue && (
            <span className="text-sm text-gray-500">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full bg-gray-200 rounded-full overflow-hidden',
          sizes[size]
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `Progress: ${Math.round(percentage)}%`}
      >
        <div
          className={cn(
            'transition-all duration-300 ease-out rounded-full',
            colors[color],
            animated && 'animate-pulse',
            striped && 'bg-stripes'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Loading overlay component
interface LoadingOverlayProps {
  loading: boolean;
  message?: string;
  backdrop?: boolean;
  blur?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function LoadingOverlay({
  loading,
  message = 'Loading...',
  backdrop = true,
  blur = false,
  className,
  children,
}: LoadingOverlayProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {loading && (
        <div
          className={cn(
            'absolute inset-0 z-50 flex flex-col items-center justify-center',
            backdrop && 'bg-white/80',
            blur && 'backdrop-blur-sm'
          )}
        >
          <LoadingSpinner size="lg" />
          {message && (
            <p className="mt-4 text-sm text-gray-600 font-medium">
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Button loading state
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
}

export function LoadingButton({
  loading = false,
  loadingText,
  size = 'md',
  variant = 'primary',
  disabled,
  className,
  children,
  ...props
}: LoadingButtonProps) {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variants = {
    primary: `bg-${designTokens.colors.primary[600]} text-white hover:bg-${designTokens.colors.primary[700]}`,
    secondary: `bg-${designTokens.colors.secondary[600]} text-white hover:bg-${designTokens.colors.secondary[700]}`,
    outline: `border-2 border-${designTokens.colors.primary[600]} text-${designTokens.colors.primary[600]} hover:bg-${designTokens.colors.primary[50]}`,
  };

  return (
    <button
      className={cn(
        'relative inline-flex items-center justify-center',
        'font-medium rounded-md transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizes[size],
        variants[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <LoadingSpinner
          size="sm"
          color={variant === 'outline' ? 'primary' : 'white'}
          className="mr-2"
        />
      )}
      <span className={loading ? 'opacity-70' : ''}>
        {loading && loadingText ? loadingText : children}
      </span>
    </button>
  );
}

// Card loading state
interface LoadingCardProps {
  lines?: number;
  showAvatar?: boolean;
  showActions?: boolean;
  className?: string;
}

export function LoadingCard({
  lines = 3,
  showAvatar = false,
  showActions = false,
  className,
}: LoadingCardProps) {
  return (
    <div className={cn('p-6 bg-white rounded-lg border border-gray-200', className)}>
      <div className="animate-pulse">
        {/* Header */}
        <div className="flex items-start space-x-4 mb-4">
          {showAvatar && (
            <Skeleton variant="circular" width={40} height={40} />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton height="1.25rem" width="60%" />
            <Skeleton height="1rem" width="40%" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3 mb-4">
          {Array.from({ length: lines }).map((_, index) => (
            <Skeleton
              key={index}
              height="1rem"
              width={index === lines - 1 ? '70%' : '100%'}
            />
          ))}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex space-x-3">
            <Skeleton height="2rem" width="5rem" variant="rounded" />
            <Skeleton height="2rem" width="5rem" variant="rounded" />
          </div>
        )}
      </div>
    </div>
  );
}

// List loading state
interface LoadingListProps {
  items?: number;
  showAvatar?: boolean;
  className?: string;
}

export function LoadingList({
  items = 5,
  showAvatar = true,
  className,
}: LoadingListProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200">
          <div className="animate-pulse flex items-center space-x-4 w-full">
            {showAvatar && (
              <Skeleton variant="circular" width={48} height={48} />
            )}
            <div className="flex-1 space-y-2">
              <Skeleton height="1.25rem" width="40%" />
              <Skeleton height="1rem" width="60%" />
            </div>
            <Skeleton height="1rem" width="15%" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Chart loading state
interface LoadingChartProps {
  height?: number;
  type?: 'bar' | 'line' | 'pie';
  className?: string;
}

export function LoadingChart({
  height = 300,
  type = 'bar',
  className,
}: LoadingChartProps) {
  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 p-6', className)}>
      <div className="animate-pulse">
        {/* Chart title */}
        <div className="flex justify-between items-center mb-6">
          <Skeleton height="1.5rem" width="30%" />
          <Skeleton height="2rem" width="6rem" variant="rounded" />
        </div>

        {/* Chart area */}
        <div className="relative" style={{ height }}>
          {type === 'bar' && (
            <div className="flex items-end justify-between h-full space-x-2">
              {Array.from({ length: 7 }).map((_, index) => (
                <Skeleton
                  key={index}
                  width="100%"
                  height={`${Math.random() * 60 + 40}%`}
                  variant="rounded"
                />
              ))}
            </div>
          )}

          {type === 'line' && (
            <Skeleton
              width="100%"
              height="100%"
              variant="rounded"
              className="bg-gradient-to-br from-gray-200 to-gray-300"
            />
          )}

          {type === 'pie' && (
            <div className="flex items-center justify-center h-full">
              <Skeleton
                variant="circular"
                width={200}
                height={200}
              />
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex justify-center space-x-6 mt-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Skeleton variant="circular" width={12} height={12} />
              <Skeleton height="1rem" width="4rem" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}