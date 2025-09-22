import { Schema, model, models, Document } from 'mongoose';

export interface IGoal extends Document {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  type: 'savings' | 'debt_payoff' | 'investment' | 'purchase' | 'other';
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  category: string;
  icon?: string;
  color?: string;
  milestones: Array<{
    amount: number;
    description: string;
    targetDate: Date;
    isCompleted: boolean;
    completedAt?: Date;
  }>;
  linkedAccounts: string[];
  autoContribution: {
    enabled: boolean;
    amount?: number;
    frequency?: 'weekly' | 'monthly' | 'yearly';
    nextContribution?: Date;
  };
  reminders: {
    enabled: boolean;
    frequency: 'weekly' | 'monthly';
    lastSent?: Date;
  };
  metadata: {
    source: 'manual' | 'ai_suggested' | 'template';
    createdFrom?: string;
    tags: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const GoalSchema = new Schema<IGoal>({
  userId: {
    type: String,
    required: true,
    ref: 'User',
  },
  title: {
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
    enum: ['savings', 'debt_payoff', 'investment', 'purchase', 'other'],
    required: true,
  },
  targetAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  targetDate: {
    type: Date,
    required: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'cancelled'],
    default: 'active',
  },
  category: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: '🎯',
  },
  color: {
    type: String,
    default: '#3B82F6',
  },
  milestones: [{
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    targetDate: {
      type: Date,
      required: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: Date,
  }],
  linkedAccounts: [String],
  autoContribution: {
    enabled: {
      type: Boolean,
      default: false,
    },
    amount: Number,
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'yearly'],
    },
    nextContribution: Date,
  },
  reminders: {
    enabled: {
      type: Boolean,
      default: true,
    },
    frequency: {
      type: String,
      enum: ['weekly', 'monthly'],
      default: 'monthly',
    },
    lastSent: Date,
  },
  metadata: {
    source: {
      type: String,
      enum: ['manual', 'ai_suggested', 'template'],
      default: 'manual',
    },
    createdFrom: String,
    tags: [String],
  },
  completedAt: Date,
}, {
  timestamps: true,
});

// Virtual for progress percentage
GoalSchema.virtual('progress').get(function() {
  return this.targetAmount > 0 ? (this.currentAmount / this.targetAmount) * 100 : 0;
});

// Virtual for remaining amount
GoalSchema.virtual('remainingAmount').get(function() {
  return Math.max(0, this.targetAmount - this.currentAmount);
});

// Virtual for days remaining
GoalSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const target = new Date(this.targetDate);
  const timeDiff = target.getTime() - now.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Indexes
GoalSchema.index({ userId: 1, status: 1 });
GoalSchema.index({ userId: 1, type: 1 });
GoalSchema.index({ userId: 1, priority: 1 });
GoalSchema.index({ targetDate: 1 });
GoalSchema.index({ status: 1 });

// Middleware to update completedAt when status changes to completed
GoalSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

const Goal = models.Goal || model<IGoal>('Goal', GoalSchema);

export default Goal;