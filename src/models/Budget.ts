import mongoose, { Document, Schema } from 'mongoose';

export interface IBudgetItem {
  category: string;
  budgetedAmount: number;
  spentAmount: number;
  remaining: number;
  percentageUsed: number;
}

export interface IBudget extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  categories: IBudgetItem[];
  status: 'active' | 'completed' | 'exceeded' | 'paused';
  alertThreshold: number;
  notifications: {
    enabled: boolean;
    thresholds: number[];
    lastNotified?: Date;
  };
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const BudgetItemSchema = new Schema<IBudgetItem>({
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
      'Housing',
      'Insurance',
      'Other',
    ],
  },
  budgetedAmount: {
    type: Number,
    required: [true, 'Budgeted amount is required'],
    min: [0, 'Budgeted amount cannot be negative'],
  },
  spentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Spent amount cannot be negative'],
  },
  remaining: {
    type: Number,
    default: function() { return this.budgetedAmount - this.spentAmount; },
  },
  percentageUsed: {
    type: Number,
    default: function() {
      return this.budgetedAmount > 0 ? (this.spentAmount / this.budgetedAmount) * 100 : 0;
    },
  },
});

const BudgetSchema = new Schema<IBudget>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Budget name is required'],
      trim: true,
      maxlength: [100, 'Budget name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    totalBudget: {
      type: Number,
      required: [true, 'Total budget is required'],
      min: [0, 'Total budget cannot be negative'],
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: [0, 'Total spent cannot be negative'],
    },
    totalRemaining: {
      type: Number,
      default: function() { return this.totalBudget - this.totalSpent; },
    },
    period: {
      type: String,
      required: [true, 'Budget period is required'],
      enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      index: true,
    },
    categories: {
      type: [BudgetItemSchema],
      default: [],
      validate: {
        validator: function (categories: IBudgetItem[]) {
          return categories.length <= 20;
        },
        message: 'Cannot have more than 20 budget categories',
      },
    },
    status: {
      type: String,
      required: [true, 'Budget status is required'],
      enum: ['active', 'completed', 'exceeded', 'paused'],
      default: 'active',
      index: true,
    },
    alertThreshold: {
      type: Number,
      default: 80,
      min: [0, 'Alert threshold cannot be negative'],
      max: [100, 'Alert threshold cannot exceed 100%'],
    },
    notifications: {
      enabled: {
        type: Boolean,
        default: true,
      },
      thresholds: {
        type: [Number],
        default: [50, 75, 90, 100],
        validate: {
          validator: function (thresholds: number[]) {
            return thresholds.every(t => t >= 0 && t <= 100);
          },
          message: 'Notification thresholds must be between 0 and 100',
        },
      },
      lastNotified: Date,
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
  }
);

BudgetSchema.index({ userId: 1, period: 1, startDate: -1 });
BudgetSchema.index({ userId: 1, status: 1 });
BudgetSchema.index({ userId: 1, endDate: 1 });
BudgetSchema.index({ startDate: 1, endDate: 1 });

export const Budget = mongoose.models.Budget || mongoose.model<IBudget>('Budget', BudgetSchema);
export default Budget;