import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../../lib/db/mongodb';
import { authMiddleware } from '../../../lib/middleware/auth';
import { validateQueryParams } from '../../../lib/middleware/validation';
import { Goal } from '../../../models/Goal';
import { Transaction } from '../../../models/Transaction';
import { z } from 'zod';
import mongoose from 'mongoose';

const GoalProgressQuerySchema = z.object({
  goalId: z.string().optional(),
  status: z.enum(['active', 'completed', 'paused', 'cancelled', 'all']).default('active'),
  timeframe: z.enum(['monthly', 'quarterly', 'yearly', 'all']).default('all'),
  includeProjections: z.boolean().default(true),
  includeHistory: z.boolean().default(true),
  sortBy: z.enum(['progress', 'targetDate', 'priority', 'createdAt']).default('targetDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
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

    const validation = validateQueryParams(GoalProgressQuerySchema, req.query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: validation.errors,
      });
    }

    const query = validation.data;
    const userId = req.user.userId;

    const [goals, progressData, overallMetrics] = await Promise.all([
      getGoalsWithProgress(userId, query),
      getDetailedProgressData(userId, query),
      calculateOverallMetrics(userId, query)
    ]);

    const analysis = generateGoalAnalysis(goals, progressData, overallMetrics);

    return res.status(200).json({
      success: true,
      data: {
        goals,
        progressData,
        overallMetrics,
        analysis,
        metadata: {
          generatedAt: new Date().toISOString(),
          totalGoals: goals.length,
          filters: query,
        },
      },
    });
  } catch (error) {
    console.error('Goal progress tracking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to track goal progress',
    });
  }
}

async function getGoalsWithProgress(userId: string, query: any) {
  let goalFilter: any = {
    userId: new mongoose.Types.ObjectId(userId),
  };

  if (query.status !== 'all') {
    goalFilter.status = query.status;
  }

  if (query.goalId) {
    goalFilter._id = new mongoose.Types.ObjectId(query.goalId);
  }

  const goals = await Goal.find(goalFilter)
    .sort({ [query.sortBy]: query.sortOrder === 'asc' ? 1 : -1 })
    .lean();

  const goalIds = goals.map(goal => goal._id);

  const contributions = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        linkedGoalId: { $in: goalIds },
        type: 'income',
      },
    },
    {
      $group: {
        _id: {
          goalId: '$linkedGoalId',
          month: { $dateToString: { format: '%Y-%m', date: '$date' } },
        },
        monthlyContribution: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.goalId',
        totalContributions: { $sum: '$monthlyContribution' },
        monthlyData: {
          $push: {
            month: '$_id.month',
            amount: '$monthlyContribution',
            count: '$transactionCount',
          },
        },
        avgMonthlyContribution: { $avg: '$monthlyContribution' },
        lastContributionMonth: { $max: '$_id.month' },
      },
    },
  ]);

  const contributionsMap = new Map(
    contributions.map(contrib => [contrib._id.toString(), contrib])
  );

  return goals.map(goal => {
    const contribution = contributionsMap.get(goal._id.toString()) || {
      totalContributions: 0,
      monthlyData: [],
      avgMonthlyContribution: 0,
      lastContributionMonth: null,
    };

    const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
    const remainingAmount = goal.targetAmount - goal.currentAmount;

    const now = new Date();
    const timeRemaining = goal.targetDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(timeRemaining / (1000 * 60 * 60 * 24)));
    const monthsRemaining = Math.max(1, daysRemaining / 30);

    const requiredMonthlyContribution = remainingAmount / monthsRemaining;
    const isOnTrack = contribution.avgMonthlyContribution >= requiredMonthlyContribution * 0.9;

    let status: 'on-track' | 'behind' | 'ahead' | 'completed' | 'at-risk' = 'on-track';
    if (goal.status === 'completed') {
      status = 'completed';
    } else if (daysRemaining < 30 && progressPercentage < 90) {
      status = 'at-risk';
    } else if (contribution.avgMonthlyContribution < requiredMonthlyContribution * 0.7) {
      status = 'behind';
    } else if (contribution.avgMonthlyContribution > requiredMonthlyContribution * 1.3) {
      status = 'ahead';
    }

    const milestoneProgress = goal.milestones?.map((milestone: any) => ({
      ...milestone,
      achieved: goal.currentAmount >= milestone.amount,
      progressToMilestone: Math.min(100, (goal.currentAmount / milestone.amount) * 100),
    })) || [];

    return {
      id: goal._id,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      priority: goal.priority,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      progressPercentage: Math.min(100, progressPercentage),
      remainingAmount,
      targetDate: goal.targetDate,
      startDate: goal.createdAt,
      status: goal.status,
      trackingStatus: status,
      daysRemaining,
      monthsRemaining: Math.ceil(monthsRemaining),
      requiredMonthlyContribution,
      actualMonthlyContribution: contribution.avgMonthlyContribution,
      totalContributions: contribution.totalContributions,
      isOnTrack,
      milestones: milestoneProgress,
      contributionHistory: contribution.monthlyData.sort((a: any, b: any) => a.month.localeCompare(b.month)),
      lastContribution: contribution.lastContributionMonth,
      projectedCompletion: calculateProjectedCompletion(goal, contribution),
    };
  });
}

