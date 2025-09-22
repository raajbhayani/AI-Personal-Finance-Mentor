import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../../lib/db/mongodb';
import { authMiddleware } from '../../../lib/middleware/auth';
import { validateQueryParams } from '../../../lib/middleware/validation';
import { Transaction } from '../../../models/Transaction';
import {
  CategoryAnalysisSchema,
  type CategoryAnalysisInput,
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

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  const { type } = req.query;

  switch (type) {
    case 'summary':
      return handleGetSummary(req, res);
    case 'category':
      return handleGetCategoryAnalysis(req, res);
    case 'monthly':
      return handleGetMonthlyAnalysis(req, res);
    case 'balance':
      return handleGetBalanceAnalysis(req, res);
    default:
      return res.status(400).json({
        success: false,
        message: 'Invalid analytics type. Use "summary", "category", "monthly", or "balance"',
      });
  }
}

async function handleGetSummary(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const userId = req.user.userId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalBalance,
      monthlyExpenses,
      monthlyIncome,
      yearlyExpenses,
      yearlyIncome,
      transactionCount,
      recentTransactions,
    ] = await Promise.all([
      Transaction.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            income: {
              $sum: {
                $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
              }
            },
            expenses: {
              $sum: {
                $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
              }
            }
          }
        }
      ]),
      Transaction.aggregate([
        {
          $match: {
            userId,
            type: 'expense',
            date: { $gte: startOfMonth }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        {
          $match: {
            userId,
            type: 'income',
            date: { $gte: startOfMonth }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        {
          $match: {
            userId,
            type: 'expense',
            date: { $gte: startOfYear }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        {
          $match: {
            userId,
            type: 'income',
            date: { $gte: startOfYear }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.countDocuments({ userId }),
      Transaction.find({ userId })
        .sort({ date: -1 })
        .limit(5)
        .lean()
    ]);

    const balance = totalBalance[0] || { income: 0, expenses: 0 };
    const netBalance = balance.income - balance.expenses;

    return res.status(200).json({
      success: true,
      data: {
        totalBalance: netBalance,
        monthlyIncome: monthlyIncome[0]?.total || 0,
        monthlyExpenses: monthlyExpenses[0]?.total || 0,
        yearlyIncome: yearlyIncome[0]?.total || 0,
        yearlyExpenses: yearlyExpenses[0]?.total || 0,
        transactionCount,
        recentTransactions,
      },
    });
  } catch (error) {
    console.error('Summary analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate summary analytics',
    });
  }
}

async function handleGetCategoryAnalysis(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const validation = validateQueryParams(CategoryAnalysisSchema, req.query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: validation.errors,
      });
    }

    const { dateFrom, dateTo, type, currency, groupBy } = validation.data as CategoryAnalysisInput;
    const userId = req.user.userId;

    const matchConditions: any = {
      userId,
      date: { $gte: dateFrom, $lte: dateTo },
      currency,
    };

    if (type) {
      matchConditions.type = type;
    }

    const categoryAnalysis = await Transaction.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          averageAmount: { $avg: '$amount' },
          maxAmount: { $max: '$amount' },
          minAmount: { $min: '$amount' },
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    const timeSeriesData = await Transaction.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            ...(groupBy === 'day' && { day: { $dayOfMonth: '$date' } }),
            ...(groupBy === 'week' && { week: { $week: '$date' } }),
            category: '$category'
          },
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    return res.status(200).json({
      success: true,
      data: {
        categoryAnalysis,
        timeSeriesData,
        filters: { dateFrom, dateTo, type, currency, groupBy },
      },
    });
  } catch (error) {
    console.error('Category analysis error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate category analysis',
    });
  }
}

async function handleGetMonthlyAnalysis(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const userId = req.user.userId;
    const now = new Date();
    const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), 1);

    const monthlyData = await Transaction.aggregate([
      {
        $match: {
          userId,
          date: { $gte: lastYear }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: {
            year: '$_id.year',
            month: '$_id.month'
          },
          income: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'income'] }, '$totalAmount', 0]
            }
          },
          expenses: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'expense'] }, '$totalAmount', 0]
            }
          },
          transactionCount: { $sum: '$transactionCount' }
        }
      },
      {
        $addFields: {
          netIncome: { $subtract: ['$income', '$expenses'] },
          savingsRate: {
            $cond: [
              { $gt: ['$income', 0] },
              { $multiply: [{ $divide: [{ $subtract: ['$income', '$expenses'] }, '$income'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    return res.status(200).json({
      success: true,
      data: monthlyData,
    });
  } catch (error) {
    console.error('Monthly analysis error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate monthly analysis',
    });
  }
}

async function handleGetBalanceAnalysis(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const userId = req.user.userId;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const balanceHistory = await Transaction.aggregate([
      {
        $match: {
          userId,
          date: { $gte: thirtyDaysAgo }
        }
      },
      { $sort: { date: 1 } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' }
          },
          dailyIncome: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
            }
          },
          dailyExpenses: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
            }
          }
        }
      },
      {
        $addFields: {
          dailyNet: { $subtract: ['$dailyIncome', '$dailyExpenses'] }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    let runningBalance = 0;
    const balanceWithRunningTotal = balanceHistory.map(day => {
      runningBalance += day.dailyNet;
      return {
        ...day,
        runningBalance
      };
    });

    return res.status(200).json({
      success: true,
      data: balanceWithRunningTotal,
    });
  } catch (error) {
    console.error('Balance analysis error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate balance analysis',
    });
  }
}

export default authMiddleware(handler);