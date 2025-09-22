import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../../lib/db/mongodb';
import { authMiddleware } from '../../../lib/middleware/auth';
import { validateQueryParams } from '../../../lib/middleware/validation';
import { Budget } from '../../../models/Budget';
import { Transaction } from '../../../models/Transaction';
import { z } from 'zod';
import mongoose from 'mongoose';

const BudgetComparisonQuerySchema = z.object({
  budgetId: z.string().optional(),
  period: z.enum(['current', 'last', 'custom']).default('current'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  includeProjections: z.boolean().default(true),
  granularity: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
});

interface AuthenticatedRequest extends NextApiRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    await connectDB();

    const validation = validateQueryParams(BudgetComparisonQuerySchema, req.query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: validation.errors,
      });
    }

    const query = validation.data;
    const userId = req.user.userId;

    const [budget, actualSpending, budgetComparison, performanceMetrics] = await Promise.all([
      getBudgetData(userId, query),
      getActualSpending(userId, query),
      generateBudgetComparison(userId, query),
      calculatePerformanceMetrics(userId, query)
    ]);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'No budget found for the specified period',
      });
    }

    const analysis = generateBudgetAnalysis(budget, actualSpending, performanceMetrics);
    const projections = query.includeProjections ?
      generateBudgetProjections(budget, actualSpending, query.granularity) : null;

    return res.status(200).json({
      success: true,
      data: {
        budget: {
          id: budget._id,
          name: budget.name,
          period: budget.period,
          startDate: budget.startDate,
          endDate: budget.endDate,
          totalBudget: budget.totalBudget,
          categories: budget.categories,
        },
        actualSpending,
        comparison: budgetComparison,
        performance: performanceMetrics,
        analysis,
        projections,
        metadata: {
          generatedAt: new Date().toISOString(),
          period: query.period,
          granularity: query.granularity,
        },
      },
    });
  } catch (error) {
    console.error('Budget comparison error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate budget comparison',
    });
  }
}

async function getBudgetData(userId: string, query: any) {
  let budgetQuery: any = {
    userId: new mongoose.Types.ObjectId(userId),
    status: 'active',
  };

  if (query.budgetId) {
    budgetQuery._id = new mongoose.Types.ObjectId(query.budgetId);
  } else {
    const now = new Date();

    switch (query.period) {
      case 'current':
        budgetQuery.startDate = { $lte: now };
        budgetQuery.endDate = { $gte: now };
        break;
      case 'last':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        budgetQuery.startDate = { $lte: lastMonthEnd };
        budgetQuery.endDate = { $gte: lastMonth };
        break;
      case 'custom':
        if (query.startDate && query.endDate) {
          const startDate = new Date(query.startDate);
          const endDate = new Date(query.endDate);
          budgetQuery.startDate = { $lte: endDate };
          budgetQuery.endDate = { $gte: startDate };
        }
        break;
    }
  }

  return await Budget.findOne(budgetQuery).lean();
}

