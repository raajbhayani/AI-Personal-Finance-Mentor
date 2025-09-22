'use client';

import React, { forwardRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      options,
      value,
      onChange,
      placeholder = 'Select an option',
      searchable = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const selectedOption = options.find(option => option.value === value);

    const filteredOptions = searchable && searchTerm
      ? options.filter(option =>
          option.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : options;

    const handleSelect = (optionValue: string) => {
      onChange?.(optionValue);
      setIsOpen(false);
      setSearchTerm('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(!isOpen);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
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
          {/* Hidden native select for form submission */}
          <select
            ref={ref}
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            className="sr-only"
            disabled={disabled}
            {...props}
          >
            <option value="">{placeholder}</option>
            {options.map(option => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Custom Select Button */}
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            className={cn(
              'relative w-full rounded-lg border border-gray-300 bg-white pl-3 pr-10 py-3 text-left transition-all duration-200',
              'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
              'hover:border-gray-400',
              'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
              error && 'border-red-300 focus:border-red-500 focus:ring-red-500/20',
              className
            )}
            disabled={disabled}
          >
            <span className="flex items-center">
              {selectedOption?.icon && (
                <span className="mr-2 flex-shrink-0">{selectedOption.icon}</span>
              )}
              <span className={cn(
                'block truncate',
                selectedOption ? 'text-gray-900' : 'text-gray-500'
              )}>
                {selectedOption ? selectedOption.label : placeholder}
              </span>
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronDown
                className={cn(
                  'h-5 w-5 text-gray-400 transition-transform duration-200',
                  isOpen && 'transform rotate-180'
                )}
              />
            </span>
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              {searchable && (
                <div className="p-2 border-b border-gray-200">
                  <input
                    type="text"
                    placeholder="Search options..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    autoFocus
                  />
                </div>
              )}

              <div className="py-1">
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No options found
                  </div>
                ) : (
                  filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => !option.disabled && handleSelect(option.value)}
                      className={cn(
                        'relative w-full flex items-center px-3 py-2 text-sm text-left transition-colors duration-200',
                        'hover:bg-gray-100 focus:outline-none focus:bg-gray-100',
                        option.disabled && 'text-gray-400 cursor-not-allowed hover:bg-transparent',
                        value === option.value && 'bg-blue-50 text-blue-700'
                      )}
                      disabled={option.disabled}
                    >
                      {option.icon && (
                        <span className="mr-2 flex-shrink-0">{option.icon}</span>
                      )}
                      <span className="flex-1 truncate">{option.label}</span>
                      {value === option.value && (
                        <Check className="h-4 w-4 text-blue-600 ml-2 flex-shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
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

Select.displayName = 'Select';

export default Select;