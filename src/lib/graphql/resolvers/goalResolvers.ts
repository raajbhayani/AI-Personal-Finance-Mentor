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
import { Goal } from '../../models/Goal';
import { User } from '../../models/User';
import { Transaction } from '../../models/Transaction';
import { validateField } from '../../utils/validation';
import type { Context } from '../context';

interface GoalInput {
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount?: number;
  targetDate: Date;
  category: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  isRecurring?: boolean;
  reminderFrequency?: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
}

interface UpdateGoalInput {
  title?: string;
  description?: string;
  targetAmount?: number;
  currentAmount?: number;
  targetDate?: Date;
  category?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  isRecurring?: boolean;
  reminderFrequency?: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
}

interface GoalFilters {
  category?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  isCompleted?: boolean;
  search?: string;
}

export const goalResolvers = {
  Query: {
    getGoal: async (_: any, { id }: { id: string }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to access this resource');
      }

      try {
        const goal = await Goal.findById(id);
        if (!goal) {
          throw new UserInputError('Goal not found');
        }

        // Users can only access their own goals
        if (goal.userId.toString() !== context.user.id && context.user.role !== 'ADMIN') {
          throw new ForbiddenError('You can only access your own goals');
        }

        return goal;
      } catch (error) {
        console.error('Error fetching goal:', error);
        if (error instanceof UserInputError || error instanceof ForbiddenError) {
          throw error;
        }
        throw new Error('Failed to fetch goal');
      }
    },

    getGoals: async (
      _: any,
      {
        filters,
        limit = 20,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
      }: {
        filters?: GoalFilters;
        limit?: number;
        offset?: number;
        sortBy?: string;
        sortOrder?: string;
      },
      context: Context
    ) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to access this resource');
      }

      try {
        let query: any = { userId: context.user.id };

        // Apply filters
        if (filters) {
          if (filters.category) {
            query.category = filters.category;
          }

          if (filters.priority) {
            query.priority = filters.priority.toLowerCase();
          }

          if (filters.isCompleted !== undefined) {
            // Filter by completion status based on current vs target amount
            if (filters.isCompleted) {
              query.$expr = { $gte: ['$currentAmount', '$targetAmount'] };
            } else {
              query.$expr = { $lt: ['$currentAmount', '$targetAmount'] };
            }
          }

          if (filters.search) {
            query.$or = [
              { title: { $regex: filters.search, $options: 'i' } },
              { description: { $regex: filters.search, $options: 'i' } },
            ];
          }
        }

        // Build sort object
        const sortObj: any = {};
        sortObj[sortBy] = sortOrder === 'ASC' ? 1 : -1;

        const [goals, totalCount] = await Promise.all([
          Goal.find(query).sort(sortObj).limit(limit).skip(offset),
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
            endCursor:
              goals.length > 0
                ? Buffer.from((offset + goals.length - 1).toString()).toString('base64')
                : null,
          },
          totalCount,
        };
      } catch (error) {
        console.error('Error fetching goals:', error);
        throw new Error('Failed to fetch goals');
      }
    },

    searchGoals: async (
      _: any,
      { query, limit = 10 }: { query: string; limit?: number },
      context: Context
    ) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to search goals');
      }

      try {
        const searchQuery = {
          userId: context.user.id,
          $or: [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { category: { $regex: query, $options: 'i' } },
          ],
        };

        const goals = await Goal.find(searchQuery)
          .sort({ createdAt: -1 })
          .limit(limit);

        return goals;
      } catch (error) {
        console.error('Error searching goals:', error);
        throw new Error('Failed to search goals');
      }
    },
  },

  Mutation: {
    addGoal: async (_: any, { input }: { input: GoalInput }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to add a goal');
      }

      try {
        // Validate input
        const titleError = validateField(input.title, {
          required: true,
          minLength: 2,
          maxLength: 100,
        });
        if (titleError) {
          throw new UserInputError(`Title: ${titleError}`);
        }

        if (!input.targetAmount || input.targetAmount <= 0) {
          throw new UserInputError('Target amount must be greater than 0');
        }

        if (input.currentAmount !== undefined && input.currentAmount < 0) {
          throw new UserInputError('Current amount cannot be negative');
        }

        if (!input.targetDate) {
          throw new UserInputError('Target date is required');
        }

        const targetDate = new Date(input.targetDate);
        if (targetDate <= new Date()) {
          throw new UserInputError('Target date must be in the future');
        }

        if (!input.category || input.category.trim().length === 0) {
          throw new UserInputError('Category is required');
        }

        // Validate category
        const validCategories = [
          'EMERGENCY_FUND',
          'VACATION',
          'HOUSE_DOWN_PAYMENT',
          'CAR_PURCHASE',
          'RETIREMENT',
          'EDUCATION',
          'DEBT_PAYOFF',
          'INVESTMENT',
          'WEDDING',
          'BUSINESS',
          'OTHER',
        ];

        if (!validCategories.includes(input.category.toUpperCase())) {
          throw new UserInputError('Invalid goal category');
        }

        // Create goal
        const goal = new Goal({
          title: input.title.trim(),
          description: input.description?.trim() || '',
          targetAmount: input.targetAmount,
          currentAmount: input.currentAmount || 0,
          targetDate,
          category: input.category.toLowerCase(),
          priority: (input.priority || 'MEDIUM').toLowerCase(),
          isRecurring: input.isRecurring || false,
          reminders: {
            frequency: (input.reminderFrequency || 'MONTHLY').toLowerCase(),
          },
          userId: context.user.id,
          status: 'active',
        });

        await goal.save();

        // Populate user data
        await goal.populate('user');

        return goal;
      } catch (error) {
        console.error('Error adding goal:', error);
        if (error instanceof UserInputError) {
          throw error;
        }
        throw new Error('Failed to add goal');
      }
    },

    updateGoal: async (
      _: any,
      { id, input }: { id: string; input: UpdateGoalInput },
      context: Context
    ) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to update a goal');
      }

      try {
        const goal = await Goal.findById(id);
        if (!goal) {
          throw new UserInputError('Goal not found');
        }

        // Users can only update their own goals
        if (goal.userId.toString() !== context.user.id && context.user.role !== 'ADMIN') {
          throw new ForbiddenError('You can only update your own goals');
        }

        // Validate and update fields
        if (input.title !== undefined) {
          const titleError = validateField(input.title, {
            required: true,
            minLength: 2,
            maxLength: 100,
          });
          if (titleError) {
            throw new UserInputError(`Title: ${titleError}`);
          }
          goal.title = input.title.trim();
        }

        if (input.description !== undefined) {
          goal.description = input.description.trim();
        }

        if (input.targetAmount !== undefined) {
          if (input.targetAmount <= 0) {
            throw new UserInputError('Target amount must be greater than 0');
          }
          goal.targetAmount = input.targetAmount;
        }

        if (input.currentAmount !== undefined) {
          if (input.currentAmount < 0) {
            throw new UserInputError('Current amount cannot be negative');
          }
          goal.currentAmount = input.currentAmount;
        }

        if (input.targetDate !== undefined) {
          const targetDate = new Date(input.targetDate);
          if (targetDate <= new Date()) {
            throw new UserInputError('Target date must be in the future');
          }
          goal.targetDate = targetDate;
        }

        if (input.category !== undefined) {
          if (!input.category.trim()) {
            throw new UserInputError('Category cannot be empty');
          }

          const validCategories = [
            'EMERGENCY_FUND',
            'VACATION',
            'HOUSE_DOWN_PAYMENT',
            'CAR_PURCHASE',
            'RETIREMENT',
            'EDUCATION',
            'DEBT_PAYOFF',
            'INVESTMENT',
            'WEDDING',
            'BUSINESS',
            'OTHER',
          ];

          if (!validCategories.includes(input.category.toUpperCase())) {
            throw new UserInputError('Invalid goal category');
          }

          goal.category = input.category.toLowerCase();
        }

        if (input.priority !== undefined) {
          if (!['LOW', 'MEDIUM', 'HIGH'].includes(input.priority)) {
            throw new UserInputError('Priority must be LOW, MEDIUM, or HIGH');
          }
          goal.priority = input.priority.toLowerCase();
        }

        if (input.isRecurring !== undefined) {
          goal.isRecurring = input.isRecurring;
        }

        if (input.reminderFrequency !== undefined) {
          if (!['WEEKLY', 'MONTHLY', 'QUARTERLY'].includes(input.reminderFrequency)) {
            throw new UserInputError('Reminder frequency must be WEEKLY, MONTHLY, or QUARTERLY');
          }
          goal.reminders.frequency = input.reminderFrequency.toLowerCase();
        }

        // Update completion status
        if (goal.currentAmount >= goal.targetAmount && goal.status !== 'completed') {
          goal.status = 'completed';
        } else if (goal.currentAmount < goal.targetAmount && goal.status === 'completed') {
          goal.status = 'active';
        }

        goal.updatedAt = new Date();
        await goal.save();

        // Populate user data
        await goal.populate('user');

        return goal;
      } catch (error) {
        console.error('Error updating goal:', error);
        if (error instanceof UserInputError || error instanceof ForbiddenError) {
          throw error;
        }
        throw new Error('Failed to update goal');
      }
    },

    deleteGoal: async (_: any, { id }: { id: string }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to delete a goal');
      }

      try {
        const goal = await Goal.findById(id);
        if (!goal) {
          throw new UserInputError('Goal not found');
        }

        // Users can only delete their own goals
        if (goal.userId.toString() !== context.user.id && context.user.role !== 'ADMIN') {
          throw new ForbiddenError('You can only delete your own goals');
        }

        await Goal.findByIdAndDelete(id);
        return true;
      } catch (error) {
        console.error('Error deleting goal:', error);
        if (error instanceof UserInputError || error instanceof ForbiddenError) {
          throw error;
        }
        throw new Error('Failed to delete goal');
      }
    },

    addGoalProgress: async (
      _: any,
      { id, amount, description }: { id: string; amount: number; description?: string },
      context: Context
    ) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to add goal progress');
      }

      try {
        const goal = await Goal.findById(id);
        if (!goal) {
          throw new UserInputError('Goal not found');
        }

        // Users can only update their own goals
        if (goal.userId.toString() !== context.user.id && context.user.role !== 'ADMIN') {
          throw new ForbiddenError('You can only update your own goals');
        }

        if (amount <= 0) {
          throw new UserInputError('Progress amount must be greater than 0');
        }

        // Add to current amount
        goal.currentAmount += amount;

        // Add milestone if provided
        if (description) {
          goal.milestones.push({
            amount,
            description: description.trim(),
            achievedAt: new Date(),
          });
        }

        // Update completion status
        if (goal.currentAmount >= goal.targetAmount) {
          goal.status = 'completed';
        }

        goal.updatedAt = new Date();
        await goal.save();

        // Populate user data
        await goal.populate('user');

        return goal;
      } catch (error) {
        console.error('Error adding goal progress:', error);
        if (error instanceof UserInputError || error instanceof ForbiddenError) {
          throw error;
        }
        throw new Error('Failed to add goal progress');
      }
    },
  },

  Goal: {
    user: async (goal: any) => {
      try {
        return await User.findById(goal.userId).select('-password');
      } catch (error) {
        console.error('Error fetching goal user:', error);
        throw new Error('Failed to fetch user data');
      }
    },

    progressPercentage: (goal: any) => {
      return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
    },

    remainingAmount: (goal: any) => {
      return Math.max(goal.targetAmount - goal.currentAmount, 0);
    },

    isCompleted: (goal: any) => {
      return goal.currentAmount >= goal.targetAmount;
    },

    daysRemaining: (goal: any) => {
      const now = new Date();
      const timeDiff = new Date(goal.targetDate).getTime() - now.getTime();
      return Math.max(Math.ceil(timeDiff / (1000 * 3600 * 24)), 0);
    },

    monthlySavingsNeeded: (goal: any) => {
      const remainingAmount = Math.max(goal.targetAmount - goal.currentAmount, 0);
      const now = new Date();
      const targetDate = new Date(goal.targetDate);
      const monthsRemaining = Math.max(
        (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth()),
        1
      );
      return remainingAmount / monthsRemaining;
    },

    milestones: (goal: any) => {
      return goal.milestones || [];
    },
  },
};