async function getDetailedProgressData(userId: string, query: any) {
  const timeframe = getTimeframeFilter(query.timeframe);

  const progressHistory = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        linkedGoalId: { $exists: true },
        type: 'income',
        ...(timeframe && { date: timeframe }),
      },
    },
    {
      $lookup: {
        from: 'goals',
        localField: 'linkedGoalId',
        foreignField: '_id',
        as: 'goal',
      },
    },
    { $unwind: '$goal' },
    {
      $group: {
        _id: {
          goalId: '$linkedGoalId',
          period: { $dateToString: { format: '%Y-%m', date: '$date' } },
        },
        contributions: { $sum: '$amount' },
        transactions: { $sum: 1 },
        goalTitle: { $first: '$goal.title' },
        goalTarget: { $first: '$goal.targetAmount' },
        goalCategory: { $first: '$goal.category' },
      },
    },
    {
      $group: {
        _id: '$_id.goalId',
        goalTitle: { $first: '$goalTitle' },
        goalTarget: { $first: '$goalTarget' },
        goalCategory: { $first: '$goalCategory' },
        periodData: {
          $push: {
            period: '$_id.period',
            contributions: '$contributions',
            transactions: '$transactions',
          },
        },
        totalContributions: { $sum: '$contributions' },
      },
    },
    { $sort: { totalContributions: -1 } },
  ]);

  const categoryProgress = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        linkedGoalId: { $exists: true },
        type: 'income',
        ...(timeframe && { date: timeframe }),
      },
    },
    {
      $lookup: {
        from: 'goals',
        localField: 'linkedGoalId',
        foreignField: '_id',
        as: 'goal',
      },
    },
    { $unwind: '$goal' },
    {
      $group: {
        _id: '$goal.category',
        totalContributions: { $sum: '$amount' },
        goalCount: { $addToSet: '$linkedGoalId' },
        avgContribution: { $avg: '$amount' },
      },
    },
    {
      $addFields: {
        goalCount: { $size: '$goalCount' },
      },
    },
    { $sort: { totalContributions: -1 } },
  ]);

  const velocityAnalysis = await calculateGoalVelocity(userId, timeframe);

  return {
    progressHistory,
    categoryProgress,
    velocityAnalysis,
  };
}

async function calculateOverallMetrics(userId: string, query: any) {
  const timeframe = getTimeframeFilter(query.timeframe);

  const [overallStats, completionRates, upcomingMilestones] = await Promise.all([
    Goal.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          ...(query.status !== 'all' && { status: query.status }),
        },
      },
      {
        $group: {
          _id: null,
          totalGoals: { $sum: 1 },
          completedGoals: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          activeGoals: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
          },
          totalTargetAmount: { $sum: '$targetAmount' },
          totalCurrentAmount: { $sum: '$currentAmount' },
          avgProgress: {
            $avg: {
              $multiply: [
                { $divide: ['$currentAmount', '$targetAmount'] },
                100,
              ],
            },
          },
        },
      },
    ]),
    calculateCompletionRates(userId, timeframe),
    getUpcomingMilestones(userId, 30),
  ]);

  const stats = overallStats[0] || {
    totalGoals: 0,
    completedGoals: 0,
    activeGoals: 0,
    totalTargetAmount: 0,
    totalCurrentAmount: 0,
    avgProgress: 0,
  };

  const overallProgress = stats.totalTargetAmount > 0 ?
    (stats.totalCurrentAmount / stats.totalTargetAmount) * 100 : 0;

  return {
    totalGoals: stats.totalGoals,
    activeGoals: stats.activeGoals,
    completedGoals: stats.completedGoals,
    completionRate: stats.totalGoals > 0 ? (stats.completedGoals / stats.totalGoals) * 100 : 0,
    overallProgress: Math.min(100, overallProgress),
    avgGoalProgress: stats.avgProgress,
    totalTargetAmount: stats.totalTargetAmount,
    totalCurrentAmount: stats.totalCurrentAmount,
    remainingAmount: stats.totalTargetAmount - stats.totalCurrentAmount,
    completionRates,
    upcomingMilestones,
  };
}

