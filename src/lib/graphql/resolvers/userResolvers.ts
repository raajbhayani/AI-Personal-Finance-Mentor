import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { GraphQLError } from 'graphql';

class AuthenticationError extends GraphQLError {
  constructor(message: string) {
    super(message, { extensions: { code: 'UNAUTHENTICATED' } });
  }
}

class UserInputError extends GraphQLError {
  constructor(message: string) {
    super(message, { extensions: { code: 'BAD_USER_INPUT' } });
  }
}

class ForbiddenError extends GraphQLError {
  constructor(message: string) {
    super(message, { extensions: { code: 'FORBIDDEN' } });
  }
}
import { User } from '../../models/User';
import { Transaction } from '../../models/Transaction';
import { Goal } from '../../models/Goal';
import { validateEmail, validatePassword } from '../../utils/validation';
import { generateToken, verifyToken } from '../../utils/auth';
import type { Context } from '../context';

interface SignupInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth?: Date;
  currency?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  currency?: string;
  timezone?: string;
  preferences?: {
    darkMode?: boolean;
    notifications?: {
      email?: boolean;
      push?: boolean;
      goalReminders?: boolean;
      budgetAlerts?: boolean;
      weeklyReports?: boolean;
      monthlyReports?: boolean;
    };
    privacy?: {
      shareDataForInsights?: boolean;
      allowMarketing?: boolean;
    };
  };
}

