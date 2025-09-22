import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../../../lib/db/mongodb';
import { authMiddleware } from '../../../../lib/middleware/auth';
import { validateRequestBody } from '../../../../lib/middleware/validation';
import { Conversation } from '../../../../models/Conversation';
import { z } from 'zod';
import mongoose from 'mongoose';

const UpdateConversationSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  tags: z.array(z.string().trim().min(1).max(20)).max(20).optional(),
  isActive: z.boolean().optional(),
});

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
      message: 'Conversation ID is required',
    });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid conversation ID format',
    });
  }

  switch (req.method) {
    case 'GET':
      return handleGetConversation(req, res, id);
    case 'PUT':
      return handleUpdateConversation(req, res, id);
    case 'DELETE':
      return handleDeleteConversation(req, res, id);
    default:
      return res.status(405).json({
        success: false,
        message: 'Method not allowed',
      });
  }
}

async function handleGetConversation(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  id: string
) {
  try {
    const userId = req.user.userId;
    const { includeMessages = 'true' } = req.query;

    let selectFields = 'title tags isActive context createdAt updatedAt';
    if (includeMessages === 'true') {
      selectFields += ' messages';
    }

    const conversation = await Conversation.findOne({
      _id: id,
      userId,
    }).select(selectFields).lean();

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    const responseData: any = {
      id: conversation._id,
      title: conversation.title,
      tags: conversation.tags,
      isActive: conversation.isActive,
      context: conversation.context,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };

    if (includeMessages === 'true' && conversation.messages) {
      responseData.messages = conversation.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        metadata: msg.metadata,
      }));
      responseData.messageCount = conversation.messages.length;
    }

    return res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation',
    });
  }
}

async function handleUpdateConversation(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  id: string
) {
  try {
    const validation = validateRequestBody(UpdateConversationSchema, req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    const updates = validation.data;
    const userId = req.user.userId;

    const conversation = await Conversation.findOneAndUpdate(
      { _id: id, userId },
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('title tags isActive updatedAt');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Conversation updated successfully',
      data: {
        id: conversation._id,
        title: conversation.title,
        tags: conversation.tags,
        isActive: conversation.isActive,
        updatedAt: conversation.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update conversation error:', error);

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
      message: 'Failed to update conversation',
    });
  }
}

async function handleDeleteConversation(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  id: string
) {
  try {
    const userId = req.user.userId;

    const conversation = await Conversation.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully',
      data: { id: conversation._id },
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete conversation',
    });
  }
}

export default authMiddleware(handler);