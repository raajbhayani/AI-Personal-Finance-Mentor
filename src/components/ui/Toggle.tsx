'use client';

import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils/cn';

export interface ToggleOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
}

export interface ToggleProps {
  label?: string;
  error?: string;
  helperText?: string;
  options: ToggleOption[];
  value?: string;
  onChange?: (value: string) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
}

const Toggle = forwardRef<HTMLDivElement, ToggleProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      value,
      onChange,
      size = 'md',
      disabled = false,
      fullWidth = false,
    },
    ref
  ) => {
    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-sm',
      lg: 'px-6 py-4 text-base',
    };

    const getOptionColor = (option: ToggleOption, isSelected: boolean) => {
      if (disabled) {
        return 'bg-gray-100 text-gray-400 cursor-not-allowed';
      }

      if (isSelected) {
        switch (option.color) {
          case 'emerald':
            return 'bg-emerald-600 text-white shadow-md';
          case 'red':
            return 'bg-red-600 text-white shadow-md';
          case 'blue':
            return 'bg-blue-600 text-white shadow-md';
          default:
            return 'bg-blue-600 text-white shadow-md';
        }
      }

      return 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300';
    };

    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}

        <div
          ref={ref}
          className={cn(
            'inline-flex rounded-lg bg-gray-100 p-1 transition-all duration-200',
            fullWidth && 'w-full',
            disabled && 'opacity-50'
          )}
        >
          {options.map((option) => {
            const isSelected = value === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => !disabled && onChange?.(option.value)}
                className={cn(
                  'relative flex items-center justify-center rounded-md font-medium transition-all duration-200 transform',
                  sizes[size],
                  getOptionColor(option, isSelected),
                  fullWidth && 'flex-1',
                  !disabled && 'hover:scale-[1.02] active:scale-[0.98]',
                  disabled && 'cursor-not-allowed'
                )}
                disabled={disabled}
              >
                {option.icon && (
                  <span className="mr-2 flex-shrink-0">{option.icon}</span>
                )}
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>

        {(error || helperText) && (
          <div className="flex items-start space-x-1">
            {error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : (
              <p className="text-sm text-gray-500">{helperText}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';

export default Toggle;