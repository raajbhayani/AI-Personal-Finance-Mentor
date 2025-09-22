import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    financialContext?: any;
    processingTime?: number;
    tokenCount?: number;
  };
}

export interface IConversation extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  messages: IMessage[];
  context: {
    userFinancialProfile?: {
      totalBalance: number;
      monthlyIncome: number;
      monthlyExpenses: number;
      savingsRate: number;
      topCategories: Array<{
        category: string;
        amount: number;
        percentage: number;
      }>;
      recentTransactions: any[];
      goals: any[];
      budgets: any[];
    };
    conversationSummary?: string;
    lastAnalyzed: Date;
  };
  isActive: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant', 'system'],
  },
  content: {
    type: String,
    required: true,
    maxlength: [8000, 'Message content cannot exceed 8000 characters'],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    financialContext: Schema.Types.Mixed,
    processingTime: Number,
    tokenCount: Number,
  },
});

const ConversationSchema = new Schema<IConversation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Conversation title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    messages: {
      type: [MessageSchema],
      default: [],
      validate: {
        validator: function (messages: IMessage[]) {
          return messages.length <= 1000;
        },
        message: 'Conversation cannot have more than 1000 messages',
      },
    },
    context: {
      userFinancialProfile: {
        totalBalance: Number,
        monthlyIncome: Number,
        monthlyExpenses: Number,
        savingsRate: Number,
        topCategories: [{
          category: String,
          amount: Number,
          percentage: Number,
        }],
        recentTransactions: [Schema.Types.Mixed],
        goals: [Schema.Types.Mixed],
        budgets: [Schema.Types.Mixed],
      },
      conversationSummary: {
        type: String,
        maxlength: [2000, 'Conversation summary cannot exceed 2000 characters'],
      },
      lastAnalyzed: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (tags: string[]) {
          return tags.length <= 20;
        },
        message: 'Cannot have more than 20 tags',
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

ConversationSchema.index({ userId: 1, createdAt: -1 });
ConversationSchema.index({ userId: 1, isActive: 1 });
ConversationSchema.index({ userId: 1, tags: 1 });
ConversationSchema.index({ 'messages.timestamp': -1 });

ConversationSchema.index({
  title: 'text',
  'messages.content': 'text',
  tags: 'text',
});

export const Conversation = mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);
export default Conversation;