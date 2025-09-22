'use client';

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = [
      'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'transform hover:scale-[1.02] active:scale-[0.98]',
    ];

    const variants = {
      primary: [
        'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm',
        'hover:from-blue-700 hover:to-blue-800 hover:shadow-md',
        'focus:ring-blue-500',
        'disabled:from-blue-300 disabled:to-blue-300 disabled:hover:shadow-sm disabled:transform-none',
      ],
      secondary: [
        'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-sm',
        'hover:from-emerald-700 hover:to-emerald-800 hover:shadow-md',
        'focus:ring-emerald-500',
        'disabled:from-emerald-300 disabled:to-emerald-300 disabled:hover:shadow-sm disabled:transform-none',
      ],
      outline: [
        'border-2 border-gray-300 bg-white text-gray-700',
        'hover:border-gray-400 hover:bg-gray-50',
        'focus:ring-gray-500 focus:border-gray-400',
        'disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400',
      ],
      ghost: [
        'text-gray-700 bg-transparent',
        'hover:bg-gray-100 hover:text-gray-900',
        'focus:ring-gray-500',
        'disabled:text-gray-400 disabled:hover:bg-transparent',
      ],
      destructive: [
        'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm',
        'hover:from-red-700 hover:to-red-800 hover:shadow-md',
        'focus:ring-red-500',
        'disabled:from-red-300 disabled:to-red-300 disabled:hover:shadow-sm disabled:transform-none',
      ],
    };

    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-sm',
      lg: 'px-6 py-4 text-base',
    };

    const isDisabled = disabled || loading;

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          isDisabled && 'transform-none',
          className
        )}
        disabled={isDisabled}
        ref={ref}
        {...props}
      >
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {!loading && leftIcon && (
          <span className="mr-2">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className="ml-2">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;