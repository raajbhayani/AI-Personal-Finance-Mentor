import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  avatar?: string;
  role: 'USER' | 'PREMIUM' | 'ADMIN';
  isEmailVerified: boolean;
  isSuspended: boolean;
  isDeleted: boolean;
  lastLogin?: Date;
  tokenVersion: number;
  preferences: {
    currency: string;
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
      budgetAlerts: boolean;
      goalReminders: boolean;
    };
    privacy: {
      dataSharing: boolean;
      analytics: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters long'],
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters long'],
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false,
    },
    avatar: {
      type: String,
      default: undefined,
    },
    role: {
      type: String,
      enum: ['USER', 'PREMIUM', 'ADMIN'],
      default: 'USER',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: undefined,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    preferences: {
      currency: {
        type: String,
        default: 'USD',
        enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'],
      },
      language: {
        type: String,
        default: 'en',
        enum: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'],
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
        budgetAlerts: {
          type: Boolean,
          default: true,
        },
        goalReminders: {
          type: Boolean,
          default: true,
        },
      },
      privacy: {
        dataSharing: {
          type: Boolean,
          default: false,
        },
        analytics: {
          type: Boolean,
          default: true,
        },
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
        delete ret.password;
        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: -1 });

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;