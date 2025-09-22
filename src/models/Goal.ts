import mongoose, { Document, Schema } from 'mongoose';

export interface IGoal extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  category: string;
  isPublic: boolean;
  milestones?: {
    amount: number;
    description: string;
    achievedAt?: Date;
  }[];
  reminders: {
    frequency: 'none' | 'daily' | 'weekly' | 'monthly';
    lastReminded?: Date;
  };
  linkedTransactions: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
      minlength: [1, 'Title cannot be empty'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    targetAmount: {
      type: Number,
      required: [true, 'Target amount is required'],
      min: [0.01, 'Target amount must be greater than 0'],
      validate: {
        validator: function (value: number) {
          return Number.isFinite(value) && value > 0;
        },
        message: 'Target amount must be a positive number',
      },
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: [0, 'Current amount cannot be negative'],
      validate: {
        validator: function (value: number) {
          return Number.isFinite(value) && value >= 0;
        },
        message: 'Current amount must be a non-negative number',
      },
    },
    targetDate: {
      type: Date,
      required: [true, 'Target date is required'],
      validate: {
        validator: function (value: Date) {
          return value > new Date();
        },
        message: 'Target date must be in the future',
      },
    },
    priority: {
      type: String,
      required: [true, 'Priority is required'],
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['active', 'completed', 'paused', 'cancelled'],
      default: 'active',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: [
        'Emergency Fund',
        'Vacation',
        'Home Purchase',
        'Car Purchase',
        'Education',
        'Retirement',
        'Investment',
        'Debt Payoff',
        'Wedding',
        'Health',
        'Business',
        'Other',
      ],
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    milestones: [
      {
        amount: {
          type: Number,
          required: true,
          min: [0.01, 'Milestone amount must be greater than 0'],
        },
        description: {
          type: String,
          required: true,
          trim: true,
          maxlength: [200, 'Milestone description cannot exceed 200 characters'],
        },
        achievedAt: {
          type: Date,
        },
      },
    ],
    reminders: {
      frequency: {
        type: String,
        enum: ['none', 'daily', 'weekly', 'monthly'],
        default: 'weekly',
      },
      lastReminded: {
        type: Date,
      },
    },
    linkedTransactions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Transaction',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        ret.progressPercentage = Math.min((ret.currentAmount / ret.targetAmount) * 100, 100);
        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        ret.progressPercentage = Math.min((ret.currentAmount / ret.targetAmount) * 100, 100);
        return ret;
      },
    },
  }
);

GoalSchema.index({ userId: 1, status: 1 });
GoalSchema.index({ userId: 1, priority: 1 });
GoalSchema.index({ userId: 1, targetDate: 1 });
GoalSchema.index({ targetDate: 1 });
GoalSchema.index({ 'reminders.frequency': 1, 'reminders.lastReminded': 1 });

GoalSchema.virtual('progressPercentage').get(function (this: IGoal) {
  return Math.min((this.currentAmount / this.targetAmount) * 100, 100);
});

GoalSchema.virtual('remainingAmount').get(function (this: IGoal) {
  return Math.max(this.targetAmount - this.currentAmount, 0);
});

GoalSchema.virtual('daysRemaining').get(function (this: IGoal) {
  const now = new Date();
  const timeDiff = this.targetDate.getTime() - now.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

export const Goal = mongoose.models.Goal || mongoose.model<IGoal>('Goal', GoalSchema);
export default Goal;