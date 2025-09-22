import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../../lib/db/mongodb';
import { authMiddleware } from '../../../lib/middleware/auth';
import { validateQueryParams } from '../../../lib/middleware/validation';
import { AnalyticsService } from '../../../lib/services/analyticsService';
import { z } from 'zod';

const ReportsQuerySchema = z.object({
  type: z.enum(['monthly', 'quarterly', 'yearly']).default('monthly'),
  year: z.number().int().min(2020).max(2030).default(new Date().getFullYear()),
  month: z.number().int().min(1).max(12).optional(),
  quarter: z.number().int().min(1).max(4).optional(),
  includeComparisons: z.boolean().default(true),
  includeProjections: z.boolean().default(false),
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

    const validation = validateQueryParams(ReportsQuerySchema, req.query);

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

    switch (query.type) {
      case 'monthly':
        return handleMonthlyReport(req, res, analyticsService, query);
      case 'quarterly':
        return handleQuarterlyReport(req, res, analyticsService, query);
      case 'yearly':
        return handleYearlyReport(req, res, analyticsService, query);
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type',
        });
    }
  } catch (error) {
    console.error('Analytics reports error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate analytics report',
    });
  }
}

async function handleMonthlyReport(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  analyticsService: AnalyticsService,
  query: any
) {
  const month = query.month || new Date().getMonth() + 1;
  const year = query.year;

  const [currentReport, comparisonData] = await Promise.all([
    analyticsService.generateMonthlyReport(year, month),
    query.includeComparisons ? generateComparisonData(analyticsService, year, month) : null,
  ]);

  const response: any = {
    success: true,
    data: {
      report: currentReport,
      metadata: {
        generatedAt: new Date().toISOString(),
        period: `${year}-${month.toString().padStart(2, '0')}`,
        type: 'monthly',
      },
    },
  };

  if (comparisonData) {
    response.data.comparisons = comparisonData;
  }

  return res.status(200).json(response);
}

async function handleQuarterlyReport(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  analyticsService: AnalyticsService,
  query: any
) {
  const quarter = query.quarter || Math.ceil((new Date().getMonth() + 1) / 3);
  const year = query.year;

  const quarterMonths = getQuarterMonths(quarter);
  const monthlyReports = await Promise.all(
    quarterMonths.map(month => analyticsService.generateMonthlyReport(year, month))
  );

  const quarterlyReport = aggregateMonthlyReports(monthlyReports, 'quarterly');

  return res.status(200).json({
    success: true,
    data: {
      report: quarterlyReport,
      monthlyBreakdown: monthlyReports,
      metadata: {
        generatedAt: new Date().toISOString(),
        period: `${year}-Q${quarter}`,
        type: 'quarterly',
      },
    },
  });
}

async function handleYearlyReport(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  analyticsService: AnalyticsService,
  query: any
) {
  const year = query.year;

  const monthlyReports = await Promise.all(
    Array.from({ length: 12 }, (_, i) =>
      analyticsService.generateMonthlyReport(year, i + 1)
    )
  );

  const yearlyReport = aggregateMonthlyReports(monthlyReports, 'yearly');
  const quarterlyBreakdown = [1, 2, 3, 4].map(quarter => {
    const quarterMonths = getQuarterMonths(quarter);
    const quarterReports = quarterMonths.map(month => monthlyReports[month - 1]);
    return aggregateMonthlyReports(quarterReports, 'quarterly');
  });

  return res.status(200).json({
    success: true,
    data: {
      report: yearlyReport,
      quarterlyBreakdown,
      monthlyBreakdown: monthlyReports,
      metadata: {
        generatedAt: new Date().toISOString(),
        period: year.toString(),
        type: 'yearly',
      },
    },
  });
}

