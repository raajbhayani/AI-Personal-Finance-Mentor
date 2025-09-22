'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Plus, X, Save } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import CurrencyInput from '../ui/CurrencyInput';
import DatePicker from '../ui/DatePicker';
import Select, { SelectOption } from '../ui/Select';
import Toggle from '../ui/Toggle';
import Button from '../ui/Button';
import { validateField } from '../../lib/utils/validation';
import { Transaction } from './TransactionTable';

interface TransactionFormData {
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: Date;
  notes?: string;
  tags: string[];
  status: 'completed' | 'pending' | 'failed';
}

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  transaction: Transaction | null;
}

const incomeCategories: SelectOption[] = [
  { value: 'salary', label: 'Salary', icon: '💼' },
  { value: 'freelance', label: 'Freelance', icon: '💻' },
  { value: 'business', label: 'Business', icon: '🏢' },
  { value: 'investment', label: 'Investment', icon: '📈' },
  { value: 'rental', label: 'Rental Income', icon: '🏠' },
  { value: 'dividend', label: 'Dividend', icon: '💰' },
  { value: 'bonus', label: 'Bonus', icon: '🎁' },
  { value: 'other-income', label: 'Other Income', icon: '💵' },
];

const expenseCategories: SelectOption[] = [
  { value: 'food', label: 'Food & Dining', icon: '🍽️' },
  { value: 'transport', label: 'Transportation', icon: '🚗' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { value: 'bills', label: 'Bills & Utilities', icon: '⚡' },
  { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
  { value: 'education', label: 'Education', icon: '📚' },
  { value: 'travel', label: 'Travel', icon: '✈️' },
  { value: 'home', label: 'Home & Garden', icon: '🏠' },
  { value: 'insurance', label: 'Insurance', icon: '🛡️' },
  { value: 'fitness', label: 'Fitness & Sports', icon: '💪' },
  { value: 'other-expense', label: 'Other Expense', icon: '📦' },
];

const typeOptions = [
  {
    value: 'income',
    label: 'Income',
    icon: <TrendingUp className="h-4 w-4" />,
    color: 'emerald'
  },
  {
    value: 'expense',
    label: 'Expense',
    icon: <TrendingDown className="h-4 w-4" />,
    color: 'red'
  },
];

const statusOptions = [
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
];

export default function EditTransactionModal({
  isOpen,
  onClose,
  onSubmit,
  transaction,
}: EditTransactionModalProps) {
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'expense',
    amount: 0,
    description: '',
    category: '',
    date: new Date(),
    notes: '',
    tags: [],
    status: 'completed',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when transaction changes
  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        category: transaction.category,
        date: new Date(transaction.date),
        notes: transaction.notes || '',
        tags: transaction.tags || [],
        status: transaction.status,
      });
      setHasChanges(false);
    }
  }, [transaction]);

  const categories = formData.type === 'income' ? incomeCategories : expenseCategories;

  const handleInputChange = (field: keyof TransactionFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
      setHasChanges(true);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
    setHasChanges(true);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    const descriptionError = validateField(formData.description, {
      required: true,
      minLength: 2,
      maxLength: 100,
    });
    if (descriptionError) {
      newErrors.description = descriptionError;
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      setHasChanges(false);
    } catch (error) {
      console.error('Error updating transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      const confirmClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      );
      if (!confirmClose) return;
    }
    onClose();
    setHasChanges(false);
  };

  if (!transaction) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Transaction"
      size="lg"
      closeOnBackdrop={!hasChanges}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Transaction Type Toggle */}
        <Toggle
          label="Transaction Type"
          options={typeOptions}
          value={formData.type}
          onChange={(value) => {
            handleInputChange('type', value);
            // Reset category when type changes
            handleInputChange('category', '');
          }}
          fullWidth
        />

        {/* Amount Input */}
        <CurrencyInput
          label="Amount"
          value={formData.amount}
          onChange={(value) => handleInputChange('amount', value)}
          error={errors.amount}
          placeholder="0.00"
          required
        />

        {/* Description Input */}
        <Input
          label="Description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          error={errors.description}
          placeholder="Enter transaction description"
          maxLength={100}
          required
        />

        {/* Category Selection */}
        <Select
          label="Category"
          options={categories}
          value={formData.category}
          onChange={(value) => handleInputChange('category', value)}
          error={errors.category}
          placeholder="Select a category"
          searchable
          required
        />

        {/* Date Picker */}
        <DatePicker
          label="Date"
          value={formData.date}
          onChange={(date) => handleInputChange('date', date)}
          error={errors.date}
          maxDate={new Date()}
          required
        />

        {/* Status Selection */}
        <Select
          label="Status"
          options={statusOptions}
          value={formData.status}
          onChange={(value) => handleInputChange('status', value)}
          placeholder="Select status"
          required
        />

        {/* Notes Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Add any additional notes..."
            rows={3}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-gray-900 placeholder-gray-500 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-gray-400 resize-none"
            maxLength={500}
          />
        </div>

        {/* Tags Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Tags (Optional)
          </label>
          <div className="flex space-x-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add a tag"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addTag}
              disabled={!tagInput.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag, index) => (
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

        {/* Change indicator */}
        {hasChanges && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-700">
              You have unsaved changes to this transaction.
            </p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex space-x-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isLoading}
            disabled={isLoading || !hasChanges}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            Update Transaction
          </Button>
        </div>
      </form>
    </Modal>
  );
}