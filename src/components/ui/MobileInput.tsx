'use client';

import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  showPasswordToggle?: boolean;
  fullWidth?: boolean;
}

const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(({
  className,
  label,
  error,
  hint,
  icon,
  iconPosition = 'left',
  showPasswordToggle = false,
  fullWidth = true,
  type = 'text',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = showPasswordToggle && type === 'password'
    ? (showPassword ? 'text' : 'password')
    : type;

  const hasError = Boolean(error);

  return (
    <div className={cn('space-y-2', fullWidth && 'w-full')}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className={cn(
              'w-5 h-5',
              hasError ? 'text-red-500' : isFocused ? 'text-blue-500' : 'text-gray-400'
            )}>
              {icon}
            </span>
          </div>
        )}

        {/* Input Field */}
        <input
          ref={ref}
          type={inputType}
          className={cn(
            // Base styles
            'block w-full rounded-xl border transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            // Touch-friendly sizing
            'h-12 px-4 text-base',
            // Icon padding
            icon && iconPosition === 'left' && 'pl-12',
            (icon && iconPosition === 'right') || showPasswordToggle ? 'pr-12' : 'pr-4',
            // Error states
            hasError
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
            // Background
            'bg-white',
            // Disabled state
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            // Text selection
            'selection:bg-blue-100',
            className
          )}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />

        {/* Right Icon or Password Toggle */}
        {((icon && iconPosition === 'right') || showPasswordToggle) && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            {showPasswordToggle ? (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 touch-manipulation p-1"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            ) : (
              <span className={cn(
                'w-5 h-5',
                hasError ? 'text-red-500' : isFocused ? 'text-blue-500' : 'text-gray-400'
              )}>
                {icon}
              </span>
            )}
          </div>
        )}

        {/* Error Icon */}
        {hasError && !showPasswordToggle && !(icon && iconPosition === 'right') && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
          {error}
        </p>
      )}

      {/* Hint */}
      {hint && !error && (
        <p className="text-sm text-gray-500">{hint}</p>
      )}
    </div>
  );
});

MobileInput.displayName = 'MobileInput';

export default MobileInput;

// Mobile Textarea Component
export interface MobileTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
  autoResize?: boolean;
}

export const MobileTextarea = forwardRef<HTMLTextAreaElement, MobileTextareaProps>(({
  className,
  label,
  error,
  hint,
  fullWidth = true,
  autoResize = false,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasError = Boolean(error);

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    if (autoResize) {
      const target = e.target as HTMLTextAreaElement;
      target.style.height = 'auto';
      target.style.height = `${target.scrollHeight}px`;
    }
    props.onInput?.(e);
  };

  return (
    <div className={cn('space-y-2', fullWidth && 'w-full')}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Textarea */}
      <textarea
        ref={ref}
        className={cn(
          // Base styles
          'block w-full rounded-xl border transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          // Touch-friendly sizing
          'min-h-[120px] p-4 text-base',
          // Error states
          hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
          // Background
          'bg-white',
          // Disabled state
          'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
          // Text selection
          'selection:bg-blue-100',
          // Resize behavior
          autoResize ? 'resize-none overflow-hidden' : 'resize-y',
          className
        )}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        onInput={handleInput}
        {...props}
      />

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
          {error}
        </p>
      )}

      {/* Hint */}
      {hint && !error && (
        <p className="text-sm text-gray-500">{hint}</p>
      )}
    </div>
  );
});

MobileTextarea.displayName = 'MobileTextarea';

// Mobile Select Component
export interface MobileSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export const MobileSelect = forwardRef<HTMLSelectElement, MobileSelectProps>(({
  className,
  label,
  error,
  hint,
  fullWidth = true,
  options,
  placeholder,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasError = Boolean(error);

  return (
    <div className={cn('space-y-2', fullWidth && 'w-full')}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Select Container */}
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            // Base styles
            'block w-full rounded-xl border transition-all duration-200 appearance-none',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            // Touch-friendly sizing
            'h-12 px-4 pr-10 text-base',
            // Error states
            hasError
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
            // Background
            'bg-white',
            // Disabled state
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            className
          )}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* Dropdown Arrow */}
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <svg
            className={cn(
              'w-5 h-5',
              hasError ? 'text-red-500' : isFocused ? 'text-blue-500' : 'text-gray-400'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
          {error}
        </p>
      )}

      {/* Hint */}
      {hint && !error && (
        <p className="text-sm text-gray-500">{hint}</p>
      )}
    </div>
  );
});

MobileSelect.displayName = 'MobileSelect';