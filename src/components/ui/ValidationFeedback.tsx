'use client';

import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ValidationFeedbackProps {
  type: 'error' | 'success' | 'warning' | 'info';
  title?: string;
  message: string | string[];
  onDismiss?: () => void;
  dismissible?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const iconMap = {
  error: AlertCircle,
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: 'text-red-500',
    title: 'text-red-800',
    message: 'text-red-700',
    button: 'text-red-500 hover:text-red-600 focus:ring-red-500',
  },
  success: {
    container: 'bg-green-50 border-green-200 text-green-800',
    icon: 'text-green-500',
    title: 'text-green-800',
    message: 'text-green-700',
    button: 'text-green-500 hover:text-green-600 focus:ring-green-500',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: 'text-yellow-500',
    title: 'text-yellow-800',
    message: 'text-yellow-700',
    button: 'text-yellow-500 hover:text-yellow-600 focus:ring-yellow-500',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: 'text-blue-500',
    title: 'text-blue-800',
    message: 'text-blue-700',
    button: 'text-blue-500 hover:text-blue-600 focus:ring-blue-500',
  },
};

const sizeMap = {
  sm: {
    container: 'p-3',
    icon: 'h-4 w-4',
    title: 'text-sm font-medium',
    message: 'text-sm',
    button: 'h-4 w-4',
  },
  md: {
    container: 'p-4',
    icon: 'h-5 w-5',
    title: 'text-base font-medium',
    message: 'text-sm',
    button: 'h-5 w-5',
  },
  lg: {
    container: 'p-6',
    icon: 'h-6 w-6',
    title: 'text-lg font-medium',
    message: 'text-base',
    button: 'h-6 w-6',
  },
};

export default function ValidationFeedback({
  type,
  title,
  message,
  onDismiss,
  dismissible = false,
  className,
  size = 'md',
  showIcon = true,
}: ValidationFeedbackProps) {
  const Icon = iconMap[type];
  const colors = colorMap[type];
  const sizes = sizeMap[size];

  const messages = Array.isArray(message) ? message : [message];

  return (
    <div
      className={cn(
        'border rounded-lg animate-fade-in',
        colors.container,
        sizes.container,
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start">
        {showIcon && (
          <div className="flex-shrink-0">
            <Icon className={cn(sizes.icon, colors.icon)} />
          </div>
        )}

        <div className={cn('flex-1', showIcon && 'ml-3')}>
          {title && (
            <h3 className={cn(sizes.title, colors.title, 'mb-1')}>
              {title}
            </h3>
          )}

          <div className={cn(sizes.message, colors.message)}>
            {messages.length === 1 ? (
              <p>{messages[0]}</p>
            ) : (
              <ul className="space-y-1 list-disc list-inside">
                {messages.map((msg, index) => (
                  <li key={index}>{msg}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {dismissible && onDismiss && (
          <div className="flex-shrink-0 ml-4">
            <button
              type="button"
              onClick={onDismiss}
              className={cn(
                'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors touch-manipulation',
                colors.button
              )}
              aria-label="Dismiss"
            >
              <X className={sizes.button} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Inline field validation feedback
interface InlineValidationProps {
  error?: string;
  success?: string;
  warning?: string;
  info?: string;
  className?: string;
}

export function InlineValidation({
  error,
  success,
  warning,
  info,
  className,
}: InlineValidationProps) {
  const message = error || success || warning || info;

  if (!message) return null;

  const type = error ? 'error' : success ? 'success' : warning ? 'warning' : 'info';

  return (
    <ValidationFeedback
      type={type}
      message={message}
      size="sm"
      className={cn('mt-1', className)}
    />
  );
}

// Form summary validation (for displaying multiple errors at once)
interface FormValidationSummaryProps {
  errors: Record<string, string>;
  title?: string;
  onDismiss?: () => void;
  className?: string;
}

export function FormValidationSummary({
  errors,
  title = 'Please correct the following errors:',
  onDismiss,
  className,
}: FormValidationSummaryProps) {
  const errorMessages = Object.values(errors).filter(Boolean);

  if (errorMessages.length === 0) return null;

  return (
    <ValidationFeedback
      type="error"
      title={title}
      message={errorMessages}
      onDismiss={onDismiss}
      dismissible={!!onDismiss}
      className={className}
    />
  );
}

// Password strength indicator
interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const checks = [
    { label: 'At least 8 characters', test: (pw: string) => pw.length >= 8 },
    { label: 'Contains uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
    { label: 'Contains lowercase letter', test: (pw: string) => /[a-z]/.test(pw) },
    { label: 'Contains number', test: (pw: string) => /\d/.test(pw) },
    { label: 'Contains special character', test: (pw: string) => /[@$!%*?&]/.test(pw) },
  ];

  const passedChecks = checks.filter(check => check.test(password));
  const strength = passedChecks.length;

  const strengthConfig = {
    0: { label: 'Very Weak', color: 'bg-red-500', textColor: 'text-red-600' },
    1: { label: 'Weak', color: 'bg-red-400', textColor: 'text-red-600' },
    2: { label: 'Fair', color: 'bg-yellow-400', textColor: 'text-yellow-600' },
    3: { label: 'Good', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
    4: { label: 'Strong', color: 'bg-green-400', textColor: 'text-green-600' },
    5: { label: 'Very Strong', color: 'bg-green-500', textColor: 'text-green-600' },
  };

  const config = strengthConfig[strength as keyof typeof strengthConfig];

  if (!password) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Strength bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Password strength</span>
          <span className={cn('text-sm font-medium', config.textColor)}>
            {config.label}
          </span>
        </div>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={cn(
                'h-2 flex-1 rounded-full transition-colors duration-200',
                level <= strength ? config.color : 'bg-gray-200'
              )}
            />
          ))}
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="space-y-1">
        {checks.map((check, index) => {
          const passed = check.test(password);
          return (
            <div
              key={index}
              className={cn(
                'flex items-center space-x-2 text-sm transition-colors duration-200',
                passed ? 'text-green-600' : 'text-gray-500'
              )}
            >
              <div className={cn(
                'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors duration-200',
                passed
                  ? 'bg-green-500 border-green-500'
                  : 'border-gray-300'
              )}>
                {passed && (
                  <CheckCircle className="w-2.5 h-2.5 text-white" />
                )}
              </div>
              <span>{check.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}