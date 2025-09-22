import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../../lib/db/mongodb';
import { authMiddleware } from '../../../lib/middleware/auth';
import { validateQueryParams } from '../../../lib/middleware/validation';
import { AnalyticsService } from '../../../lib/services/analyticsService';
import { Transaction } from '../../../models/Transaction';
import { z } from 'zod';
import mongoose from 'mongoose';

const PatternsQuerySchema = z.object({
  timeframe: z.enum(['daily', 'weekly', 'monthly', 'yearly']).default('monthly'),
  months: z.number().int().min(1).max(36).default(12),
  category: z.string().optional(),
  analysisType: z.enum(['spending', 'income', 'both']).default('both'),
  includeForecasting: z.boolean().default(false),
  groupBy: z.enum(['category', 'merchant', 'paymentMethod']).optional(),
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

    const validation = validateQueryParams(PatternsQuerySchema, req.query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: validation.errors,
      });
    }

    const query = validation.data;
    const userId = req.user.userId;
    const analyticsService = new AnalyticsService(userId);

    const [
      spendingPatterns,
      categoryAnalysis,
      trendAnalysis,
      anomalies
    ] = await Promise.all([
      analyticsService.analyzeSpendingPatterns(query.timeframe, query.months),
      generateCategoryAnalysis(userId, query),
      generateTrendAnalysis(userId, query),
      detectSpendingAnomalies(userId, query.months)
    ]);

    const forecasting = query.includeForecasting ?
      await generateForecast(userId, query.timeframe, query.months) : null;

    return res.status(200).json({
      success: true,
      data: {
        patterns: spendingPatterns,
        categoryAnalysis,
        trendAnalysis,
        anomalies,
        forecasting,
        metadata: {
          generatedAt: new Date().toISOString(),
          timeframe: query.timeframe,
          monthsAnalyzed: query.months,
          includeForecasting: query.includeForecasting,
        },
      },
    });
  } catch (error) {
    console.error('Spending patterns analysis error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze spending patterns',
    });
  }
}

async function generateCategoryAnalysis(userId: string, query: any) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(endDate.getMonth() - query.months);

  const pipeline: any[] = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
        ...(query.category && { category: query.category }),
        ...(query.analysisType !== 'both' && { type: query.analysisType }),
      },
    },
  ];

  if (query.groupBy) {
    pipeline.push(
      {
        $group: {
          _id: {
            category: '$category',
            [query.groupBy]: `$${query.groupBy}`,
            month: { $dateToString: { format: '%Y-%m', date: '$date' } },
          },
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
        },
      },
      {
        $group: {
          _id: {
            category: '$_id.category',
            [query.groupBy]: `$_id.${query.groupBy}`,
          },
          totalAmount: { $sum: '$amount' },
          totalCount: { $sum: '$count' },
          avgMonthlyAmount: { $avg: '$amount' },
          months: { $addToSet: '$_id.month' },
        },
      },
      {
        $addFields: {
          monthsActive: { $size: '$months' },
          consistency: {
            $divide: [{ $size: '$months' }, query.months],
          },
        },
      },
      { $sort: { totalAmount: -1 } }
    );
  } else {
    pipeline.push(
      {
        $group: {
          _id: {
            category: '$category',
            month: { $dateToString: { format: '%Y-%m', date: '$date' } },
          },
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.category',
          totalAmount: { $sum: '$amount' },
          avgMonthlyAmount: { $avg: '$amount' },
          months: { $addToSet: '$_id.month' },
          monthlyData: {
            $push: {
              month: '$_id.month',
              amount: '$amount',
              count: '$count',
            },
          },
        },
      },
      {
        $addFields: {
          monthsActive: { $size: '$months' },
          consistency: { $divide: [{ $size: '$months' }, query.months] },
          variance: {
            $stdDevPop: '$monthlyData.amount',
          },
        },
      },
      { $sort: { totalAmount: -1 } }
    );
  }

  const results = await Transaction.aggregate(pipeline);

  return results.map(item => ({
    category: item._id.category,
    [query.groupBy]: query.groupBy ? item._id[query.groupBy] : undefined,
    totalAmount: item.totalAmount,
    avgMonthlyAmount: item.avgMonthlyAmount,
    monthsActive: item.monthsActive,
    consistency: item.consistency,
    variance: item.variance || 0,
    trend: calculateTrend(item.monthlyData || []),
  })).filter(item => item.totalAmount > 0);
}

