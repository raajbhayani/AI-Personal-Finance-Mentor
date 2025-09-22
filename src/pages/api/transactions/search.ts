import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../../lib/db/mongodb';
import { authMiddleware } from '../../../lib/middleware/auth';
import { validateQueryParams } from '../../../lib/middleware/validation';
import { Transaction } from '../../../models/Transaction';
import { TransactionQuerySchema, type TransactionQuery } from '../../../lib/validation/transaction';

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

  return handleAdvancedSearch(req, res);
}

async function handleAdvancedSearch(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const validation = validateQueryParams(TransactionQuerySchema, req.query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid search parameters',
        errors: validation.errors,
      });
    }

    const query = validation.data as TransactionQuery;
    const userId = req.user.userId;

    const aggregationPipeline: any[] = [
      { $match: { userId } }
    ];

    const matchConditions: any = {};

    if (query.type) matchConditions.type = query.type;
    if (query.category) matchConditions.category = query.category;
    if (query.status) matchConditions.status = query.status;
    if (query.paymentMethod) matchConditions.paymentMethod = query.paymentMethod;
    if (query.currency) matchConditions.currency = query.currency;
    if (query.linkedGoalId) matchConditions.linkedGoalId = query.linkedGoalId;
    if (query.budgetId) matchConditions.budgetId = query.budgetId;
    if (query.isRecurring !== undefined) matchConditions.isRecurring = query.isRecurring;

    if (query.dateFrom || query.dateTo) {
      matchConditions.date = {};
      if (query.dateFrom) matchConditions.date.$gte = query.dateFrom;
      if (query.dateTo) matchConditions.date.$lte = query.dateTo;
    }

    if (query.amountMin || query.amountMax) {
      matchConditions.amount = {};
      if (query.amountMin) matchConditions.amount.$gte = query.amountMin;
      if (query.amountMax) matchConditions.amount.$lte = query.amountMax;
    }

    if (query.merchant) {
      matchConditions.merchant = { $regex: query.merchant, $options: 'i' };
    }

    if (query.tags && query.tags.length > 0) {
      matchConditions.tags = { $in: query.tags };
    }

    if (query.search) {
      matchConditions.$or = [
        { $text: { $search: query.search } },
        { description: { $regex: query.search, $options: 'i' } },
        { merchant: { $regex: query.search, $options: 'i' } },
        { notes: { $regex: query.search, $options: 'i' } },
        { category: { $regex: query.search, $options: 'i' } },
        { subcategory: { $regex: query.search, $options: 'i' } }
      ];
    }

    if (Object.keys(matchConditions).length > 0) {
      aggregationPipeline.push({ $match: matchConditions });
    }

    if (query.search && !query.search.includes(' ')) {
      aggregationPipeline.push({
        $addFields: {
          searchScore: {
            $cond: [
              { $regexMatch: { input: '$description', regex: query.search, options: 'i' } },
              10,
              {
                $cond: [
                  { $regexMatch: { input: '$merchant', regex: query.search, options: 'i' } },
                  5,
                  {
                    $cond: [
                      { $regexMatch: { input: '$category', regex: query.search, options: 'i' } },
                      3,
                      1
                    ]
                  }
                ]
              }
            ]
          }
        }
      });
    }

    const sortField = query.sortBy || 'date';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

    let sortStage: any = {};
    if (query.search && !query.search.includes(' ')) {
      sortStage = { searchScore: -1, [sortField]: sortOrder };
    } else {
      sortStage = { [sortField]: sortOrder };
    }

    aggregationPipeline.push({ $sort: sortStage });

    const facetPipeline = {
      transactions: [
        { $skip: (query.page - 1) * query.limit },
        { $limit: query.limit }
      ],
      totalCount: [
        { $count: 'total' }
      ],
      aggregations: [
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            avgAmount: { $avg: '$amount' },
            minAmount: { $min: '$amount' },
            maxAmount: { $max: '$amount' },
            categories: { $addToSet: '$category' },
            paymentMethods: { $addToSet: '$paymentMethod' },
            dateRange: {
              $push: {
                min: { $min: '$date' },
                max: { $max: '$date' }
              }
            }
          }
        }
      ]
    };

    aggregationPipeline.push({ $facet: facetPipeline });

    const results = await Transaction.aggregate(aggregationPipeline);

    const result = results[0];
    const transactions = result.transactions || [];
    const totalCount = result.totalCount[0]?.total || 0;
    const aggregations = result.aggregations[0] || {
      totalAmount: 0,
      avgAmount: 0,
      minAmount: 0,
      maxAmount: 0,
      categories: [],
      paymentMethods: [],
      dateRange: []
    };

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
        aggregations: {
          totalAmount: aggregations.totalAmount,
          avgAmount: aggregations.avgAmount,
          minAmount: aggregations.minAmount,
          maxAmount: aggregations.maxAmount,
          uniqueCategories: aggregations.categories.length,
          uniquePaymentMethods: aggregations.paymentMethods.filter(pm => pm !== null).length,
        },
        searchQuery: query.search,
        appliedFilters: {
          type: query.type,
          category: query.category,
          status: query.status,
          paymentMethod: query.paymentMethod,
          dateRange: query.dateFrom || query.dateTo ? {
            from: query.dateFrom,
            to: query.dateTo
          } : null,
          amountRange: query.amountMin || query.amountMax ? {
            min: query.amountMin,
            max: query.amountMax
          } : null,
          tags: query.tags,
        }
      },
    });
  } catch (error) {
    console.error('Advanced search error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to perform search',
    });
  }
}

export default authMiddleware(handler);