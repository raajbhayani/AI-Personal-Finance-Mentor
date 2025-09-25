'use client';

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Plus, X, DollarSign, Calendar, Hash } from 'lucide-react';
import Modal from '../ui/Modal';
import { InputField, SelectField, TextAreaField } from '../ui/FormField';
import ValidationFeedback, { FormValidationSummary } from '../ui/ValidationFeedback';
import { createTransactionSchema, type CreateTransactionData } from '@/lib/validation/schemas';
import { useFormValidation } from '@/lib/hooks/useFormValidation';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTransactionData) => Promise<void>;
  initialData?: Partial<CreateTransactionData>;
}

const categoryOptions = [
  { value: 'food_dining', label: '🍽️ Food & Dining' },
  { value: 'transportation', label: '🚗 Transportation' },
  { value: 'shopping', label: '🛍️ Shopping' },
  { value: 'entertainment', label: '🎬 Entertainment' },
  { value: 'bills_utilities', label: '⚡ Bills & Utilities' },
  { value: 'healthcare', label: '🏥 Healthcare' },
  { value: 'education', label: '📚 Education' },
  { value: 'travel', label: '✈️ Travel' },
  { value: 'business', label: '💼 Business' },
  { value: 'gifts_donations', label: '🎁 Gifts & Donations' },
  { value: 'investments', label: '📈 Investments' },
  { value: 'other', label: '📦 Other' },
];

const typeOptions = [
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
];

export default function AddTransactionModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: AddTransactionModalProps) {
  const [serverError, setServerError] = useState<string>('');
  const [tagInput, setTagInput] = useState('');

  const {
    values,
    setValue,
    isValid,
    errors,
    isSubmitting,
    handleSubmit,
    setError,
    clearErrors,
    getFieldProps,
    reset,
  } = useFormValidation(createTransactionSchema, {
    description: '',
    amount: 0,
    type: 'expense' as 'income' | 'expense',
    category: 'other' as any,
    date: new Date().toISOString().split('T')[0],
    tags: [],
    notes: '',
    ...initialData,
  }, {
    validateOnChange: true,
    validateOnBlur: true,
    debounceDelay: 300,
  });

  const addTag = () => {
    if (tagInput.trim() && !values.tags.includes(tagInput.trim())) {
      setValue('tags', [...values.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue('tags', values.tags.filter(tag => tag !== tagToRemove));
  };

  const handleFormSubmit = async (data: CreateTransactionData) => {
    setServerError('');

    try {
      await onSubmit(data);
      onClose();
      reset();
    } catch (error) {
      console.error('Error submitting transaction:', error);
      setServerError(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Transaction' : 'Add Transaction'}
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {serverError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{serverError}</p>
          </div>
        )}

        <FormValidationSummary errors={errors} />

        {/* Transaction Type Toggle */}
        <SelectField
          label="Transaction Type"
          options={typeOptions}
          {...getFieldProps('type')}
          onChange={(value) => {
            setValue('type', value);
            setValue('category', '');
          }}
          required
        />

        {/* Amount Input */}
        <InputField
          label="Amount"
          type="number"
          step="0.01"
          min="0"
          {...getFieldProps('amount')}
          placeholder="0.00"
          required
        />

        {/* Description Input */}
        <InputField
          label="Description"
          {...getFieldProps('description')}
          placeholder="Enter transaction description"
          maxLength={100}
          required
        />

        {/* Category Selection */}
        <SelectField
          label="Category"
          options={categoryOptions}
          {...getFieldProps('category')}
          placeholder="Select a category"
          required
        />

        {/* Date Picker */}
        <InputField
          label="Date"
          type="date"
          {...getFieldProps('date')}
          max={new Date().toISOString().split('T')[0]}
          required
        />

        {/* Notes Input */}
        <TextAreaField
          label="Notes (Optional)"
          {...getFieldProps('notes')}
          placeholder="Add any additional notes..."
          rows={3}
          maxLength={500}
        />

        {/* Tags Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Tags (Optional)
          </label>
          <div className="flex space-x-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add a tag"
              className="flex-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-gray-900 placeholder-gray-500 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-gray-400"
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
              disabled={!tagInput.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {values.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {values.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-blue-500 hover:text-blue-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <ValidationFeedback error={serverError} />

        {/* Form Actions */}
        <div className="flex space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : (initialData ? 'Update Transaction' : 'Add Transaction')}
          </button>
        </div>
      </form>
    </Modal>
  );
}