async function generateTrendAnalysis(userId: string, query: any) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(endDate.getMonth() - query.months);

  const trendData = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
        ...(query.analysisType !== 'both' && { type: query.analysisType }),
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          type: '$type',
        },
        amount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: {
          year: '$_id.year',
          month: '$_id.month',
        },
        income: {
          $sum: { $cond: [{ $eq: ['$_id.type', 'income'] }, '$amount', 0] },
        },
        expenses: {
          $sum: { $cond: [{ $eq: ['$_id.type', 'expense'] }, '$amount', 0] },
        },
        transactionCount: { $sum: '$count' },
      },
    },
    {
      $addFields: {
        net: { $subtract: ['$income', '$expenses'] },
        savingsRate: {
          $cond: [
            { $gt: ['$income', 0] },
            { $multiply: [{ $divide: [{ $subtract: ['$income', '$expenses'] }, '$income'] }, 100] },
            0,
          ],
        },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const trends = {
    income: calculateTrendMetrics(trendData.map(d => d.income)),
    expenses: calculateTrendMetrics(trendData.map(d => d.expenses)),
    net: calculateTrendMetrics(trendData.map(d => d.net)),
    savingsRate: calculateTrendMetrics(trendData.map(d => d.savingsRate)),
  };

  const volatility = {
    income: calculateVolatility(trendData.map(d => d.income)),
    expenses: calculateVolatility(trendData.map(d => d.expenses)),
    net: calculateVolatility(trendData.map(d => d.net)),
  };

  return {
    monthlyData: trendData,
    trends,
    volatility,
    insights: generateTrendInsights(trends, volatility),
  };
}

async function detectSpendingAnomalies(userId: string, months: number) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(endDate.getMonth() - months);

  const monthlySpending = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        type: 'expense',
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          category: '$category',
        },
        amount: { $sum: '$amount' },
      },
    },
    {
      $group: {
        _id: '$_id.category',
        monthlyAmounts: { $push: '$amount' },
        avgAmount: { $avg: '$amount' },
        stdDev: { $stdDevPop: '$amount' },
      },
    },
  ]);

  const anomalies = monthlySpending.map(category => {
    const { monthlyAmounts, avgAmount, stdDev } = category;
    const threshold = avgAmount + 2 * stdDev;

    const anomalousMonths = monthlyAmounts
      .map((amount: number, index: number) => ({
        amount,
        index,
        isAnomaly: amount > threshold,
        severity: amount > threshold ? (amount - threshold) / avgAmount : 0,
      }))
      .filter((month: any) => month.isAnomaly);

    return {
      category: category._id,
      avgAmount,
      threshold,
      anomalousMonths,
      anomalyCount: anomalousMonths.length,
    };
  }).filter(cat => cat.anomalyCount > 0);

  return anomalies;
}