async function generateComparisonData(
  analyticsService: AnalyticsService,
  year: number,
  month: number
) {
  const previousMonth = month === 1 ? 12 : month - 1;
  const previousYear = month === 1 ? year - 1 : year;
  const yearAgoMonth = month;
  const yearAgoYear = year - 1;

  const [previousMonthReport, yearAgoReport] = await Promise.all([
    analyticsService.generateMonthlyReport(previousYear, previousMonth),
    analyticsService.generateMonthlyReport(yearAgoYear, yearAgoMonth),
  ]);

  return {
    previousMonth: {
      period: `${previousYear}-${previousMonth.toString().padStart(2, '0')}`,
      income: previousMonthReport.income.total,
      expenses: previousMonthReport.expenses.total,
      balance: previousMonthReport.balance.net,
      savingsRate: previousMonthReport.balance.savingsRate,
    },
    yearAgo: {
      period: `${yearAgoYear}-${yearAgoMonth.toString().padStart(2, '0')}`,
      income: yearAgoReport.income.total,
      expenses: yearAgoReport.expenses.total,
      balance: yearAgoReport.balance.net,
      savingsRate: yearAgoReport.balance.savingsRate,
    },
  };
}

function getQuarterMonths(quarter: number): number[] {
  switch (quarter) {
    case 1:
      return [1, 2, 3];
    case 2:
      return [4, 5, 6];
    case 3:
      return [7, 8, 9];
    case 4:
      return [10, 11, 12];
    default:
      return [1, 2, 3];
  }
}

function aggregateMonthlyReports(reports: any[], period: 'quarterly' | 'yearly') {
  const totalIncome = reports.reduce((sum, report) => sum + report.income.total, 0);
  const totalExpenses = reports.reduce((sum, report) => sum + report.expenses.total, 0);

  const categoryTotals = new Map();
  reports.forEach(report => {
    report.expenses.categories.forEach((cat: any) => {
      const current = categoryTotals.get(cat.category) || { amount: 0, count: 0 };
      categoryTotals.set(cat.category, {
        amount: current.amount + cat.amount,
        count: current.count + cat.count,
      });
    });
  });

  const categories = Array.from(categoryTotals.entries()).map(([category, data]) => ({
    category,
    amount: data.amount,
    count: data.count,
    percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
  })).sort((a, b) => b.amount - a.amount);

  const budgetPerformance = {
    totalBudget: reports.reduce((sum, report) => sum + report.budgetPerformance.totalBudget, 0),
    totalSpent: totalExpenses,
    variance: 0,
    adherenceRate: 0,
    categoryBreakdown: [],
  };

  budgetPerformance.variance = budgetPerformance.totalBudget - budgetPerformance.totalSpent;
  budgetPerformance.adherenceRate = budgetPerformance.totalBudget > 0 ?
    (1 - Math.abs(budgetPerformance.variance) / budgetPerformance.totalBudget) * 100 : 0;

  const goalProgress = {
    totalGoals: Math.max(...reports.map(r => r.goalProgress.totalGoals), 0),
    activeGoals: Math.max(...reports.map(r => r.goalProgress.activeGoals), 0),
    onTrackGoals: Math.max(...reports.map(r => r.goalProgress.onTrackGoals), 0),
    completedThisMonth: reports.reduce((sum, report) => sum + report.goalProgress.completedThisMonth, 0),
    totalProgress: reports.reduce((sum, report) => sum + report.goalProgress.totalProgress, 0) / reports.length,
    goals: [],
  };

  const allInsights = reports.flatMap(report => report.insights);
  const uniqueInsights = Array.from(new Set(allInsights));

  return {
    period: {
      type: period,
      startDate: reports[0]?.period.startDate,
      endDate: reports[reports.length - 1]?.period.endDate,
    },
    income: {
      total: totalIncome,
      categories: [],
      growth: { amount: 0, percentage: 0 },
    },
    expenses: {
      total: totalExpenses,
      categories,
      growth: { amount: 0, percentage: 0 },
    },
    balance: {
      net: totalIncome - totalExpenses,
      savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
      runningTotal: reports[reports.length - 1]?.balance.runningTotal || 0,
    },
    budgetPerformance,
    goalProgress,
    insights: uniqueInsights.slice(0, 10),
    trends: {
      spendingTrend: 'stable' as const,
      topGrowthCategories: [],
      recommendations: [],
    },
  };
}

export default authMiddleware(handler);