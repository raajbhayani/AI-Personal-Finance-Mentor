'use client';

import React, { useState } from 'react';
import { Target, Calendar, DollarSign, TrendingUp, AlertCircle, X } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import CurrencyInput from '../ui/CurrencyInput';
import DatePicker from '../ui/DatePicker';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { validateField } from '../../lib/utils/validation';

interface GoalFormData {
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  category: string;
  priority: 'low' | 'medium' | 'high';
  isRecurring: boolean;
  reminderFrequency: 'weekly' | 'monthly' | 'quarterly';
}

interface GoalCreationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GoalFormData) => Promise<void>;
  initialData?: Partial<GoalFormData>;
}

const goalCategories = [
  { value: 'emergency-fund', label: 'Emergency Fund', icon: '🛡️' },
  { value: 'vacation', label: 'Vacation', icon: '✈️' },
  { value: 'house-down-payment', label: 'House Down Payment', icon: '🏠' },
  { value: 'car-purchase', label: 'Car Purchase', icon: '🚗' },
  { value: 'retirement', label: 'Retirement', icon: '👴' },
  { value: 'education', label: 'Education', icon: '🎓' },
  { value: 'debt-payoff', label: 'Debt Payoff', icon: '💳' },
  { value: 'investment', label: 'Investment', icon: '📈' },
  { value: 'wedding', label: 'Wedding', icon: '💒' },
  { value: 'business', label: 'Business', icon: '💼' },
  { value: 'other', label: 'Other', icon: '🎯' },
];

const priorityOptions = [
  { value: 'low', label: 'Low Priority', color: 'text-gray-600' },
  { value: 'medium', label: 'Medium Priority', color: 'text-yellow-600' },
  { value: 'high', label: 'High Priority', color: 'text-red-600' },
];

const reminderOptions = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
];

export default function GoalCreationForm({
  isOpen,
  onClose,
  onSubmit,
  initialData
}: GoalCreationFormProps) {
  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    description: '',
    targetAmount: 0,
    currentAmount: 0,
    targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    category: '',
    priority: 'medium',
    isRecurring: false,
    reminderFrequency: 'monthly',
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof GoalFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Title validation
    const titleError = validateField(formData.title, {
      required: true,
      minLength: 3,
      maxLength: 100,
    });
    if (titleError) {
      newErrors.title = titleError;
    }

    // Target amount validation
    if (!formData.targetAmount || formData.targetAmount <= 0) {
      newErrors.targetAmount = 'Target amount must be greater than $0';
    }

    // Current amount validation
    if (formData.currentAmount < 0) {
      newErrors.currentAmount = 'Current amount cannot be negative';
    }

    if (formData.currentAmount > formData.targetAmount) {
      newErrors.currentAmount = 'Current amount cannot exceed target amount';
    }

    // Target date validation
    if (!formData.targetDate) {
      newErrors.targetDate = 'Target date is required';
    } else if (formData.targetDate <= new Date()) {
      newErrors.targetDate = 'Target date must be in the future';
    }

    // Category validation
    if (!formData.category) {
      newErrors.category = 'Please select a goal category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateMonthsToGoal = () => {
    const now = new Date();
    const target = new Date(formData.targetDate);
    const diffTime = Math.abs(target.getTime() - now.getTime());
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return diffMonths;
  };

  const calculateMonthlySavingsNeeded = () => {
    const remainingAmount = formData.targetAmount - formData.currentAmount;
    const monthsToGoal = calculateMonthsToGoal();
    return monthsToGoal > 0 ? remainingAmount / monthsToGoal : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await onSubmit(formData);
      onClose();
      // Reset form
      setFormData({
        title: '',
        description: '',
        targetAmount: 0,
        currentAmount: 0,
        targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        category: '',
        priority: 'medium',
        isRecurring: false,
        reminderFrequency: 'monthly',
      });
    } catch (error) {
      console.error('Error creating goal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const progressPercentage = formData.targetAmount > 0
    ? Math.min((formData.currentAmount / formData.targetAmount) * 100, 100)
    : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Financial Goal' : 'Create New Financial Goal'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Goal Title */}
        <Input
          label="Goal Title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          error={errors.title}
          placeholder="e.g., Emergency Fund, Vacation to Japan"
          required
        />

        {/* Goal Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Description (Optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe your goal and why it's important to you..."
            rows={3}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-gray-900 placeholder-gray-500 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-gray-400 resize-none"
            maxLength={500}
          />
        </div>

        {/* Amount Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CurrencyInput
            label="Target Amount"
            value={formData.targetAmount}
            onChange={(value) => handleInputChange('targetAmount', value)}
            error={errors.targetAmount}
            placeholder="0.00"
            required
          />

          <CurrencyInput
            label="Current Amount"
            value={formData.currentAmount}
            onChange={(value) => handleInputChange('currentAmount', value)}
            error={errors.currentAmount}
            placeholder="0.00"
          />
        </div>

        {/* Progress Preview */}
        {formData.targetAmount > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Current Progress</span>
              <span className="text-sm text-gray-600">{progressPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Category and Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Category"
            options={goalCategories}
            value={formData.category}
            onChange={(value) => handleInputChange('category', value)}
            error={errors.category}
            placeholder="Select a category"
            required
          />

          <Select
            label="Priority"
            options={priorityOptions}
            value={formData.priority}
            onChange={(value) => handleInputChange('priority', value)}
            required
          />
        </div>

        {/* Target Date */}
        <DatePicker
          label="Target Date"
          value={formData.targetDate}
          onChange={(date) => handleInputChange('targetDate', date)}
          error={errors.targetDate}
          minDate={new Date()}
          required
        />

        {/* Savings Calculation */}
        {formData.targetAmount > formData.currentAmount && formData.targetDate && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-start space-x-3">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  Savings Plan
                </h4>
                <p className="text-sm text-blue-700">
                  To reach your goal, you'll need to save approximately{' '}
                  <span className="font-semibold">
                    ${calculateMonthlySavingsNeeded().toFixed(2)} per month
                  </span>{' '}
                  for the next {calculateMonthsToGoal()} months.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Reminder Settings */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isRecurring"
              checked={formData.isRecurring}
              onChange={(e) => handleInputChange('isRecurring', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
              Set up progress reminders
            </label>
          </div>

          {formData.isRecurring && (
            <Select
              label="Reminder Frequency"
              options={reminderOptions}
              value={formData.reminderFrequency}
              onChange={(value) => handleInputChange('reminderFrequency', value)}
            />
          )}
        </div>

        {/* Form Actions */}
        <div className="flex space-x-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isLoading}
            disabled={isLoading}
            className="flex-1"
          >
            {initialData ? 'Update Goal' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}