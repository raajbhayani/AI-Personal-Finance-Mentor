import { Schema, model, models, Document } from 'mongoose';

export interface ITransaction extends Document {
  _id: string;
  userId: string;
  amount: number;
  description: string;
  category: string;
  subcategory?: string;
  type: 'income' | 'expense' | 'transfer';
  date: Date;
  account?: string;
  tags: string[];
  location?: {
    name: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  receipt?: {
    url: string;
    filename: string;
  };
  isRecurring: boolean;
  recurringRule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
  };
  metadata: {
    source: 'manual' | 'import' | 'bank_sync' | 'recurring';
    confidence?: number;
    originalDescription?: string;
    merchantInfo?: {
      name: string;
      category: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  userId: {
    type: String,
    required: true,
    ref: 'User',
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
  },
  subcategory: {
    type: String,
    required: false,
  },
  type: {
    type: String,
    enum: ['income', 'expense', 'transfer'],
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  account: {
    type: String,
    required: false,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  location: {
    name: String,
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  receipt: {
    url: String,
    filename: String,
  },
  isRecurring: {
    type: Boolean,
    default: false,
  },
  recurringRule: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
    },
    interval: {
      type: Number,
      min: 1,
    },
    endDate: Date,
  },
  metadata: {
    source: {
      type: String,
      enum: ['manual', 'import', 'bank_sync', 'recurring'],
      default: 'manual',
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    originalDescription: String,
    merchantInfo: {
      name: String,
      category: String,
    },
  },
}, {
  timestamps: true,
});

// Indexes
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, category: 1 });
TransactionSchema.index({ userId: 1, type: 1 });
TransactionSchema.index({ date: -1 });
TransactionSchema.index({ amount: 1 });
TransactionSchema.index({ tags: 1 });

const Transaction = models.Transaction || model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;