function getTimeframeFilter(timeframe: string) {
  const now = new Date();

  switch (timeframe) {
    case 'monthly':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { $gte: monthStart };
    case 'quarterly':
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      return { $gte: quarterStart };
    case 'yearly':
      const yearStart = new Date(now.getFullYear(), 0, 1);
      return { $gte: yearStart };
    default:
      return null;
  }
}

async function calculateGoalVelocity(userId: string, timeframe: any) {
  const velocityData = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        linkedGoalId: { $exists: true },
        type: 'income',
        ...(timeframe && { date: timeframe }),
      },
    },
    {
      $group: {
        _id: {
          goalId: '$linkedGoalId',
          week: { $dateToString: { format: '%Y-W%U', date: '$date' } },
        },
        weeklyContribution: { $sum: '$amount' },
      },
    },
    {
      $group: {
        _id: '$_id.goalId',
        weeklyData: {
          $push: {
            week: '$_id.week',
            amount: '$weeklyContribution',
          },
        },
        avgWeeklyVelocity: { $avg: '$weeklyContribution' },
        maxWeeklyVelocity: { $max: '$weeklyContribution' },
        minWeeklyVelocity: { $min: '$weeklyContribution' },
      },
    },
  ]);

  return velocityData.map(goal => {
    const sortedWeeks = goal.weeklyData.sort((a: any, b: any) => a.week.localeCompare(b.week));
    const trend = calculateVelocityTrend(sortedWeeks);

    return {
      goalId: goal._id,
      avgWeeklyVelocity: goal.avgWeeklyVelocity,
      maxWeeklyVelocity: goal.maxWeeklyVelocity,
      minWeeklyVelocity: goal.minWeeklyVelocity,
      velocityTrend: trend,
      consistency: calculateVelocityConsistency(sortedWeeks),
      weeklyHistory: sortedWeeks,
    };
  });
}

async function calculateCompletionRates(userId: string, timeframe: any) {
  const completionData = await Goal.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        status: 'completed',
        ...(timeframe && { updatedAt: timeframe }),
      },
    },
    {
      $group: {
        _id: {
          category: '$category',
          month: { $dateToString: { format: '%Y-%m', date: '$updatedAt' } },
        },
        completedCount: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.category',
        totalCompleted: { $sum: '$completedCount' },
        monthlyData: {
          $push: {
            month: '$_id.month',
            completed: '$completedCount',
          },
        },
      },
    },
  ]);

  return completionData;
}

