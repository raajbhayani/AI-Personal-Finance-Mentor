import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../../lib/db/mongodb';
import { authMiddleware } from '../../../lib/middleware/auth';
import { Transaction } from '../../../models/Transaction';
import { TransactionCategorySchema } from '../../../lib/validation/transaction';

interface AuthenticatedRequest extends NextApiRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  await connectDB();

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  const { action } = req.query;

  switch (action) {
    case 'list':
      return handleGetCategories(req, res);
    case 'usage':
      return handleGetCategoryUsage(req, res);
    case 'subcategories':
      return handleGetSubcategories(req, res);
    default:
      return handleGetCategories(req, res);
  }
}

async function handleGetCategories(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const predefinedCategories = TransactionCategorySchema.options;

    const categoryStats = await Transaction.aggregate([
      { $match: { userId: req.user.userId } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' },
          lastUsed: { $max: '$date' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const categoriesWithStats = predefinedCategories.map(category => {
      const stats = categoryStats.find(stat => stat._id === category);
      return {
        name: category,
        count: stats?.count || 0,
        totalAmount: stats?.totalAmount || 0,
        avgAmount: stats?.avgAmount || 0,
        lastUsed: stats?.lastUsed || null,
        isUsed: !!stats
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        categories: categoriesWithStats,
        totalCategories: predefinedCategories.length,
        usedCategories: categoryStats.length,
      },
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
    });
  }
}

async function handleGetCategoryUsage(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const userId = req.user.userId;
    const { period = 'month', type } = req.query;

    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = { date: { $gte: weekAgo } };
        break;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { date: { $gte: monthAgo } };
        break;
      case 'year':
        const yearAgo = new Date(now.getFullYear(), 0, 1);
        dateFilter = { date: { $gte: yearAgo } };
        break;
      default:
        dateFilter = {};
    }

    const matchConditions: any = {
      userId,
      ...dateFilter
    };

    if (type && (type === 'income' || type === 'expense')) {
      matchConditions.type = type;
    }

    const categoryUsage = await Transaction.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: {
            category: '$category',
            type: '$type'
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' },
          maxAmount: { $max: '$amount' },
          minAmount: { $min: '$amount' }
        }
      },
      {
        $group: {
          _id: '$_id.category',
          types: {
            $push: {
              type: '$_id.type',
              count: '$count',
              totalAmount: '$totalAmount',
              avgAmount: '$avgAmount',
              maxAmount: '$maxAmount',
              minAmount: '$minAmount'
            }
          },
          totalCount: { $sum: '$count' },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    const totalStats = await Transaction.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const enrichedUsage = categoryUsage.map(category => ({
      ...category,
      percentage: totalStats[0] ?
        ((category.totalAmount / totalStats[0].totalAmount) * 100).toFixed(2) : 0
    }));

    return res.status(200).json({
      success: true,
      data: {
        categoryUsage: enrichedUsage,
        summary: totalStats[0] || { totalTransactions: 0, totalAmount: 0 },
        period,
        filters: { type }
      },
    });
  } catch (error) {
    console.error('Get category usage error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch category usage',
    });
  }
}

async function handleGetSubcategories(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const userId = req.user.userId;
    const { category } = req.query;

    const matchConditions: any = { userId };

    if (category && typeof category === 'string') {
      matchConditions.category = category;
    }

    const subcategories = await Transaction.aggregate([
      {
        $match: {
          ...matchConditions,
          subcategory: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: {
            category: '$category',
            subcategory: '$subcategory'
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' },
          lastUsed: { $max: '$date' }
        }
      },
      {
        $group: {
          _id: '$_id.category',
          subcategories: {
            $push: {
              name: '$_id.subcategory',
              count: '$count',
              totalAmount: '$totalAmount',
              avgAmount: '$avgAmount',
              lastUsed: '$lastUsed'
            }
          }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    return res.status(200).json({
      success: true,
      data: subcategories,
    });
  } catch (error) {
    console.error('Get subcategories error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch subcategories',
    });
  }
}

export default authMiddleware(handler);