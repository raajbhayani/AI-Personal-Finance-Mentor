import { Schema, model, models, Document } from 'mongoose';

export interface ICategory extends Document {
  _id: string;
  name: string;
  description?: string;
  type: 'income' | 'expense' | 'transfer';
  parentCategory?: string;
  icon: string;
  color: string;
  isDefault: boolean;
  isActive: boolean;
  userId?: string; // null for default categories, set for user-created categories
  subcategories: Array<{
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    isActive: boolean;
  }>;
  budget?: {
    monthly: number;
    yearly: number;
  };
  keywords: string[]; // for auto-categorization
  rules: Array<{
    field: 'description' | 'amount' | 'merchant';
    operator: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than';
    value: string | number;
    caseSensitive: boolean;
  }>;
  analytics: {
    totalTransactions: number;
    totalAmount: number;
    averageAmount: number;
    lastUsed?: Date;
    monthlyAverage: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: ['income', 'expense', 'transfer'],
    required: true,
  },
  parentCategory: {
    type: String,
    ref: 'Category',
  },
  icon: {
    type: String,
    required: true,
    default: '📊',
  },
  color: {
    type: String,
    required: true,
    default: '#6B7280',
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  userId: {
    type: String,
    ref: 'User',
    required: false, // null for default categories
  },
  subcategories: [{
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
      default: '📝',
    },
    color: {
      type: String,
      default: '#6B7280',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  }],
  budget: {
    monthly: {
      type: Number,
      min: 0,
    },
    yearly: {
      type: Number,
      min: 0,
    },
  },
  keywords: [{
    type: String,
    lowercase: true,
    trim: true,
  }],
  rules: [{
    field: {
      type: String,
      enum: ['description', 'amount', 'merchant'],
      required: true,
    },
    operator: {
      type: String,
      enum: ['contains', 'equals', 'starts_with', 'ends_with', 'greater_than', 'less_than'],
      required: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    caseSensitive: {
      type: Boolean,
      default: false,
    },
  }],
  analytics: {
    totalTransactions: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    averageAmount: {
      type: Number,
      default: 0,
    },
    lastUsed: Date,
    monthlyAverage: {
      type: Number,
      default: 0,
    },
  },
}, {
  timestamps: true,
});

// Compound indexes
CategorySchema.index({ userId: 1, type: 1, isActive: 1 });
CategorySchema.index({ isDefault: 1, type: 1, isActive: 1 });
CategorySchema.index({ name: 1, userId: 1 }, { unique: true });
CategorySchema.index({ keywords: 1 });
CategorySchema.index({ parentCategory: 1 });

// Text index for search
CategorySchema.index({
  name: 'text',
  description: 'text',
  keywords: 'text'
});

// Virtual for full path (parent > child)
CategorySchema.virtual('fullPath').get(function() {
  if (this.parentCategory) {
    return `${this.parentCategory} > ${this.name}`;
  }
  return this.name;
});

// Method to check if transaction matches category rules
CategorySchema.methods.matchesTransaction = function(transaction: any) {
  return this.rules.some((rule: any) => {
    const fieldValue = transaction[rule.field];
    if (!fieldValue) return false;

    switch (rule.operator) {
      case 'contains':
        return rule.caseSensitive
          ? fieldValue.includes(rule.value)
          : fieldValue.toLowerCase().includes(rule.value.toLowerCase());

      case 'equals':
        return rule.caseSensitive
          ? fieldValue === rule.value
          : fieldValue.toLowerCase() === rule.value.toLowerCase();

      case 'starts_with':
        return rule.caseSensitive
          ? fieldValue.startsWith(rule.value)
          : fieldValue.toLowerCase().startsWith(rule.value.toLowerCase());

      case 'ends_with':
        return rule.caseSensitive
          ? fieldValue.endsWith(rule.value)
          : fieldValue.toLowerCase().endsWith(rule.value.toLowerCase());

      case 'greater_than':
        return Number(fieldValue) > Number(rule.value);

      case 'less_than':
        return Number(fieldValue) < Number(rule.value);

      default:
        return false;
    }
  });
};

const Category = models.Category || model<ICategory>('Category', CategorySchema);

export default Category;