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
import { Transaction } from '../../models/Transaction';
import { User } from '../../models/User';
import { validateField } from '../../utils/validation';
import type { Context } from '../context';

interface TransactionInput {
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: Date;
  notes?: string;
  tags?: string[];
  status?: 'COMPLETED' | 'PENDING' | 'FAILED';
}

interface UpdateTransactionInput {
  description?: string;
  amount?: number;
  type?: 'INCOME' | 'EXPENSE';
  category?: string;
  date?: Date;
  notes?: string;
  tags?: string[];
  status?: 'COMPLETED' | 'PENDING' | 'FAILED';
}

interface TransactionFilters {
  type?: 'INCOME' | 'EXPENSE';
  category?: string;
  status?: 'COMPLETED' | 'PENDING' | 'FAILED';
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
  tags?: string[];
  search?: string;
}

export const transactionResolvers = {
  Query: {
    getTransaction: async (_: any, { id }: { id: string }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to access this resource');
      }

      try {
        const transaction = await Transaction.findById(id);
        if (!transaction) {
          throw new UserInputError('Transaction not found');
        }

        // Users can only access their own transactions
        if (transaction.userId.toString() !== context.user.id && context.user.role !== 'ADMIN') {
          throw new ForbiddenError('You can only access your own transactions');
        }

        return transaction;
      } catch (error) {
        console.error('Error fetching transaction:', error);
        if (error instanceof UserInputError || error instanceof ForbiddenError) {
          throw error;
        }
        throw new Error('Failed to fetch transaction');
      }
    },

    getTransactions: async (
      _: any,
      {
        filters,
        limit = 20,
        offset = 0,
        sortBy = 'date',
        sortOrder = 'DESC',
      }: {
        filters?: TransactionFilters;
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
          if (filters.type) {
            query.type = filters.type;
          }

          if (filters.category) {
            query.category = filters.category;
          }

          if (filters.status) {
            query.status = filters.status;
          }

          if (filters.dateFrom || filters.dateTo) {
            query.date = {};
            if (filters.dateFrom) {
              query.date.$gte = new Date(filters.dateFrom);
            }
            if (filters.dateTo) {
              query.date.$lte = new Date(filters.dateTo);
            }
          }

          if (filters.amountMin || filters.amountMax) {
            query.amount = {};
            if (filters.amountMin) {
              query.amount.$gte = filters.amountMin;
            }
            if (filters.amountMax) {
              query.amount.$lte = filters.amountMax;
            }
          }

          if (filters.tags && filters.tags.length > 0) {
            query.tags = { $in: filters.tags };
          }

          if (filters.search) {
            query.$or = [
              { description: { $regex: filters.search, $options: 'i' } },
              { category: { $regex: filters.search, $options: 'i' } },
              { notes: { $regex: filters.search, $options: 'i' } },
            ];
          }
        }

        // Build sort object
        const sortObj: any = {};
        sortObj[sortBy] = sortOrder === 'ASC' ? 1 : -1;

        const [transactions, totalCount] = await Promise.all([
          Transaction.find(query).sort(sortObj).limit(limit).skip(offset),
          Transaction.countDocuments(query),
        ]);

        // Calculate total amount for filtered transactions
        const totalAmountResult = await Transaction.aggregate([
          { $match: query },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        const totalAmount = totalAmountResult[0]?.total || 0;

        return {
          edges: transactions.map((transaction, index) => ({
            node: transaction,
            cursor: Buffer.from((offset + index).toString()).toString('base64'),
          })),
          pageInfo: {
            hasNextPage: offset + limit < totalCount,
            hasPreviousPage: offset > 0,
            startCursor: transactions.length > 0 ? Buffer.from(offset.toString()).toString('base64') : null,
            endCursor:
              transactions.length > 0
                ? Buffer.from((offset + transactions.length - 1).toString()).toString('base64')
                : null,
          },
          totalCount,
          totalAmount,
        };
      } catch (error) {
        console.error('Error fetching transactions:', error);
        throw new Error('Failed to fetch transactions');
      }
    },

    searchTransactions: async (
      _: any,
      { query, limit = 10 }: { query: string; limit?: number },
      context: Context
    ) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to search transactions');
      }

      try {
        const searchQuery = {
          userId: context.user.id,
          $or: [
            { description: { $regex: query, $options: 'i' } },
            { category: { $regex: query, $options: 'i' } },
            { notes: { $regex: query, $options: 'i' } },
            { tags: { $in: [new RegExp(query, 'i')] } },
          ],
        };

        const transactions = await Transaction.find(searchQuery)
          .sort({ date: -1 })
          .limit(limit);

        return transactions;
      } catch (error) {
        console.error('Error searching transactions:', error);
        throw new Error('Failed to search transactions');
      }
    },
  },

  Mutation: {
    addTransaction: async (_: any, { input }: { input: TransactionInput }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to add a transaction');
      }

      try {
        // Validate input
        const descriptionError = validateField(input.description, {
          required: true,
          minLength: 2,
          maxLength: 100,
        });
        if (descriptionError) {
          throw new UserInputError(`Description: ${descriptionError}`);
        }

        if (!input.amount || input.amount <= 0) {
          throw new UserInputError('Amount must be greater than 0');
        }

        if (!['INCOME', 'EXPENSE'].includes(input.type)) {
          throw new UserInputError('Type must be either INCOME or EXPENSE');
        }

        if (!input.category || input.category.trim().length === 0) {
          throw new UserInputError('Category is required');
        }

        if (!input.date) {
          throw new UserInputError('Date is required');
        }

        // Validate tags if provided
        if (input.tags) {
          for (const tag of input.tags) {
            if (!tag.trim()) {
              throw new UserInputError('Tags cannot be empty');
            }
            if (tag.length > 20) {
              throw new UserInputError('Tags cannot be longer than 20 characters');
            }
          }
        }

        // Create transaction
        const transaction = new Transaction({
          description: input.description.trim(),
          amount: input.amount,
          type: input.type,
          category: input.category.trim().toLowerCase(),
          date: new Date(input.date),
          notes: input.notes?.trim() || '',
          tags: input.tags?.map(tag => tag.trim().toLowerCase()) || [],
          status: input.status || 'COMPLETED',
          userId: context.user.id,
        });

        await transaction.save();

        // Populate user data
        await transaction.populate('user');

        return transaction;
      } catch (error) {
        console.error('Error adding transaction:', error);
        if (error instanceof UserInputError) {
          throw error;
        }
        throw new Error('Failed to add transaction');
      }
    },

    updateTransaction: async (
      _: any,
      { id, input }: { id: string; input: UpdateTransactionInput },
      context: Context
    ) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to update a transaction');
      }

      try {
        const transaction = await Transaction.findById(id);
        if (!transaction) {
          throw new UserInputError('Transaction not found');
        }

        // Users can only update their own transactions
        if (transaction.userId.toString() !== context.user.id && context.user.role !== 'ADMIN') {
          throw new ForbiddenError('You can only update your own transactions');
        }

        // Validate and update fields
        if (input.description !== undefined) {
          const descriptionError = validateField(input.description, {
            required: true,
            minLength: 2,
            maxLength: 100,
          });
          if (descriptionError) {
            throw new UserInputError(`Description: ${descriptionError}`);
          }
          transaction.description = input.description.trim();
        }

        if (input.amount !== undefined) {
          if (input.amount <= 0) {
            throw new UserInputError('Amount must be greater than 0');
          }
          transaction.amount = input.amount;
        }

        if (input.type !== undefined) {
          if (!['INCOME', 'EXPENSE'].includes(input.type)) {
            throw new UserInputError('Type must be either INCOME or EXPENSE');
          }
          transaction.type = input.type;
        }

        if (input.category !== undefined) {
          if (!input.category.trim()) {
            throw new UserInputError('Category cannot be empty');
          }
          transaction.category = input.category.trim().toLowerCase();
        }

        if (input.date !== undefined) {
          transaction.date = new Date(input.date);
        }

        if (input.notes !== undefined) {
          transaction.notes = input.notes.trim();
        }

        if (input.tags !== undefined) {
          // Validate tags
          for (const tag of input.tags) {
            if (!tag.trim()) {
              throw new UserInputError('Tags cannot be empty');
            }
            if (tag.length > 20) {
              throw new UserInputError('Tags cannot be longer than 20 characters');
            }
          }
          transaction.tags = input.tags.map(tag => tag.trim().toLowerCase());
        }

        if (input.status !== undefined) {
          if (!['COMPLETED', 'PENDING', 'FAILED'].includes(input.status)) {
            throw new UserInputError('Status must be COMPLETED, PENDING, or FAILED');
          }
          transaction.status = input.status;
        }

        transaction.updatedAt = new Date();
        await transaction.save();

        // Populate user data
        await transaction.populate('user');

        return transaction;
      } catch (error) {
        console.error('Error updating transaction:', error);
        if (error instanceof UserInputError || error instanceof ForbiddenError) {
          throw error;
        }
        throw new Error('Failed to update transaction');
      }
    },

    deleteTransaction: async (_: any, { id }: { id: string }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to delete a transaction');
      }

      try {
        const transaction = await Transaction.findById(id);
        if (!transaction) {
          throw new UserInputError('Transaction not found');
        }

        // Users can only delete their own transactions
        if (transaction.userId.toString() !== context.user.id && context.user.role !== 'ADMIN') {
          throw new ForbiddenError('You can only delete your own transactions');
        }

        await Transaction.findByIdAndDelete(id);
        return true;
      } catch (error) {
        console.error('Error deleting transaction:', error);
        if (error instanceof UserInputError || error instanceof ForbiddenError) {
          throw error;
        }
        throw new Error('Failed to delete transaction');
      }
    },

    bulkDeleteTransactions: async (_: any, { ids }: { ids: string[] }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to delete transactions');
      }

      try {
        // Verify all transactions belong to the user
        const transactions = await Transaction.find({ _id: { $in: ids } });

        for (const transaction of transactions) {
          if (transaction.userId.toString() !== context.user.id && context.user.role !== 'ADMIN') {
            throw new ForbiddenError('You can only delete your own transactions');
          }
        }

        const result = await Transaction.deleteMany({
          _id: { $in: ids },
          userId: context.user.id,
        });

        return result.deletedCount;
      } catch (error) {
        console.error('Error bulk deleting transactions:', error);
        if (error instanceof ForbiddenError) {
          throw error;
        }
        throw new Error('Failed to delete transactions');
      }
    },
  },

  Transaction: {
    user: async (transaction: any) => {
      try {
        return await User.findById(transaction.userId).select('-password');
      } catch (error) {
        console.error('Error fetching transaction user:', error);
        throw new Error('Failed to fetch user data');
      }
    },
  },
};