'use client';

import React, { forwardRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  value?: Date;
  onChange?: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  showCalendar?: boolean;
}

const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      value,
      onChange,
      minDate,
      maxDate,
      showCalendar = true,
      disabled,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(value || new Date());

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    };

    const handleDateSelect = (date: Date) => {
      onChange?.(date);
      setIsOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const date = new Date(inputValue);

      if (!isNaN(date.getTime())) {
        onChange?.(date);
      }
    };

    const isDateDisabled = (date: Date) => {
      if (minDate && date < minDate) return true;
      if (maxDate && date > maxDate) return true;
      return false;
    };

    const getDaysInMonth = (date: Date) => {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
      return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const renderCalendar = () => {
      const daysInMonth = getDaysInMonth(currentMonth);
      const firstDay = getFirstDayOfMonth(currentMonth);
      const days = [];

      // Previous month's trailing days
      for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
      }

      // Current month's days
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const isSelected = value &&
          date.getDate() === value.getDate() &&
          date.getMonth() === value.getMonth() &&
          date.getFullYear() === value.getFullYear();
        const isDisabled = isDateDisabled(date);
        const isToday = new Date().toDateString() === date.toDateString();

        days.push(
          <button
            key={day}
            type="button"
            onClick={() => !isDisabled && handleDateSelect(date)}
            className={cn(
              'w-8 h-8 text-sm rounded-md transition-colors duration-200',
              'hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
              isSelected && 'bg-blue-600 text-white hover:bg-blue-700',
              isToday && !isSelected && 'bg-blue-100 text-blue-700 font-semibold',
              isDisabled && 'text-gray-300 cursor-not-allowed hover:bg-transparent',
              !isSelected && !isToday && !isDisabled && 'text-gray-700'
            )}
            disabled={isDisabled}
          >
            {day}
          </button>
        );
      }

      return days;
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
      setCurrentMonth(prev => {
        const newMonth = new Date(prev);
        if (direction === 'prev') {
          newMonth.setMonth(newMonth.getMonth() - 1);
        } else {
          newMonth.setMonth(newMonth.getMonth() + 1);
        }
        return newMonth;
      });
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
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>

          <input
            type="date"
            className={cn(
              'block w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 py-3 text-gray-900 placeholder-gray-500 transition-all duration-200',
              'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
              'hover:border-gray-400',
              'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
              error && 'border-red-300 focus:border-red-500 focus:ring-red-500/20',
              className
            )}
            value={value ? value.toISOString().split('T')[0] : ''}
            onChange={handleInputChange}
            disabled={disabled}
            ref={ref}
            {...props}
          />

          {showCalendar && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              disabled={disabled}
            >
              <Calendar className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Calendar Dropdown */}
        {isOpen && showCalendar && (
          <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-64">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => navigateMonth('prev')}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors duration-200"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>

              <h3 className="text-lg font-semibold text-gray-900">
                {currentMonth.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </h3>

              <button
                type="button"
                onClick={() => navigateMonth('next')}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors duration-200"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="w-8 h-8 flex items-center justify-center text-xs font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
            </div>

            {/* Today Button */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => handleDateSelect(new Date())}
                className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Today
              </button>
            </div>
          </div>
        )}

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

DatePicker.displayName = 'DatePicker';

export default DatePicker;