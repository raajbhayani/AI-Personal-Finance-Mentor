'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { getDateRangePresets } from '@/lib/utils/exportUtils';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (dateRange: DateRange) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxDate?: Date;
  minDate?: Date;
}

interface DateRangePreset {
  label: string;
  range: DateRange;
}

export default function DateRangePicker({
  value,
  onChange,
  placeholder = "Select date range",
  className,
  disabled = false,
  maxDate = new Date(),
  minDate
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const presets = getDateRangePresets();
  const presetOptions: DateRangePreset[] = [
    { label: 'Today', range: presets.today },
    { label: 'Yesterday', range: presets.yesterday },
    { label: 'Last 7 days', range: presets.lastWeek },
    { label: 'Last 30 days', range: presets.lastMonth },
    { label: 'Last 3 months', range: presets.last3Months },
    { label: 'This month', range: presets.thisMonth },
    { label: 'This year', range: presets.thisYear },
    { label: 'Last year', range: presets.lastYear }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    // Check if current value matches any preset
    const matchingPreset = presetOptions.find(preset =>
      preset.range.startDate.toDateString() === value.startDate.toDateString() &&
      preset.range.endDate.toDateString() === value.endDate.toDateString()
    );

    if (matchingPreset) {
      setSelectedPreset(matchingPreset.label);
      setIsCustomMode(false);
    } else {
      setSelectedPreset(null);
      setIsCustomMode(true);
      setCustomStartDate(formatDateForInput(value.startDate));
      setCustomEndDate(formatDateForInput(value.endDate));
    }
  }, [value]);

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handlePresetSelect = (preset: DateRangePreset) => {
    onChange(preset.range);
    setSelectedPreset(preset.label);
    setIsCustomMode(false);
    setIsOpen(false);
  };

  const handleCustomDateChange = () => {
    if (customStartDate && customEndDate) {
      const startDate = new Date(customStartDate);
      const endDate = new Date(customEndDate);

      if (startDate <= endDate) {
        onChange({ startDate, endDate });
        setIsOpen(false);
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    onChange({ startDate: today, endDate: today });
    setSelectedPreset('Today');
    setIsCustomMode(false);
  };

  const getDisplayText = (): string => {
    if (selectedPreset) {
      return selectedPreset;
    }

    return `${formatDateForDisplay(value.startDate)} - ${formatDateForDisplay(value.endDate)}`;
  };

  const validateDateInput = (dateString: string, isEndDate: boolean = false): boolean => {
    const date = new Date(dateString);
    const otherDate = isEndDate ? new Date(customStartDate) : new Date(customEndDate);

    if (minDate && date < minDate) return false;
    if (maxDate && date > maxDate) return false;

    if (isEndDate && customStartDate && date < otherDate) return false;
    if (!isEndDate && customEndDate && date > otherDate) return false;

    return true;
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-lg shadow-sm",
          "hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
          isOpen && "ring-2 ring-blue-500 border-blue-500"
        )}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="truncate text-sm">
            {getDisplayText() || placeholder}
          </span>
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0">
          {(value.startDate || value.endDate) && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
          <ChevronDown className={cn(
            "w-4 h-4 text-gray-400 transition-transform",
            isOpen && "rotate-180"
          )} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2">
            {/* Preset options */}
            <div className="space-y-1 mb-3">
              <div className="text-xs font-medium text-gray-500 px-2 py-1">Quick Select</div>
              {presetOptions.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className={cn(
                    "w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-50 transition-colors",
                    selectedPreset === preset.label && "bg-blue-50 text-blue-700"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom date range */}
            <div className="border-t border-gray-100 pt-3">
              <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-2">Custom Range</div>

              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => {
                      setCustomStartDate(e.target.value);
                      setIsCustomMode(true);
                      setSelectedPreset(null);
                    }}
                    max={maxDate ? formatDateForInput(maxDate) : undefined}
                    min={minDate ? formatDateForInput(minDate) : undefined}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => {
                      setCustomEndDate(e.target.value);
                      setIsCustomMode(true);
                      setSelectedPreset(null);
                    }}
                    max={maxDate ? formatDateForInput(maxDate) : undefined}
                    min={customStartDate || (minDate ? formatDateForInput(minDate) : undefined)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCustomDateChange}
                  disabled={!customStartDate || !customEndDate || !validateDateInput(customStartDate) || !validateDateInput(customEndDate, true)}
                  className="w-full px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Apply Custom Range
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Utility hook for managing date range state
export const useDateRange = (initialRange?: DateRange) => {
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    if (initialRange) return initialRange;

    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    return {
      startDate: lastMonth,
      endDate: today
    };
  });

  const setPreset = (presetName: keyof ReturnType<typeof getDateRangePresets>) => {
    const presets = getDateRangePresets();
    setDateRange(presets[presetName]);
  };

  const isValidRange = (range: DateRange): boolean => {
    return range.startDate <= range.endDate;
  };

  const getDaysDifference = (): number => {
    const diffTime = Math.abs(dateRange.endDate.getTime() - dateRange.startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return {
    dateRange,
    setDateRange,
    setPreset,
    isValidRange: isValidRange(dateRange),
    daysDifference: getDaysDifference()
  };
};