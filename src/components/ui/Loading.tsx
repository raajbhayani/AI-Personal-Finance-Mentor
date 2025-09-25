'use client';

import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

export type LoadingVariant = 'spinner' | 'dots' | 'pulse' | 'skeleton' | 'inline' | 'overlay';
export type LoadingSize = 'sm' | 'md' | 'lg' | 'xl';

interface LoadingProps {
  variant?: LoadingVariant;
  size?: LoadingSize;
  text?: string;
  className?: string;
  fullScreen?: boolean;
  overlay?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const textSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

export default function Loading({
  variant = 'spinner',
  size = 'md',
  text,
  className,
  fullScreen = false,
  overlay = false,
}: LoadingProps) {
  const renderSpinner = () => (
    <div className={cn('flex items-center justify-center', className)}>
      <Loader2 className={cn('animate-spin text-blue-600', sizeClasses[size])} />
      {text && (
        <span className={cn('ml-3 text-gray-600 font-medium', textSizes[size])}>
          {text}
        </span>
      )}
    </div>
  );

  const renderDots = () => (
    <div className={cn('flex items-center justify-center space-x-1', className)}>
      <div className="flex space-x-1">
        <div className={cn(
          'bg-blue-600 rounded-full animate-bounce',
          size === 'sm' ? 'h-2 w-2' : size === 'md' ? 'h-3 w-3' : size === 'lg' ? 'h-4 w-4' : 'h-5 w-5'
        )}></div>
        <div className={cn(
          'bg-blue-600 rounded-full animate-bounce',
          size === 'sm' ? 'h-2 w-2' : size === 'md' ? 'h-3 w-3' : size === 'lg' ? 'h-4 w-4' : 'h-5 w-5'
        )} style={{ animationDelay: '0.1s' }}></div>
        <div className={cn(
          'bg-blue-600 rounded-full animate-bounce',
          size === 'sm' ? 'h-2 w-2' : size === 'md' ? 'h-3 w-3' : size === 'lg' ? 'h-4 w-4' : 'h-5 w-5'
        )} style={{ animationDelay: '0.2s' }}></div>
      </div>
      {text && (
        <span className={cn('ml-3 text-gray-600 font-medium', textSizes[size])}>
          {text}
        </span>
      )}
    </div>
  );

  const renderPulse = () => (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn(
        'bg-blue-600 rounded-full animate-pulse',
        sizeClasses[size]
      )}></div>
      {text && (
        <span className={cn('ml-3 text-gray-600 font-medium', textSizes[size])}>
          {text}
        </span>
      )}
    </div>
  );

  const renderSkeleton = () => (
    <div className={cn('animate-pulse space-y-3', className)}>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  );

  const renderInline = () => (
    <div className={cn('inline-flex items-center', className)}>
      <RefreshCw className={cn('animate-spin text-blue-600', sizeClasses[size])} />
      {text && (
        <span className={cn('ml-2 text-gray-600', textSizes[size])}>
          {text}
        </span>
      )}
    </div>
  );

  const renderContent = () => {
    switch (variant) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'skeleton':
        return renderSkeleton();
      case 'inline':
        return renderInline();
      default:
        return renderSpinner();
    }
  };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        <div className="text-center">
          {renderContent()}
        </div>
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
        <div className="text-center">
          {renderContent()}
        </div>
      </div>
    );
  }

  return renderContent();
}

// Specialized loading components for common use cases
export function PageLoading({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loading variant="spinner" size="lg" text={text} />
    </div>
  );
}

export function CardLoading({ className }: { className?: string }) {
  return (
    <div className={cn("bg-white rounded-lg shadow-soft border border-gray-200 p-6", className)}>
      <Loading variant="skeleton" />
    </div>
  );
}

export function TableLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex space-x-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="w-16 h-4 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  );
}

export function ChartLoading({ className }: { className?: string }) {
  return (
    <div className={cn("bg-white rounded-lg shadow-soft border border-gray-200 p-6", className)}>
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

export function ButtonLoading({ text = "Loading...", className }: { text?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <Loader2 className="animate-spin h-4 w-4 mr-2" />
      {text}
    </span>
  );
}