async function getActualSpending(userId: string, query: any) {
  const budget = await getBudgetData(userId, query);
  if (!budget) return null;

  const actualSpending = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        type: 'expense',
        date: {
          $gte: budget.startDate,
          $lte: budget.endDate,
        },
      },
    },
    {
      $group: {
        _id: '$category',
        totalSpent: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
        avgTransaction: { $avg: '$amount' },
        transactions: {
          $push: {
            amount: '$amount',
            description: '$description',
            date: '$date',
            merchant: '$merchant',
          },
        },
      },
    },
    { $sort: { totalSpent: -1 } },
  ]);

  const dailySpending = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        type: 'expense',
        date: {
          $gte: budget.startDate,
          $lte: budget.endDate,
        },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          category: '$category',
        },
        amount: { $sum: '$amount' },
      },
    },
    {
      $group: {
        _id: '$_id.date',
        total: { $sum: '$amount' },
        categories: {
          $push: {
            category: '$_id.category',
            amount: '$amount',
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return {
    categoryBreakdown: actualSpending,
    dailyBreakdown: dailySpending,
    totalSpent: actualSpending.reduce((sum, cat) => sum + cat.totalSpent, 0),
  };
}

async function generateBudgetComparison(userId: string, query: any) {
  const budget = await getBudgetData(userId, query);
  if (!budget) return null;

  const actualSpending = await getActualSpending(userId, query);
  if (!actualSpending) return null;

  const spendingMap = new Map(
    actualSpending.categoryBreakdown.map(cat => [cat._id, cat.totalSpent])
  );

  const comparison = budget.categories.map(budgetCat => {
    const actualSpent = spendingMap.get(budgetCat.category) || 0;
    const variance = budgetCat.budgetedAmount - actualSpent;
    const percentageUsed = budgetCat.budgetedAmount > 0 ?
      (actualSpent / budgetCat.budgetedAmount) * 100 : 0;

    let status: 'under' | 'on-track' | 'over' | 'warning' = 'on-track';
    if (percentageUsed > 100) {
      status = 'over';
    } else if (percentageUsed > 90) {
      status = 'warning';
    } else if (percentageUsed < 50) {
      status = 'under';
    }

    return {
      category: budgetCat.category,
      budgeted: budgetCat.budgetedAmount,
      actual: actualSpent,
      variance,
      percentageUsed,
      status,
      remainingBudget: Math.max(0, variance),
      daysInPeriod: Math.ceil(
        (budget.endDate.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24)
      ),
    };
  });

  const totalBudgeted = budget.totalBudget;
  const totalSpent = actualSpending.totalSpent;
  const totalVariance = totalBudgeted - totalSpent;
  const overallPercentageUsed = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  return {
    categories: comparison,
    overall: {
      budgeted: totalBudgeted,
      actual: totalSpent,
      variance: totalVariance,
      percentageUsed: overallPercentageUsed,
      status: overallPercentageUsed > 100 ? 'over' :
               overallPercentageUsed > 90 ? 'warning' :
               overallPercentageUsed < 50 ? 'under' : 'on-track',
    },
  };
}

async function calculatePerformanceMetrics(userId: string, query: any) {
  const budget = await getBudgetData(userId, query);
  if (!budget) return null;

  const now = new Date();
  const budgetStart = budget.startDate;
  const budgetEnd = budget.endDate;
  const totalDays = Math.ceil((budgetEnd.getTime() - budgetStart.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.min(totalDays, Math.ceil((now.getTime() - budgetStart.getTime()) / (1000 * 60 * 60 * 24)));
  const progressPercentage = (elapsedDays / totalDays) * 100;

  const actualSpending = await getActualSpending(userId, query);
  const spentPercentage = budget.totalBudget > 0 ?
    (actualSpending.totalSpent / budget.totalBudget) * 100 : 0;

  const burnRate = elapsedDays > 0 ? actualSpending.totalSpent / elapsedDays : 0;
  const projectedTotal = burnRate * totalDays;
  const projectedVariance = budget.totalBudget - projectedTotal;

  let healthScore = 100;
  if (spentPercentage > progressPercentage + 20) {
    healthScore -= 30;
  } else if (spentPercentage > progressPercentage + 10) {
    healthScore -= 15;
  }

  const categoriesOverBudget = budget.categories.filter(cat => {
    const actualSpent = actualSpending.categoryBreakdown
      .find(actual => actual._id === cat.category)?.totalSpent || 0;
    return actualSpent > cat.budgetedAmount;
  }).length;

  healthScore -= (categoriesOverBudget / budget.categories.length) * 20;

  const adherenceMetrics = budget.categories.map(cat => {
    const actualSpent = actualSpending.categoryBreakdown
      .find(actual => actual._id === cat.category)?.totalSpent || 0;
    const adherence = cat.budgetedAmount > 0 ?
      Math.min(100, (1 - Math.abs(cat.budgetedAmount - actualSpent) / cat.budgetedAmount) * 100) : 100;

    return {
      category: cat.category,
      adherence,
      budgeted: cat.budgetedAmount,
      actual: actualSpent,
    };
  });

  const avgAdherence = adherenceMetrics.reduce((sum, metric) => sum + metric.adherence, 0) / adherenceMetrics.length;

  return {
    progressPercentage,
    spentPercentage,
    burnRate,
    projectedTotal,
    projectedVariance,
    healthScore: Math.max(0, healthScore),
    adherenceRate: avgAdherence,
    categoriesOverBudget,
    totalCategories: budget.categories.length,
    elapsedDays,
    remainingDays: Math.max(0, totalDays - elapsedDays),
    categoryAdherence: adherenceMetrics,
  };
}

function generateBudgetAnalysis(budget: any, actualSpending: any, performance: any) {
  const insights = [];
  const recommendations = [];
  const alerts = [];

  if (performance.spentPercentage > performance.progressPercentage + 15) {
    insights.push('You are spending significantly faster than the budget timeline suggests.');
    recommendations.push('Review your recent expenses and identify areas where you can reduce spending.');
    alerts.push({
      type: 'warning',
      message: 'Spending pace is ahead of schedule',
      severity: 'high',
    });
  }

  if (performance.healthScore < 60) {
    insights.push('Your budget health score is concerning.');
    recommendations.push('Consider revising your budget or adjusting spending habits.');
    alerts.push({
      type: 'error',
      message: 'Poor budget performance detected',
      severity: 'critical',
    });
  }

  if (performance.categoriesOverBudget > 0) {
    insights.push(`${performance.categoriesOverBudget} categories have exceeded their budgets.`);
    recommendations.push('Focus on the categories that are over budget and find ways to reduce expenses.');
  }

  const topSpendingCategory = actualSpending.categoryBreakdown[0];
  if (topSpendingCategory) {
    const budgetCat = budget.categories.find((cat: any) => cat.category === topSpendingCategory._id);
    if (budgetCat && topSpendingCategory.totalSpent > budgetCat.budgetedAmount * 1.2) {
      insights.push(`${topSpendingCategory._id} spending is 20% above budget.`);
      recommendations.push(`Review your ${topSpendingCategory._id} expenses for optimization opportunities.`);
    }
  }

  if (performance.adherenceRate > 90) {
    insights.push('Excellent budget adherence! You are staying within your planned spending.');
  } else if (performance.adherenceRate < 70) {
    insights.push('Budget adherence needs improvement across multiple categories.');
    recommendations.push('Set up spending alerts and review your budget more frequently.');
  }

  return {
    insights,
    recommendations,
    alerts,
    summary: {
      overallStatus: performance.healthScore > 80 ? 'excellent' :
                    performance.healthScore > 60 ? 'good' :
                    performance.healthScore > 40 ? 'fair' : 'poor',
      keyMetric: `${performance.spentPercentage.toFixed(1)}% of budget used`,
      timeProgress: `${performance.progressPercentage.toFixed(1)}% through budget period`,
    },
  };
}

function generateBudgetProjections(budget: any, actualSpending: any, granularity: string) {
  const now = new Date();
  const budgetEnd = budget.endDate;
  const remainingDays = Math.max(0, Math.ceil((budgetEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  if (remainingDays === 0) {
    return {
      projections: [],
      summary: 'Budget period has ended',
    };
  }

  const dailyBurnRate = actualSpending.totalSpent /
    Math.max(1, Math.ceil((now.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24)));

  const categoryProjections = budget.categories.map((cat: any) => {
    const actualCat = actualSpending.categoryBreakdown.find((actual: any) => actual._id === cat.category);
    const currentSpent = actualCat?.totalSpent || 0;
    const categoryBurnRate = currentSpent /
      Math.max(1, Math.ceil((now.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24)));

    const projectedTotal = currentSpent + (categoryBurnRate * remainingDays);
    const projectedVariance = cat.budgetedAmount - projectedTotal;

    return {
      category: cat.category,
      currentSpent,
      budgeted: cat.budgetedAmount,
      projectedTotal,
      projectedVariance,
      projectedPercentage: cat.budgetedAmount > 0 ? (projectedTotal / cat.budgetedAmount) * 100 : 0,
      riskLevel: projectedVariance < 0 ? 'high' :
                 projectedVariance < cat.budgetedAmount * 0.1 ? 'medium' : 'low',
    };
  });

  const overallProjection = {
    currentSpent: actualSpending.totalSpent,
    budgeted: budget.totalBudget,
    projectedTotal: actualSpending.totalSpent + (dailyBurnRate * remainingDays),
    projectedVariance: budget.totalBudget - (actualSpending.totalSpent + (dailyBurnRate * remainingDays)),
    confidence: remainingDays > 10 ? 'medium' : 'high',
  };

  return {
    projections: categoryProjections,
    overall: overallProjection,
    assumptions: {
      basedOnCurrentSpendingRate: true,
      remainingDays,
      dailyBurnRate,
      granularity,
    },
  };
}

export default authMiddleware(handler);