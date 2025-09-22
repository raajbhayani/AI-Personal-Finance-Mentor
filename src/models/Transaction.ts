import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  description: string;
  category: string;
  subcategory?: string;
  type: 'income' | 'expense';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  date: Date;
  tags?: string[];
  location?: string;
  notes?: string;
  receipt?: string;
  attachments?: string[];
  paymentMethod?: 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'digital_wallet' | 'check' | 'other';
  currency: string;
  exchangeRate?: number;
  merchant?: string;
  isRecurring: boolean;
  recurringDetails?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    endDate?: Date;
    nextDue?: Date;
    parentTransactionId?: mongoose.Types.ObjectId;
  };
  parentTransactionId?: mongoose.Types.ObjectId;
  linkedGoalId?: mongoose.Types.ObjectId;
  budgetId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
      validate: {
        validator: function (value: number) {
          return Number.isFinite(value) && value > 0;
        },
        message: 'Amount must be a positive number',
      },
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [1, 'Description cannot be empty'],
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: [
        'Food & Dining',
        'Transportation',
        'Shopping',
        'Entertainment',
        'Bills & Utilities',
        'Healthcare',
        'Education',
        'Travel',
        'Investment',
        'Salary',
        'Freelance',
        'Business',
        'Gifts',
        'Housing',
        'Insurance',
        'Taxes',
        'Savings',
        'Debt Payment',
        'Other',
      ],
      index: true,
    },
    subcategory: {
      type: String,
      trim: true,
      maxlength: [50, 'Subcategory cannot exceed 50 characters'],
    },
    type: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: ['income', 'expense'],
      index: true,
    },
    status: {
      type: String,
      required: [true, 'Transaction status is required'],
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'completed',
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Transaction date is required'],
      default: Date.now,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (tags: string[]) {
          return tags.length <= 10;
        },
        message: 'Cannot have more than 10 tags',
      },
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, 'Location cannot exceed 100 characters'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    receipt: {
      type: String,
      trim: true,
    },
    attachments: {
      type: [String],
      default: [],
      validate: {
        validator: function (attachments: string[]) {
          return attachments.length <= 5;
        },
        message: 'Cannot have more than 5 attachments',
      },
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'digital_wallet', 'check', 'other'],
      trim: true,
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      default: 'USD',
      uppercase: true,
      minlength: [3, 'Currency code must be 3 characters'],
      maxlength: [3, 'Currency code must be 3 characters'],
    },
    exchangeRate: {
      type: Number,
      min: [0, 'Exchange rate cannot be negative'],
      validate: {
        validator: function (value: number) {
          return !value || (Number.isFinite(value) && value > 0);
        },
        message: 'Exchange rate must be a positive number',
      },
    },
    merchant: {
      type: String,
      trim: true,
      maxlength: [100, 'Merchant name cannot exceed 100 characters'],
    },
    isRecurring: {
      type: Boolean,
      default: false,
      index: true,
    },
    recurringDetails: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
        required: function (this: ITransaction) {
          return this.isRecurring;
        },
      },
      endDate: {
        type: Date,
      },
      nextDue: {
        type: Date,
      },
      parentTransactionId: {
        type: Schema.Types.ObjectId,
        ref: 'Transaction',
      },
    },
    parentTransactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
      index: true,
    },
    linkedGoalId: {
      type: Schema.Types.ObjectId,
      ref: 'Goal',
      index: true,
    },
    budgetId: {
      type: Schema.Types.ObjectId,
      ref: 'Budget',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for common queries
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, category: 1, date: -1 });
TransactionSchema.index({ userId: 1, type: 1, date: -1 });
TransactionSchema.index({ userId: 1, status: 1, date: -1 });

// Single field indexes
TransactionSchema.index({ date: -1 });
TransactionSchema.index({ amount: 1 });
TransactionSchema.index({ merchant: 1 });
TransactionSchema.index({ 'recurringDetails.nextDue': 1 });

// Text index for search functionality
TransactionSchema.index({
  description: 'text',
  notes: 'text',
  merchant: 'text',
  category: 'text',
  tags: 'text',
});

// Sparse indexes for optional fields
TransactionSchema.index({ linkedGoalId: 1 }, { sparse: true });
TransactionSchema.index({ budgetId: 1 }, { sparse: true });
TransactionSchema.index({ parentTransactionId: 1 }, { sparse: true });

// Compound indexes for analytics
TransactionSchema.index({ userId: 1, category: 1, type: 1, date: -1 });
TransactionSchema.index({ userId: 1, date: -1, status: 1 });
TransactionSchema.index({ currency: 1, date: -1 });

export const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
export default Transaction;