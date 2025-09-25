'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, Calculator, DollarSign, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

interface BudgetCategory {
  category: string;
  budgetedAmount: number;
}

interface BudgetFormData {
  name: string;
  description: string;
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  categories: BudgetCategory[];
  alertThreshold: number;
  notifications: {
    enabled: boolean;
    thresholds: number[];
  };
  tags: string[];
}

interface CreateBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BudgetFormData) => Promise<void>;
  initialData?: Partial<BudgetFormData>;
}

const EXPENSE_CATEGORIES = [
  { value: 'Food & Dining', label: 'Food & Dining', icon: '🍽️' },
  { value: 'Transportation', label: 'Transportation', icon: '🚗' },
  { value: 'Shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'Entertainment', label: 'Entertainment', icon: '🎬' },
  { value: 'Bills & Utilities', label: 'Bills & Utilities', icon: '⚡' },
  { value: 'Healthcare', label: 'Healthcare', icon: '🏥' },
  { value: 'Education', label: 'Education', icon: '📚' },
  { value: 'Travel', label: 'Travel', icon: '✈️' },
  { value: 'Housing', label: 'Housing', icon: '🏠' },
  { value: 'Insurance', label: 'Insurance', icon: '🛡️' },
  { value: 'Other', label: 'Other', icon: '📦' }
];

const BUDGET_PERIODS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' }
];

const DEFAULT_NOTIFICATION_THRESHOLDS = [50, 75, 90, 100];

