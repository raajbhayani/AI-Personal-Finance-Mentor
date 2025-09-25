'use client';

import React, { forwardRef } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface BaseFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

interface InputFieldProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  value: string | number;
  onChange: (value: string | number) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  placeholder?: string;
  autoComplete?: string;
  showPasswordToggle?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  min?: number;
  max?: number;
  step?: number;
}

interface TextAreaFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}

interface SelectFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

// Input Field Component
export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(({
  label,
  error,
  hint,
  required,
  disabled,
  className,
  id,
  type = 'text',
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  autoComplete,
  showPasswordToggle = false,
  leftIcon,
  rightIcon,
  min,
  max,
  step,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;
  const hasError = !!error;
  const isValid = !hasError && value !== '' && value !== undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = type === 'number' ? Number(e.target.value) : e.target.value;
    onChange(newValue);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label
          htmlFor={fieldId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-gray-400">{leftIcon}</div>
          </div>
        )}

        <input
          ref={ref}
          id={fieldId}
          type={inputType}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          required={required}
          min={min}
          max={max}
          step={step}
          className={cn(
            'block w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base placeholder-gray-500 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 touch-manipulation',
            leftIcon && 'pl-10',
            (rightIcon || isPassword || showPasswordToggle) && 'pr-10',
            hasError && 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500',
            isValid && 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-green-500',
            !hasError && !isValid && 'focus:border-blue-500 focus:ring-blue-500',
            disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed'
          )}
          {...props}
        />

        {/* Right side icons */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {isPassword && showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 focus:outline-none touch-manipulation p-1"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          )}

          {!isPassword && rightIcon && (
            <div className="text-gray-400">{rightIcon}</div>
          )}

          {/* Validation icons */}
          {hasError && (
            <AlertCircle className="h-5 w-5 text-red-500 ml-2" />
          )}
          {isValid && (
            <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center space-x-1 text-sm text-red-600 animate-fade-in">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Hint message */}
      {hint && !error && (
        <p className="text-sm text-gray-500">{hint}</p>
      )}
    </div>
  );
});

InputField.displayName = 'InputField';

// TextArea Field Component
export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(({
  label,
  error,
  hint,
  required,
  disabled,
  className,
  id,
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  rows = 4,
  maxLength,
  ...props
}, ref) => {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;
  const isValid = !hasError && value !== '' && value !== undefined;
  const characterCount = value.length;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label
          htmlFor={fieldId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <textarea
          ref={ref}
          id={fieldId}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          rows={rows}
          maxLength={maxLength}
          className={cn(
            'block w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base placeholder-gray-500 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 resize-none touch-manipulation',
            hasError && 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500',
            isValid && 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-green-500',
            !hasError && !isValid && 'focus:border-blue-500 focus:ring-blue-500',
            disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed'
          )}
          {...props}
        />

        {/* Validation icons */}
        <div className="absolute top-3 right-3">
          {hasError && (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
          {isValid && (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
        </div>
      </div>

      {/* Character count and error */}
      <div className="flex justify-between">
        <div>
          {error && (
            <div className="flex items-center space-x-1 text-sm text-red-600 animate-fade-in">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {hint && !error && (
            <p className="text-sm text-gray-500">{hint}</p>
          )}
        </div>

        {maxLength && (
          <div className={cn(
            'text-sm',
            characterCount > maxLength * 0.9 ? 'text-orange-600' : 'text-gray-500',
            characterCount >= maxLength ? 'text-red-600' : ''
          )}>
            {characterCount}{maxLength && `/${maxLength}`}
          </div>
        )}
      </div>
    </div>
  );
});

TextAreaField.displayName = 'TextAreaField';

// Select Field Component
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(({
  label,
  error,
  hint,
  required,
  disabled,
  className,
  id,
  value,
  onChange,
  onBlur,
  onFocus,
  options,
  placeholder,
  ...props
}, ref) => {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;
  const isValid = !hasError && value !== '' && value !== undefined;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label
          htmlFor={fieldId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={fieldId}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          required={required}
          className={cn(
            'block w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 appearance-none touch-manipulation',
            hasError && 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500',
            isValid && 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-green-500',
            !hasError && !isValid && 'focus:border-blue-500 focus:ring-blue-500',
            disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed'
          )}
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

        {/* Dropdown arrow and validation icons */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>

          {hasError && (
            <AlertCircle className="h-5 w-5 text-red-500 ml-2" />
          )}
          {isValid && (
            <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center space-x-1 text-sm text-red-600 animate-fade-in">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Hint message */}
      {hint && !error && (
        <p className="text-sm text-gray-500">{hint}</p>
      )}
    </div>
  );
});

SelectField.displayName = 'SelectField';