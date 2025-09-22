import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'circular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = '100%',
  height = '1rem',
  variant = 'text',
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';

  const variantClasses = {
    text: 'rounded',
    rectangular: '',
    circular: 'rounded-full',
    rounded: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: '',
  };

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${animationClasses[animation]}
        ${className}
      `.trim()}
      style={style}
      role="status"
      aria-label="Loading..."
    />
  );
};

interface ComponentSkeletonProps {
  variant?: 'card' | 'list' | 'table' | 'form' | 'chart' | 'page' | 'dashboard';
  rows?: number;
  className?: string;
}

export const ComponentSkeleton: React.FC<ComponentSkeletonProps> = ({
  variant = 'card',
  rows = 3,
  className = '',
}) => {
  const renderCardSkeleton = () => (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
      <Skeleton height="1.5rem" width="60%" className="mb-4" />
      <Skeleton height="1rem" className="mb-2" />
      <Skeleton height="1rem" width="80%" className="mb-2" />
      <Skeleton height="1rem" width="40%" />
    </div>
  );

  const renderListSkeleton = () => (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton height="1rem" width="75%" />
            <Skeleton height="0.875rem" width="50%" />
          </div>
          <Skeleton width={80} height="2rem" variant="rounded" />
        </div>
      ))}
    </div>
  );

  const renderTableSkeleton = () => (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden ${className}`}>
      {/* Table Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-4">
          <Skeleton width="20%" height="1rem" />
          <Skeleton width="25%" height="1rem" />
          <Skeleton width="15%" height="1rem" />
          <Skeleton width="20%" height="1rem" />
          <Skeleton width="10%" height="1rem" />
        </div>
      </div>
      {/* Table Rows */}
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
          <div className="flex space-x-4">
            <Skeleton width="20%" height="0.875rem" />
            <Skeleton width="25%" height="0.875rem" />
            <Skeleton width="15%" height="0.875rem" />
            <Skeleton width="20%" height="0.875rem" />
            <Skeleton width="10%" height="0.875rem" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderFormSkeleton = () => (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
      <Skeleton height="1.5rem" width="40%" className="mb-6" />
      <div className="space-y-4">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton height="0.875rem" width="25%" />
            <Skeleton height="2.5rem" variant="rounded" />
          </div>
        ))}
        <div className="pt-4">
          <Skeleton height="2.5rem" width="120px" variant="rounded" />
        </div>
      </div>
    </div>
  );

  const renderChartSkeleton = () => (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <Skeleton height="1.5rem" width="40%" />
        <Skeleton height="1rem" width="100px" variant="rounded" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-end space-x-2" style={{ height: '200px' }}>
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton
              key={i}
              width="2rem"
              height={`${Math.random() * 80 + 20}%`}
              variant="rectangular"
            />
          ))}
        </div>
      </div>
      <div className="flex justify-center space-x-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-center space-x-2">
            <Skeleton variant="circular" width={12} height={12} />
            <Skeleton height="0.875rem" width="60px" />
          </div>
        ))}
      </div>
    </div>
  );

  const renderPageSkeleton = () => (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Skeleton height="2rem" width="200px" />
            <div className="flex space-x-4">
              <Skeleton variant="circular" width={40} height={40} />
              <Skeleton height="2rem" width="100px" variant="rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {renderCardSkeleton()}
            {renderTableSkeleton()}
          </div>
          <div className="space-y-6">
            {renderChartSkeleton()}
            {renderCardSkeleton()}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDashboardSkeleton = () => (
    <div className={`space-y-6 ${className}`}>
      {/* Dashboard Header */}
      <div className="flex justify-between items-center">
        <Skeleton height="2rem" width="300px" />
        <div className="flex space-x-3">
          <Skeleton height="2.5rem" width="120px" variant="rounded" />
          <Skeleton height="2.5rem" width="100px" variant="rounded" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton height="0.875rem" width="80px" className="mb-2" />
                <Skeleton height="2rem" width="120px" />
              </div>
              <Skeleton variant="circular" width={48} height={48} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderChartSkeleton()}
        {renderListSkeleton()}
      </div>
    </div>
  );

  const skeletonVariants = {
    card: renderCardSkeleton,
    list: renderListSkeleton,
    table: renderTableSkeleton,
    form: renderFormSkeleton,
    chart: renderChartSkeleton,
    page: renderPageSkeleton,
    dashboard: renderDashboardSkeleton,
  };

  return skeletonVariants[variant]();
};

// Loading spinner component
export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading..."
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Progress bar component
export const ProgressBar: React.FC<{
  progress: number;
  className?: string;
  showLabel?: boolean;
}> = ({ progress, className = '', showLabel = false }) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Loading...</span>
          <span>{Math.round(clampedProgress)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
};

// Pulse animation for loading states
export const PulseLoader: React.FC<{
  dots?: number;
  className?: string;
}> = ({ dots = 3, className = '' }) => (
  <div className={`flex space-x-1 justify-center items-center ${className}`}>
    {Array.from({ length: dots }, (_, i) => (
      <div
        key={i}
        className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
        style={{
          animationDelay: `${i * 0.2}s`,
          animationDuration: '1s',
        }}
      />
    ))}
  </div>
);

export default ComponentSkeleton;