async function generateForecast(userId: string, timeframe: string, historicalMonths: number) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(endDate.getMonth() - historicalMonths);

  const historicalData = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          type: '$type',
        },
        amount: { $sum: '$amount' },
      },
    },
    {
      $group: {
        _id: { year: '$_id.year', month: '$_id.month' },
        income: {
          $sum: { $cond: [{ $eq: ['$_id.type', 'income'] }, '$amount', 0] },
        },
        expenses: {
          $sum: { $cond: [{ $eq: ['$_id.type', 'expense'] }, '$amount', 0] },
        },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const forecastPeriods = 3;
  const incomeForecast = generateSimpleForecast(
    historicalData.map(d => d.income),
    forecastPeriods
  );
  const expensesForecast = generateSimpleForecast(
    historicalData.map(d => d.expenses),
    forecastPeriods
  );

  const forecast = Array.from({ length: forecastPeriods }, (_, i) => {
    const futureDate = new Date(endDate);
    futureDate.setMonth(futureDate.getMonth() + i + 1);

    return {
      period: `${futureDate.getFullYear()}-${(futureDate.getMonth() + 1).toString().padStart(2, '0')}`,
      income: incomeForecast[i],
      expenses: expensesForecast[i],
      net: incomeForecast[i] - expensesForecast[i],
      confidence: Math.max(0.5, 1 - (i * 0.15)),
    };
  });

  return {
    forecast,
    model: 'simple_moving_average',
    confidence: 'medium',
    disclaimer: 'Forecasts are estimates based on historical data and should not be considered financial advice.',
  };
}

function calculateTrend(monthlyData: any[]): 'increasing' | 'decreasing' | 'stable' {
  if (monthlyData.length < 2) return 'stable';

  const sortedData = monthlyData.sort((a, b) => a.month.localeCompare(b.month));
  const firstHalf = sortedData.slice(0, Math.floor(sortedData.length / 2));
  const secondHalf = sortedData.slice(Math.floor(sortedData.length / 2));

  const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.amount, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.amount, 0) / secondHalf.length;

  const changePercentage = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

  if (Math.abs(changePercentage) < 10) return 'stable';
  return changePercentage > 0 ? 'increasing' : 'decreasing';
}

function calculateTrendMetrics(data: number[]) {
  if (data.length < 2) return { trend: 'stable', slope: 0, growth: 0 };

  const n = data.length;
  const xSum = (n * (n - 1)) / 2;
  const ySum = data.reduce((sum, val) => sum + val, 0);
  const xySum = data.reduce((sum, val, i) => sum + i * val, 0);
  const xSqSum = (n * (n - 1) * (2 * n - 1)) / 6;

  const slope = (n * xySum - xSum * ySum) / (n * xSqSum - xSum * xSum);
  const growth = data.length > 1 ? ((data[data.length - 1] - data[0]) / data[0]) * 100 : 0;

  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (Math.abs(slope) > 0.1) {
    trend = slope > 0 ? 'increasing' : 'decreasing';
  }

  return { trend, slope, growth };
}

function calculateVolatility(data: number[]): number {
  if (data.length < 2) return 0;

  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  return Math.sqrt(variance);
}

function generateTrendInsights(trends: any, volatility: any): string[] {
  const insights = [];

  if (trends.income.trend === 'increasing') {
    insights.push(`Your income is trending upward with ${trends.income.growth.toFixed(1)}% growth.`);
  } else if (trends.income.trend === 'decreasing') {
    insights.push(`Your income is declining by ${Math.abs(trends.income.growth).toFixed(1)}%.`);
  }

  if (trends.expenses.trend === 'increasing') {
    insights.push(`Your expenses are increasing by ${trends.expenses.growth.toFixed(1)}%.`);
  } else if (trends.expenses.trend === 'decreasing') {
    insights.push(`Great job reducing expenses by ${Math.abs(trends.expenses.growth).toFixed(1)}%.`);
  }

  if (volatility.expenses > volatility.income * 1.5) {
    insights.push('Your expenses are more volatile than your income. Consider creating a more stable budget.');
  }

  if (trends.savingsRate.trend === 'increasing') {
    insights.push('Your savings rate is improving over time.');
  } else if (trends.savingsRate.trend === 'decreasing') {
    insights.push('Your savings rate is declining. Review your spending habits.');
  }

  return insights;
}

function generateSimpleForecast(data: number[], periods: number): number[] {
  if (data.length === 0) return Array(periods).fill(0);

  const windowSize = Math.min(3, data.length);
  const recentData = data.slice(-windowSize);
  const average = recentData.reduce((sum, val) => sum + val, 0) / recentData.length;

  const trend = data.length > 1 ? (data[data.length - 1] - data[data.length - 2]) : 0;

  return Array.from({ length: periods }, (_, i) => Math.max(0, average + trend * (i + 1)));
}

export default authMiddleware(handler);