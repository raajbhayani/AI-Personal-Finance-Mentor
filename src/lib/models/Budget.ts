import { Schema, model, models, Document } from 'mongoose';

export interface IBudget extends Document {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  totalBudget: number;
  categories: Array<{
    name: string;
    budgeted: number;
    spent: number;
    remaining: number;
    subcategories?: Array<{
      name: string;
      budgeted: number;
      spent: number;
    }>;
  }>;
  status: 'active' | 'completed' | 'draft';
  alerts: {
    enabled: boolean;
    thresholds: {
      warning: number; // percentage
      critical: number; // percentage
    };
    notifications: Array<{
      type: 'warning' | 'critical' | 'overspent';
      category: string;
      amount: number;
      date: Date;
      acknowledged: boolean;
    }>;
  };
  rollover: {
    enabled: boolean;
    categories: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>({
  userId: {
    type: String,
    required: true,
    ref: 'User',
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  period: {
    type: String,
    enum: ['weekly', 'monthly', 'yearly'],
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  totalBudget: {
    type: Number,
    required: true,
    min: 0,
  },
  categories: [{
    name: {
      type: String,
      required: true,
    },
    budgeted: {
      type: Number,
      required: true,
      min: 0,
    },
    spent: {
      type: Number,
      default: 0,
      min: 0,
    },
    remaining: {
      type: Number,
      default: function() {
        return this.budgeted - this.spent;
      },
    },
    subcategories: [{
      name: String,
      budgeted: {
        type: Number,
        min: 0,
      },
      spent: {
        type: Number,
        default: 0,
        min: 0,
      },
    }],
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'draft'],
    default: 'draft',
  },
  alerts: {
    enabled: {
      type: Boolean,
      default: true,
    },
    thresholds: {
      warning: {
        type: Number,
        default: 80,
        min: 0,
        max: 100,
      },
      critical: {
        type: Number,
        default: 95,
        min: 0,
        max: 100,
      },
    },
    notifications: [{
      type: {
        type: String,
        enum: ['warning', 'critical', 'overspent'],
        required: true,
      },
      category: {
        type: String,
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      date: {
        type: Date,
        default: Date.now,
      },
      acknowledged: {
        type: Boolean,
        default: false,
      },
    }],
  },
  rollover: {
    enabled: {
      type: Boolean,
      default: false,
    },
    categories: [String],
  },
}, {
  timestamps: true,
});

// Virtual for total spent
BudgetSchema.virtual('totalSpent').get(function() {
  return this.categories.reduce((total, category) => total + category.spent, 0);
});

// Virtual for total remaining
BudgetSchema.virtual('totalRemaining').get(function() {
  return this.totalBudget - this.totalSpent;
});

// Virtual for budget utilization percentage
BudgetSchema.virtual('utilizationPercentage').get(function() {
  return this.totalBudget > 0 ? (this.totalSpent / this.totalBudget) * 100 : 0;
});

// Indexes
BudgetSchema.index({ userId: 1, status: 1 });
BudgetSchema.index({ userId: 1, period: 1 });
BudgetSchema.index({ startDate: 1, endDate: 1 });
BudgetSchema.index({ status: 1 });

// Middleware to calculate remaining amounts
BudgetSchema.pre('save', function(next) {
  this.categories.forEach(category => {
    category.remaining = category.budgeted - category.spent;
  });
  next();
});

const Budget = models.Budget || model<IBudget>('Budget', BudgetSchema);

export default Budget;