export const userResolvers = {
  Query: {
    me: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to access this resource');
      }

      try {
        const user = await User.findById(context.user.id).select('-password');
        if (!user) {
          throw new AuthenticationError('User not found');
        }
        return user;
      } catch (error) {
        console.error('Error fetching current user:', error);
        throw new Error('Failed to fetch user data');
      }
    },

    getUser: async (_: any, { id }: { id: string }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to access this resource');
      }

      // Users can only access their own data unless they're admin
      if (context.user.id !== id && context.user.role !== 'ADMIN') {
        throw new ForbiddenError('You can only access your own user data');
      }

      try {
        const user = await User.findById(id).select('-password');
        if (!user) {
          throw new UserInputError('User not found');
        }
        return user;
      } catch (error) {
        console.error('Error fetching user:', error);
        throw new Error('Failed to fetch user data');
      }
    },
  },

  Mutation: {
    signup: async (_: any, { input }: { input: SignupInput }) => {
      try {
        // Validate input
        if (!validateEmail(input.email)) {
          throw new UserInputError('Invalid email address');
        }

        if (!validatePassword(input.password)) {
          throw new UserInputError(
            'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'
          );
        }

        if (!input.firstName?.trim() || !input.lastName?.trim()) {
          throw new UserInputError('First name and last name are required');
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: input.email.toLowerCase() });
        if (existingUser) {
          throw new UserInputError('User with this email already exists');
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(input.password, saltRounds);

        // Create user with default preferences
        const user = new User({
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          email: input.email.toLowerCase(),
          password: hashedPassword,
          dateOfBirth: input.dateOfBirth,
          currency: input.currency || 'USD',
          role: 'USER',
          preferences: {
            darkMode: false,
            notifications: {
              email: true,
              push: true,
              goalReminders: true,
              budgetAlerts: true,
              weeklyReports: true,
              monthlyReports: true,
            },
            privacy: {
              shareDataForInsights: false,
              allowMarketing: false,
            },
          },
        });

        await user.save();

        // Generate JWT token
        const token = generateToken(user._id.toString(), user.role);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        return {
          token,
          user,
          expiresAt,
        };
      } catch (error) {
        console.error('Signup error:', error);
        if (error instanceof UserInputError || error instanceof AuthenticationError) {
          throw error;
        }
        throw new Error('Failed to create user account');
      }
    },

    login: async (_: any, { input }: { input: LoginInput }) => {
      try {
        if (!validateEmail(input.email)) {
          throw new UserInputError('Invalid email address');
        }

        // Find user
        const user = await User.findOne({ email: input.email.toLowerCase() });
        if (!user) {
          throw new AuthenticationError('Invalid email or password');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(input.password, user.password);
        if (!isValidPassword) {
          throw new AuthenticationError('Invalid email or password');
        }

        // Generate JWT token
        const token = generateToken(user._id.toString(), user.role);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Update last login
        user.lastLoginAt = new Date();
        await user.save();

        return {
          token,
          user,
          expiresAt,
        };
      } catch (error) {
        console.error('Login error:', error);
        if (error instanceof AuthenticationError || error instanceof UserInputError) {
          throw error;
        }
        throw new Error('Failed to log in');
      }
    },

    logout: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to logout');
      }

      // In a real implementation, you would invalidate the token
      // For now, we'll just return a success message
      return {
        success: true,
        message: 'Successfully logged out',
      };
    },

    refreshToken: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to refresh token');
      }

      try {
        const user = await User.findById(context.user.id);
        if (!user) {
          throw new AuthenticationError('User not found');
        }

        // Generate new token
        const token = generateToken(user._id.toString(), user.role);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        return {
          token,
          user,
          expiresAt,
        };
      } catch (error) {
        console.error('Token refresh error:', error);
        throw new Error('Failed to refresh token');
      }
    },

    updateUser: async (_: any, { input }: { input: UpdateUserInput }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to update your profile');
      }

      try {
        const user = await User.findById(context.user.id);
        if (!user) {
          throw new AuthenticationError('User not found');
        }

        // Validate and update fields
        if (input.firstName !== undefined) {
          if (!input.firstName.trim()) {
            throw new UserInputError('First name cannot be empty');
          }
          user.firstName = input.firstName.trim();
        }

        if (input.lastName !== undefined) {
          if (!input.lastName.trim()) {
            throw new UserInputError('Last name cannot be empty');
          }
          user.lastName = input.lastName.trim();
        }

        if (input.dateOfBirth !== undefined) {
          const today = new Date();
          const birthDate = new Date(input.dateOfBirth);
          if (birthDate >= today) {
            throw new UserInputError('Birth date must be in the past');
          }
          user.dateOfBirth = input.dateOfBirth;
        }

        if (input.currency !== undefined) {
          // Validate currency code (basic validation)
          const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'];
          if (!validCurrencies.includes(input.currency)) {
            throw new UserInputError('Invalid currency code');
          }
          user.currency = input.currency;
        }

        if (input.timezone !== undefined) {
          user.timezone = input.timezone;
        }

        if (input.preferences !== undefined) {
          // Deep merge preferences
          if (input.preferences.darkMode !== undefined) {
            user.preferences.darkMode = input.preferences.darkMode;
          }

          if (input.preferences.notifications) {
            user.preferences.notifications = {
              ...user.preferences.notifications,
              ...input.preferences.notifications,
            };
          }

          if (input.preferences.privacy) {
            user.preferences.privacy = {
              ...user.preferences.privacy,
              ...input.preferences.privacy,
            };
          }
        }

        user.updatedAt = new Date();
        await user.save();

        return user;
      } catch (error) {
        console.error('Update user error:', error);
        if (error instanceof UserInputError || error instanceof AuthenticationError) {
          throw error;
        }
        throw new Error('Failed to update user profile');
      }
    },

    changePassword: async (
      _: any,
      { currentPassword, newPassword }: { currentPassword: string; newPassword: string },
      context: Context
    ) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to change your password');
      }

      try {
        const user = await User.findById(context.user.id);
        if (!user) {
          throw new AuthenticationError('User not found');
        }

        // Verify current password
        const isValidCurrentPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidCurrentPassword) {
          throw new AuthenticationError('Current password is incorrect');
        }

        // Validate new password
        if (!validatePassword(newPassword)) {
          throw new UserInputError(
            'New password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'
          );
        }

        // Hash new password
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        user.password = hashedNewPassword;
        user.updatedAt = new Date();
        await user.save();

        return user;
      } catch (error) {
        console.error('Change password error:', error);
        if (error instanceof UserInputError || error instanceof AuthenticationError) {
          throw error;
        }
        throw new Error('Failed to change password');
      }
    },

    deleteUser: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to delete your account');
      }

      try {
        // Delete all user's related data
        await Promise.all([
          Transaction.deleteMany({ userId: context.user.id }),
          Goal.deleteMany({ userId: context.user.id }),
          User.findByIdAndDelete(context.user.id),
        ]);

        return {
          success: true,
          message: 'Account successfully deleted',
        };
      } catch (error) {
        console.error('Delete user error:', error);
        throw new Error('Failed to delete user account');
      }
    },
  },

  User: {
    fullName: (user: any) => `${user.firstName} ${user.lastName}`,

    transactions: async (
      user: any,
      { filters, limit = 20, offset = 0 }: { filters?: any; limit?: number; offset?: number }
    ) => {
      try {
        let query = { userId: user._id };

        // Apply filters
        if (filters) {
          if (filters.type) query = { ...query, type: filters.type.toUpperCase() };
          if (filters.category) query = { ...query, category: filters.category };
          if (filters.status) query = { ...query, status: filters.status.toUpperCase() };
          if (filters.dateFrom || filters.dateTo) {
            const dateQuery: any = {};
            if (filters.dateFrom) dateQuery.$gte = new Date(filters.dateFrom);
            if (filters.dateTo) dateQuery.$lte = new Date(filters.dateTo);
            query = { ...query, date: dateQuery };
          }
          if (filters.amountMin || filters.amountMax) {
            const amountQuery: any = {};
            if (filters.amountMin) amountQuery.$gte = filters.amountMin;
            if (filters.amountMax) amountQuery.$lte = filters.amountMax;
            query = { ...query, amount: amountQuery };
          }
          if (filters.tags && filters.tags.length > 0) {
            query = { ...query, tags: { $in: filters.tags } };
          }
          if (filters.search) {
            query = {
              ...query,
              $or: [
                { description: { $regex: filters.search, $options: 'i' } },
                { notes: { $regex: filters.search, $options: 'i' } },
              ],
            };
          }
        }

        const [transactions, totalCount] = await Promise.all([
          Transaction.find(query).sort({ date: -1 }).limit(limit).skip(offset),
          Transaction.countDocuments(query),
        ]);

        const totalAmount = await Transaction.aggregate([
          { $match: query },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        return {
          edges: transactions.map((transaction, index) => ({
            node: transaction,
            cursor: Buffer.from((offset + index).toString()).toString('base64'),
          })),
          pageInfo: {
            hasNextPage: offset + limit < totalCount,
            hasPreviousPage: offset > 0,
            startCursor: transactions.length > 0 ? Buffer.from(offset.toString()).toString('base64') : null,
            endCursor: transactions.length > 0 ? Buffer.from((offset + transactions.length - 1).toString()).toString('base64') : null,
          },
          totalCount,
          totalAmount: totalAmount[0]?.total || 0,
        };
      } catch (error) {
        console.error('Error fetching user transactions:', error);
        throw new Error('Failed to fetch transactions');
      }
    },

    goals: async (
      user: any,
      { filters, limit = 20, offset = 0 }: { filters?: any; limit?: number; offset?: number }
    ) => {
      try {
        let query = { userId: user._id };

        // Apply filters
        if (filters) {
          if (filters.category) query = { ...query, category: filters.category };
          if (filters.priority) query = { ...query, priority: filters.priority.toUpperCase() };
          if (filters.isCompleted !== undefined) {
            // Add computed field for completion status
            query = {
              ...query,
              $expr: {
                [filters.isCompleted ? '$gte' : '$lt']: [
                  { $divide: ['$currentAmount', '$targetAmount'] },
                  1,
                ],
              },
            };
          }
          if (filters.search) {
            query = {
              ...query,
              $or: [
                { title: { $regex: filters.search, $options: 'i' } },
                { description: { $regex: filters.search, $options: 'i' } },
              ],
            };
          }
        }

        const [goals, totalCount] = await Promise.all([
          Goal.find(query).sort({ createdAt: -1 }).limit(limit).skip(offset),
          Goal.countDocuments(query),
        ]);

        return {
          edges: goals.map((goal, index) => ({
            node: goal,
            cursor: Buffer.from((offset + index).toString()).toString('base64'),
          })),
          pageInfo: {
            hasNextPage: offset + limit < totalCount,
            hasPreviousPage: offset > 0,
            startCursor: goals.length > 0 ? Buffer.from(offset.toString()).toString('base64') : null,
            endCursor: goals.length > 0 ? Buffer.from((offset + goals.length - 1).toString()).toString('base64') : null,
          },
          totalCount,
        };
      } catch (error) {
        console.error('Error fetching user goals:', error);
        throw new Error('Failed to fetch goals');
      }
    },
  },
};