async function getUpcomingMilestones(userId: string, daysAhead: number) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

  const goals = await Goal.find({
    userId: new mongoose.Types.ObjectId(userId),
    status: 'active',
    'milestones.targetDate': { $lte: cutoffDate },
  }).lean();

  const upcomingMilestones = [];

  goals.forEach(goal => {
    goal.milestones?.forEach((milestone: any) => {
      if (milestone.targetDate <= cutoffDate && !milestone.achieved) {
        const progress = Math.min(100, (goal.currentAmount / milestone.targetAmount) * 100);
        const daysToMilestone = Math.ceil(
          (milestone.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        upcomingMilestones.push({
          goalId: goal._id,
          goalTitle: goal.title,
          milestoneTitle: milestone.title,
          targetAmount: milestone.targetAmount,
          currentProgress: progress,
          targetDate: milestone.targetDate,
          daysRemaining: Math.max(0, daysToMilestone),
          urgency: daysToMilestone <= 7 ? 'high' : daysToMilestone <= 14 ? 'medium' : 'low',
        });
      }
    });
  });

  return upcomingMilestones.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

function calculateProjectedCompletion(goal: any, contribution: any) {
  if (goal.status === 'completed') {
    return { date: goal.updatedAt, confidence: 'confirmed' };
  }

  const remainingAmount = goal.targetAmount - goal.currentAmount;
  const avgMonthlyContribution = contribution.avgMonthlyContribution;

  if (avgMonthlyContribution <= 0) {
    return { date: null, confidence: 'unknown' };
  }

  const monthsToCompletion = remainingAmount / avgMonthlyContribution;
  const projectedDate = new Date();
  projectedDate.setMonth(projectedDate.getMonth() + Math.ceil(monthsToCompletion));

  let confidence: 'high' | 'medium' | 'low' = 'medium';
  if (contribution.monthlyData.length > 6) {
    confidence = 'high';
  } else if (contribution.monthlyData.length < 3) {
    confidence = 'low';
  }

  return {
    date: projectedDate,
    confidence,
    monthsToCompletion: Math.ceil(monthsToCompletion),
  };
}

function calculateVelocityTrend(weeklyData: any[]) {
  if (weeklyData.length < 2) return 'stable';

  const firstHalf = weeklyData.slice(0, Math.floor(weeklyData.length / 2));
  const secondHalf = weeklyData.slice(Math.floor(weeklyData.length / 2));

  const firstHalfAvg = firstHalf.reduce((sum, week) => sum + week.amount, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, week) => sum + week.amount, 0) / secondHalf.length;

  const changePercentage = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

  if (Math.abs(changePercentage) < 10) return 'stable';
  return changePercentage > 0 ? 'increasing' : 'decreasing';
}

function calculateVelocityConsistency(weeklyData: any[]): number {
  if (weeklyData.length < 2) return 100;

  const amounts = weeklyData.map(week => week.amount);
  const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
  const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);

  const coefficientOfVariation = mean > 0 ? (stdDev / mean) * 100 : 100;
  return Math.max(0, 100 - coefficientOfVariation);
}

function generateGoalAnalysis(goals: any[], progressData: any, overallMetrics: any) {
  const insights = [];
  const recommendations = [];
  const alerts = [];

  if (overallMetrics.completionRate < 30) {
    insights.push('Your goal completion rate is low. Consider reviewing your goal-setting strategy.');
    recommendations.push('Break down large goals into smaller, more achievable milestones.');
  }

  const atRiskGoals = goals.filter(goal => goal.trackingStatus === 'at-risk').length;
  if (atRiskGoals > 0) {
    insights.push(`${atRiskGoals} goals are at risk of missing their target dates.`);
    recommendations.push('Focus on the most critical goals and consider extending deadlines if necessary.');
    alerts.push({
      type: 'warning',
      message: `${atRiskGoals} goals need immediate attention`,
      severity: 'high',
    });
  }

  const behindGoals = goals.filter(goal => goal.trackingStatus === 'behind').length;
  if (behindGoals > 0) {
    insights.push(`${behindGoals} goals are behind schedule.`);
    recommendations.push('Increase contributions or review goal timelines.');
  }

  if (overallMetrics.avgGoalProgress > 75) {
    insights.push('Great progress on your goals! You\'re on track for success.');
  }

  const upcomingMilestones = overallMetrics.upcomingMilestones.filter((m: any) => m.urgency === 'high').length;
  if (upcomingMilestones > 0) {
    alerts.push({
      type: 'info',
      message: `${upcomingMilestones} milestones due within a week`,
      severity: 'medium',
    });
  }

  const topPerformingCategory = progressData.categoryProgress[0];
  if (topPerformingCategory) {
    insights.push(`${topPerformingCategory._id} is your most successful goal category.`);
  }

  return {
    insights,
    recommendations,
    alerts,
    summary: {
      overallStatus: overallMetrics.completionRate > 70 ? 'excellent' :
                    overallMetrics.completionRate > 50 ? 'good' :
                    overallMetrics.completionRate > 30 ? 'fair' : 'needs-improvement',
      progressSummary: `${overallMetrics.avgGoalProgress.toFixed(1)}% average progress across all goals`,
      timeToCompletion: calculateAverageTimeToCompletion(goals),
    },
  };
}

function calculateAverageTimeToCompletion(goals: any[]): string {
  const activeGoals = goals.filter(goal => goal.status === 'active');
  if (activeGoals.length === 0) return 'No active goals';

  const totalMonths = activeGoals.reduce((sum, goal) => sum + goal.monthsRemaining, 0);
  const avgMonths = totalMonths / activeGoals.length;

  if (avgMonths < 1) return 'Less than 1 month';
  if (avgMonths < 12) return `${Math.ceil(avgMonths)} months`;
  return `${Math.ceil(avgMonths / 12)} years`;
}

export default authMiddleware(handler);