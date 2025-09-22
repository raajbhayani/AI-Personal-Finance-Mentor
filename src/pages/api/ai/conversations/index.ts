import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../../../lib/db/mongodb';
import { authMiddleware } from '../../../../lib/middleware/auth';
import { validateQueryParams } from '../../../../lib/middleware/validation';
import { Conversation } from '../../../../models/Conversation';
import { z } from 'zod';

const ConversationQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
  search: z.string().trim().min(1).optional(),
  tags: z.string().optional(),
  isActive: z.boolean().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
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

  switch (req.method) {
    case 'GET':
      return handleGetConversations(req, res);
    case 'DELETE':
      return handleBulkDeleteConversations(req, res);
    default:
      return res.status(405).json({
        success: false,
        message: 'Method not allowed',
      });
  }
}

async function handleGetConversations(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const validation = validateQueryParams(ConversationQuerySchema, req.query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: validation.errors,
      });
    }

    const query = validation.data;
    const userId = req.user.userId;

    const filter: any = { userId };

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.tags) {
      const tagList = query.tags.split(',').map(tag => tag.trim());
      filter.tags = { $in: tagList };
    }

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { 'messages.content': { $regex: query.search, $options: 'i' } },
      ];
    }

    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sortField = query.sortBy;

    const skip = (query.page - 1) * query.limit;

    const [conversations, totalCount] = await Promise.all([
      Conversation.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(query.limit)
        .select('title tags isActive createdAt updatedAt messages')
        .lean(),
      Conversation.countDocuments(filter),
    ]);

    const processedConversations = conversations.map(conv => ({
      id: conv._id,
      title: conv.title,
      tags: conv.tags,
      isActive: conv.isActive,
      messageCount: conv.messages?.length || 0,
      lastMessage: conv.messages && conv.messages.length > 0 ?
        conv.messages[conv.messages.length - 1] : null,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    }));

    const totalPages = Math.ceil(totalCount / query.limit);

    const tagStats = await Conversation.aggregate([
      { $match: { userId } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        conversations: processedConversations,
        pagination: {
          page: query.page,
          limit: query.limit,
          totalCount,
          totalPages,
          hasNext: query.page < totalPages,
          hasPrev: query.page > 1,
        },
        stats: {
          popularTags: tagStats.map(stat => ({
            tag: stat._id,
            count: stat.count,
          })),
        },
      },
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
    });
  }
}

async function handleBulkDeleteConversations(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Conversation IDs array is required',
      });
    }

    if (ids.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete more than 50 conversations at once',
      });
    }

    const userId = req.user.userId;

    const result = await Conversation.deleteMany({
      _id: { $in: ids },
      userId,
    });

    return res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} conversations`,
      data: {
        deletedCount: result.deletedCount,
        requestedCount: ids.length,
      },
    });
  } catch (error) {
    console.error('Bulk delete conversations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete conversations',
    });
  }
}

export default authMiddleware(handler);