export default function CreateBudgetModal({
  isOpen,
  onClose,
  onSubmit,
  initialData
}: CreateBudgetModalProps) {
  const [formData, setFormData] = useState<BudgetFormData>({
    name: '',
    description: '',
    period: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    categories: [
      { category: 'Food & Dining', budgetedAmount: 0 },
      { category: 'Transportation', budgetedAmount: 0 },
      { category: 'Entertainment', budgetedAmount: 0 }
    ],
    alertThreshold: 80,
    notifications: {
      enabled: true,
      thresholds: DEFAULT_NOTIFICATION_THRESHOLDS
    },
    tags: [],
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Calculate end date based on period and start date
  React.useEffect(() => {
    if (formData.startDate && !initialData?.endDate) {
      const startDate = new Date(formData.startDate);
      let endDate = new Date(startDate);

      switch (formData.period) {
        case 'weekly':
          endDate.setDate(startDate.getDate() + 7);
          break;
        case 'monthly':
          endDate.setMonth(startDate.getMonth() + 1);
          break;
        case 'quarterly':
          endDate.setMonth(startDate.getMonth() + 3);
          break;
        case 'yearly':
          endDate.setFullYear(startDate.getFullYear() + 1);
          break;
      }

      setFormData(prev => ({
        ...prev,
        endDate: endDate.toISOString().split('T')[0]
      }));
    }
  }, [formData.period, formData.startDate, initialData?.endDate]);

  const totalBudget = formData.categories.reduce((sum, cat) => sum + cat.budgetedAmount, 0);

  const handleInputChange = (field: keyof BudgetFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCategoryChange = (index: number, field: keyof BudgetCategory, value: any) => {
    const updatedCategories = [...formData.categories];
    updatedCategories[index] = { ...updatedCategories[index], [field]: value };
    setFormData(prev => ({ ...prev, categories: updatedCategories }));
  };

  const addCategory = () => {
    const availableCategories = EXPENSE_CATEGORIES.filter(
      cat => !formData.categories.find(existing => existing.category === cat.value)
    );

    if (availableCategories.length > 0) {
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, { category: availableCategories[0].value, budgetedAmount: 0 }]
      }));
    }
  };

  const removeCategory = (index: number) => {
    if (formData.categories.length > 1) {
      const updatedCategories = formData.categories.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, categories: updatedCategories }));
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim()) && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Budget name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Budget name cannot exceed 100 characters';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description cannot exceed 500 characters';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    } else if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (totalBudget <= 0) {
      newErrors.categories = 'At least one category must have a budget amount greater than 0';
    }

    if (formData.alertThreshold < 0 || formData.alertThreshold > 100) {
      newErrors.alertThreshold = 'Alert threshold must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      onClose();
      // Reset form
      setFormData({
        name: '',
        description: '',
        period: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        categories: [
          { category: 'Food & Dining', budgetedAmount: 0 },
          { category: 'Transportation', budgetedAmount: 0 },
          { category: 'Entertainment', budgetedAmount: 0 }
        ],
        alertThreshold: 80,
        notifications: {
          enabled: true,
          thresholds: DEFAULT_NOTIFICATION_THRESHOLDS
        },
        tags: []
      });
      setErrors({});
    } catch (error) {
      console.error('Error creating budget:', error);
      setErrors({ submit: 'Failed to create budget. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl h-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Create Budget</h3>
              <p className="text-sm opacity-90">Set spending limits to achieve your financial goals</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors duration-200"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Monthly Expenses, Q1 Budget"
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors',
                  errors.name ? 'border-red-300' : 'border-gray-300'
                )}
                maxLength={100}
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period *
              </label>
              <select
                value={formData.period}
                onChange={(e) => handleInputChange('period', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {BUDGET_PERIODS.map(period => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the purpose and goals of this budget..."
              rows={2}
              className={cn(
                'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none',
                errors.description ? 'border-red-300' : 'border-gray-300'
              )}
              maxLength={500}
            />
            {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors',
                  errors.startDate ? 'border-red-300' : 'border-gray-300'
                )}
              />
              {errors.startDate && <p className="text-red-600 text-sm mt-1">{errors.startDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                min={formData.startDate}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors',
                  errors.endDate ? 'border-red-300' : 'border-gray-300'
                )}
              />
              {errors.endDate && <p className="text-red-600 text-sm mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* Budget Categories */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700 flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                Budget Categories *
              </label>
              <button
                type="button"
                onClick={addCategory}
                disabled={formData.categories.length >= EXPENSE_CATEGORIES.length}
                className="flex items-center px-3 py-1 text-sm bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Category
              </button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {formData.categories.map((category, index) => {
                const categoryInfo = EXPENSE_CATEGORIES.find(c => c.value === category.category);
                return (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-lg">{categoryInfo?.icon}</span>

                    <div className="flex-1">
                      <select
                        value={category.category}
                        onChange={(e) => handleCategoryChange(index, 'category', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
                      >
                        {EXPENSE_CATEGORIES.map(cat => (
                          <option
                            key={cat.value}
                            value={cat.value}
                            disabled={formData.categories.some((existing, i) => i !== index && existing.category === cat.value)}
                          >
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-32">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={category.budgetedAmount}
                        onChange={(e) => handleCategoryChange(index, 'budgetedAmount', parseFloat(e.target.value) || 0)}
                        placeholder="$0.00"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 text-right"
                      />
                    </div>

                    {formData.categories.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCategory(index)}
                        className="p-1 text-red-500 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {errors.categories && <p className="text-red-600 text-sm mt-1">{errors.categories}</p>}

            {/* Total Budget Summary */}
            <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-emerald-800">Total Budget:</span>
                <span className="text-lg font-bold text-emerald-800">
                  ${totalBudget.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Alert Threshold */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alert Threshold (%)
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={formData.alertThreshold}
                onChange={(e) => handleInputChange('alertThreshold', parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium text-gray-700 w-12">
                {formData.alertThreshold}%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Get notified when spending reaches this percentage of your budget
            </p>
            {errors.alertThreshold && <p className="text-red-600 text-sm mt-1">{errors.alertThreshold}</p>}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (Optional)
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <button
                type="button"
                onClick={addTag}
                disabled={!tagInput.trim() || formData.tags.length >= 10}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-emerald-600 hover:text-emerald-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || totalBudget <= 0}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Budget'}
          </button>
        </div>
      </div>
    </div>
  );
}