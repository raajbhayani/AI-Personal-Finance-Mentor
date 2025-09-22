import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../../lib/db/mongodb';
import { authMiddleware } from '../../../lib/middleware/auth';
import { validateRequestBody } from '../../../lib/middleware/validation';
import { Transaction } from '../../../models/Transaction';
import {
  UpdateTransactionSchema,
  type UpdateTransactionInput,
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

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Transaction ID is required',
    });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid transaction ID format',
    });
  }

  switch (req.method) {
    case 'GET':
      return handleGetTransaction(req, res, id);
    case 'PUT':
      return handleUpdateTransaction(req, res, id);
    case 'DELETE':
      return handleDeleteTransaction(req, res, id);
    default:
      return res.status(405).json({
        success: false,
        message: 'Method not allowed',
      });
  }
}

async function handleGetTransaction(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  id: string
) {
  try {
    const userId = req.user.userId;

    const transaction = await Transaction.findOne({
      _id: id,
      userId,
    }).lean();

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction',
    });
  }
}

async function handleUpdateTransaction(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  id: string
) {
  try {
    const validation = validateRequestBody(UpdateTransactionSchema, {
      ...req.body,
      id,
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    const updateData = validation.data as UpdateTransactionInput;
    const userId = req.user.userId;

    const { id: transactionId, ...updates } = updateData;

    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, userId },
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction,
    });
  } catch (error) {
    console.error('Update transaction error:', error);

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
      message: 'Failed to update transaction',
    });
  }
}

async function handleDeleteTransaction(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  id: string
) {
  try {
    const userId = req.user.userId;

    const transaction = await Transaction.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
      data: { id: transaction._id },
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete transaction',
    });
  }
}

export default authMiddleware(handler);