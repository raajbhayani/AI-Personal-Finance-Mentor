import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../../lib/db/mongodb';
import { authMiddleware } from '../../../lib/middleware/auth';
import { withApiProtection, sanitizeObject } from '../../../lib/middleware/apiValidation';
import { Transaction } from '../../../models/Transaction';
import {
  createTransactionSchema,
  type CreateTransactionData,
} from '../../../lib/validation/schemas';

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

const handleCreateTransaction = withApiProtection(createTransactionSchema, {
  rateLimit: { maxRequests: 50, windowMs: 15 * 60 * 1000 }, // 50 requests per 15 minutes
  requireCSRF: true,
})(async (req: AuthenticatedRequest, res: NextApiResponse, validatedData: CreateTransactionData) => {
  try {
    await connectDB();

    // Sanitize input data
    const sanitizedData = sanitizeObject(validatedData);
    const userId = req.user.userId;

    // Additional business logic validation
    if (sanitizedData.amount > 1000000) {
      return res.status(400).json({
        success: false,
        message: 'Transaction amount exceeds maximum limit',
        errors: [{ field: 'amount', message: 'Amount cannot exceed $1,000,000' }],
      });
    }

    // Check for duplicate transactions (same amount, description, and date within 1 minute)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const duplicateTransaction = await Transaction.findOne({
      userId,
      amount: sanitizedData.amount,
      description: sanitizedData.description,
      date: { $gte: oneMinuteAgo },
    });

    if (duplicateTransaction) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate transaction detected',
        errors: [{ field: 'general', message: 'A similar transaction was created recently' }],
      });
    }

    // Create transaction
    const transaction = new Transaction({
      ...sanitizedData,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await transaction.save();

    // Log transaction creation for audit
    console.log(`Transaction created: ${transaction._id} by user ${userId}`);

    return res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: {
        id: transaction._id,
        ...sanitizedData,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    console.error('Create transaction error:', error);

    // Handle specific database errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Database validation failed',
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message,
        })),
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create transaction',
      errors: [{ field: 'general', message: 'Internal server error' }],
    });
  }
});

export default authMiddleware(handler);