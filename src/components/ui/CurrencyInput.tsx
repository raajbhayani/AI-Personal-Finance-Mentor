'use client';

import React, { forwardRef, useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

export interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  currency?: string;
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      currency = 'USD',
      value = 0,
      onChange,
      min = 0,
      max,
      disabled,
      placeholder = '0.00',
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
      if (!isFocused) {
        setDisplayValue(value ? formatCurrency(value) : '');
      }
    }, [value, isFocused]);

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    const parseCurrency = (value: string) => {
      const numericValue = value.replace(/[^0-9.]/g, '');
      return parseFloat(numericValue) || 0;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const numericValue = parseCurrency(inputValue);

      if (max && numericValue > max) return;
      if (numericValue < min) return;

      setDisplayValue(inputValue);
      onChange?.(numericValue);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      setDisplayValue(value > 0 ? value.toString() : '');
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setDisplayValue(value ? formatCurrency(value) : '');
      props.onBlur?.(e);
    };

    const getCurrencySymbol = () => {
      switch (currency) {
        case 'USD':
          return '$';
        case 'EUR':
          return '€';
        case 'GBP':
          return '£';
        case 'JPY':
          return '¥';
        default:
          return '$';
      }
    };

    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 text-sm font-medium">
              {getCurrencySymbol()}
            </span>
          </div>

          <input
            type="text"
            inputMode="decimal"
            className={cn(
              'block w-full rounded-lg border border-gray-300 bg-white pl-8 pr-3 py-3 text-gray-900 placeholder-gray-500 transition-all duration-200',
              'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
              'hover:border-gray-400',
              'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
              error && 'border-red-300 focus:border-red-500 focus:ring-red-500/20',
              isFocused && !error && 'shadow-sm',
              className
            )}
            value={displayValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            ref={ref}
            {...props}
          />
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

CurrencyInput.displayName = 'CurrencyInput';

export default CurrencyInput;