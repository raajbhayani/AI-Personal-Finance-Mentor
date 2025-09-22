import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../../lib/db/mongodb';
import { authMiddleware } from '../../../lib/middleware/auth';
import { validateRequestBody, validateQueryParams } from '../../../lib/middleware/validation';
import { Transaction } from '../../../models/Transaction';
import {
  CreateTransactionSchema,
  TransactionQuerySchema,
  type CreateTransactionInput,
  type TransactionQuery,
} from '../../../lib/validation/transaction';

interface AuthenticatedRequest extends NextApiRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  await connectDB();

  switch (req.method) {
    case 'GET':
      return handleGetTransactions(req, res);
    case 'POST':
      return handleCreateTransaction(req, res);
    default:
      return res.status(405).json({
        success: false,
        message: 'Method not allowed',
      });
  }
}

async function handleGetTransactions(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const validation = validateQueryParams(TransactionQuerySchema, req.query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: validation.errors,
      });
    }

    const query = validation.data as TransactionQuery;
    const userId = req.user.userId;

    const filter: any = { userId };

    if (query.type) filter.type = query.type;
    if (query.category) filter.category = query.category;
    if (query.status) filter.status = query.status;
    if (query.paymentMethod) filter.paymentMethod = query.paymentMethod;
    if (query.currency) filter.currency = query.currency;
    if (query.merchant) filter.merchant = { $regex: query.merchant, $options: 'i' };
    if (query.linkedGoalId) filter.linkedGoalId = query.linkedGoalId;
    if (query.budgetId) filter.budgetId = query.budgetId;
    if (query.isRecurring !== undefined) filter.isRecurring = query.isRecurring;

    if (query.dateFrom || query.dateTo) {
      filter.date = {};
      if (query.dateFrom) filter.date.$gte = query.dateFrom;
      if (query.dateTo) filter.date.$lte = query.dateTo;
    }

    if (query.amountMin || query.amountMax) {
      filter.amount = {};
      if (query.amountMin) filter.amount.$gte = query.amountMin;
      if (query.amountMax) filter.amount.$lte = query.amountMax;
    }

    if (query.tags && query.tags.length > 0) {
      filter.tags = { $in: query.tags };
    }

    if (query.search) {
      filter.$text = { $search: query.search };
    }

    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sortField = query.sortBy || 'date';

    const skip = (query.page - 1) * query.limit;

    const [transactions, totalCount] = await Promise.all([
      Transaction.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(query.limit)
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / query.limit);

    return res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: query.page,
          limit: query.limit,
          totalCount,
          totalPages,
          hasNext: query.page < totalPages,
          hasPrev: query.page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
    });
  }
}

async function handleCreateTransaction(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const validation = validateRequestBody(CreateTransactionSchema, req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    const transactionData = validation.data as CreateTransactionInput;
    const userId = req.user.userId;

    const transaction = new Transaction({
      ...transactionData,
      userId,
    });

    await transaction.save();

    return res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction,
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create transaction',
    });
  }
}

export default authMiddleware(handler);