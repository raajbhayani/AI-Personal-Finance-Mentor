import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../../lib/db/mongodb';
import { authMiddleware } from '../../../lib/middleware/auth';
import { validateRequestBody } from '../../../lib/middleware/validation';
import { Transaction } from '../../../models/Transaction';
import {
  BulkDeleteTransactionSchema,
  BulkUpdateTransactionSchema,
  type BulkDeleteTransactionInput,
  type BulkUpdateTransactionInput,
} from '../../../lib/validation/transaction';
import mongoose from 'mongoose';

interface AuthenticatedRequest extends NextApiRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  await connectDB();

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  const { action } = req.query;

  switch (action) {
    case 'delete':
      return handleBulkDelete(req, res);
    case 'update':
      return handleBulkUpdate(req, res);
    default:
      return res.status(400).json({
        success: false,
        message: 'Invalid bulk action. Use "delete" or "update"',
      });
  }
}

async function handleBulkDelete(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const validation = validateRequestBody(BulkDeleteTransactionSchema, req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    const { ids } = validation.data as BulkDeleteTransactionInput;
    const userId = req.user.userId;

    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));

    if (validIds.length !== ids.length) {
      return res.status(400).json({
        success: false,
        message: 'Some transaction IDs are invalid',
      });
    }

    const result = await Transaction.deleteMany({
      _id: { $in: validIds },
      userId,
    });

    return res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} transactions`,
      data: {
        deletedCount: result.deletedCount,
        requestedCount: ids.length,
      },
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete transactions',
    });
  }
}

async function handleBulkUpdate(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const validation = validateRequestBody(BulkUpdateTransactionSchema, req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    const { ids, updates } = validation.data as BulkUpdateTransactionInput;
    const userId = req.user.userId;

    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));

    if (validIds.length !== ids.length) {
      return res.status(400).json({
        success: false,
        message: 'Some transaction IDs are invalid',
      });
    }

    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };

    const result = await Transaction.updateMany(
      {
        _id: { $in: validIds },
        userId,
      },
      { $set: updateData },
      { runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} transactions`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        requestedCount: ids.length,
      },
    });
  } catch (error) {
    console.error('Bulk update error:', error);

    if (error instanceof mongoose.Error.ValidationError) {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update transactions',
    });
  }
}

export default authMiddleware(handler);