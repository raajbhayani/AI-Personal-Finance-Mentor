'use client';

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children?: React.ReactNode;
}

const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  children,
  disabled,
  ...props
}, ref) => {
  const baseClasses = cn(
    // Base styles
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'touch-manipulation select-none',
    // Active and hover states optimized for touch
    'active:scale-[0.98] active:transition-transform active:duration-75',
    // Disabled state
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
    // Full width option
    fullWidth && 'w-full'
  );

  const variantClasses = {
    primary: cn(
      'bg-blue-600 text-white shadow-sm',
      'hover:bg-blue-700 focus:ring-blue-500',
      'active:bg-blue-800',
      'disabled:bg-blue-300'
    ),
    secondary: cn(
      'bg-gray-100 text-gray-900 shadow-sm',
      'hover:bg-gray-200 focus:ring-gray-500',
      'active:bg-gray-300',
      'disabled:bg-gray-50'
    ),
    ghost: cn(
      'text-gray-700 bg-transparent',
      'hover:bg-gray-100 focus:ring-gray-500',
      'active:bg-gray-200'
    ),
    destructive: cn(
      'bg-red-600 text-white shadow-sm',
      'hover:bg-red-700 focus:ring-red-500',
      'active:bg-red-800',
      'disabled:bg-red-300'
    ),
    outline: cn(
      'border border-gray-300 bg-white text-gray-700 shadow-sm',
      'hover:bg-gray-50 focus:ring-gray-500',
      'active:bg-gray-100',
      'disabled:bg-gray-50'
    ),
  };

  const sizeClasses = {
    sm: 'h-10 px-4 text-sm min-w-[80px]',
    md: 'h-12 px-6 text-base min-w-[100px]',
    lg: 'h-14 px-8 text-lg min-w-[120px]',
    xl: 'h-16 px-10 text-xl min-w-[140px]',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  };

  const spacingClasses = {
    sm: children ? (iconPosition === 'left' ? 'mr-2' : 'ml-2') : '',
    md: children ? (iconPosition === 'left' ? 'mr-2' : 'ml-2') : '',
    lg: children ? (iconPosition === 'left' ? 'mr-3' : 'ml-3') : '',
    xl: children ? (iconPosition === 'left' ? 'mr-3' : 'ml-3') : '',
  };

  return (
    <button
      ref={ref}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className={cn(
          iconSizeClasses[size],
          'animate-spin',
          children && 'mr-2'
        )} />
      )}

      {!loading && icon && iconPosition === 'left' && (
        <span className={cn(iconSizeClasses[size], spacingClasses[size])}>
          {icon}
        </span>
      )}

      {children && <span>{children}</span>}

      {!loading && icon && iconPosition === 'right' && (
        <span className={cn(iconSizeClasses[size], spacingClasses[size])}>
          {icon}
        </span>
      )}
    </button>
  );
});

TouchButton.displayName = 'TouchButton';

export default TouchButton;