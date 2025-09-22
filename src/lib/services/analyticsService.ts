import mongoose from 'mongoose';
import { Transaction } from '../../models/Transaction';
import { Budget } from '../../models/Budget';
import { Goal } from '../../models/Goal';

export interface MonthlyReport {
  period: {
    year: number;
    month: number;
    startDate: Date;
    endDate: Date;
  };
  income: {
    total: number;
    categories: Array<{
      category: string;
      amount: number;
      count: number;
      percentage: number;
    }>;
    growth: {
      amount: number;
      percentage: number;
    };
  };
  expenses: {
    total: number;
    categories: Array<{
      category: string;
      amount: number;
      count: number;
      percentage: number;
      budget?: number;
      variance?: number;
    }>;
    growth: {
      amount: number;
      percentage: number;
    };
  };
  balance: {
    net: number;
    savingsRate: number;
    runningTotal: number;
  };
  budgetPerformance: {
    totalBudget: number;
    totalSpent: number;
    variance: number;
    adherenceRate: number;
    categoryBreakdown: Array<{
      category: string;
      budgeted: number;
      spent: number;
      variance: number;
      performance: 'under' | 'over' | 'on-track';
    }>;
  };
  goalProgress: {
    totalGoals: number;
    activeGoals: number;
    onTrackGoals: number;
    completedThisMonth: number;
    totalProgress: number;
    goals: Array<{
      id: string;
      title: string;
      progress: number;
      target: number;
      current: number;
      monthlyContribution: number;
      status: 'on-track' | 'behind' | 'ahead' | 'completed';
    }>;
  };
  insights: string[];
  trends: {
    spendingTrend: 'increasing' | 'decreasing' | 'stable';
    topGrowthCategories: Array<{
      category: string;
      growth: number;
    }>;
    recommendations: string[];
  };
}

export interface SpendingPattern {
  timeframe: 'daily' | 'weekly' | 'monthly' | 'yearly';
  patterns: Array<{
    period: string;
    income: number;
    expenses: number;
    net: number;
    categories: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
  }>;
  seasonality: {
    highestPeriod: string;
    lowestPeriod: string;
    variance: number;
  };
  recurring: {
    income: Array<{
      description: string;
      amount: number;
      frequency: string;
      nextDate: Date;
    }>;
    expenses: Array<{
      description: string;
      amount: number;
      frequency: string;
      nextDate: Date;
    }>;
  };
}

export class AnalyticsService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async generateMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const previousMonthStart = new Date(year, month - 2, 1);
    const previousMonthEnd = new Date(year, month - 1, 0, 23, 59, 59);

    const [
      currentMonthData,
      previousMonthData,
      budgetData,
      goalData,
      runningBalance
    ] = await Promise.all([
      this.getMonthlyTransactionData(startDate, endDate),
      this.getMonthlyTransactionData(previousMonthStart, previousMonthEnd),
      this.getBudgetPerformance(startDate, endDate),
      this.getGoalProgress(startDate, endDate),
      this.getRunningBalance(endDate)
    ]);

    const incomeGrowth = this.calculateGrowth(
      currentMonthData.income.total,
      previousMonthData.income.total
    );

    const expenseGrowth = this.calculateGrowth(
      currentMonthData.expenses.total,
      previousMonthData.expenses.total
    );

    const insights = this.generateInsights(currentMonthData, budgetData, goalData);
    const trends = this.analyzeTrends(currentMonthData, previousMonthData);

    return {
      period: {
        year,
        month,
        startDate,
        endDate,
      },
      income: {
        ...currentMonthData.income,
        growth: incomeGrowth,
      },
      expenses: {
        ...currentMonthData.expenses,
        growth: expenseGrowth,
      },
      balance: {
        net: currentMonthData.income.total - currentMonthData.expenses.total,
        savingsRate: currentMonthData.income.total > 0 ?
          ((currentMonthData.income.total - currentMonthData.expenses.total) / currentMonthData.income.total) * 100 : 0,
        runningTotal: runningBalance,
      },
      budgetPerformance: budgetData,
      goalProgress: goalData,
      insights,
      trends,
    };
  }

  private async getMonthlyTransactionData(startDate: Date, endDate: Date) {
    const aggregation = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(this.userId),
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            type: '$type',
            category: '$category',
          },
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.type',
          total: { $sum: '$amount' },
          categories: {
            $push: {
              category: '$_id.category',
              amount: '$amount',
              count: '$count',
            },
          },
        },
      },
    ]);

    const incomeData = aggregation.find(item => item._id === 'income') || {
      total: 0,
      categories: [],
    };

    const expenseData = aggregation.find(item => item._id === 'expense') || {
      total: 0,
      categories: [],
    };

    const processCategories = (categories: any[], total: number) =>
      categories.map(cat => ({
        ...cat,
        percentage: total > 0 ? (cat.amount / total) * 100 : 0,
      })).sort((a, b) => b.amount - a.amount);

    return {
      income: {
        total: incomeData.total,
        categories: processCategories(incomeData.categories, incomeData.total),
      },
      expenses: {
        total: expenseData.total,
        categories: processCategories(expenseData.categories, expenseData.total),
      },
    };
  }

  private async getBudgetPerformance(startDate: Date, endDate: Date) {
    const budgets = await Budget.find({
      userId: new mongoose.Types.ObjectId(this.userId),
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
      status: 'active',
    }).lean();

    if (!budgets.length) {
      return {
        totalBudget: 0,
        totalSpent: 0,
        variance: 0,
        adherenceRate: 0,
        categoryBreakdown: [],
      };
    }

    const budget = budgets[0];
    const spentByCategory = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(this.userId),
          type: 'expense',
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$category',
          spent: { $sum: '$amount' },
        },
      },
    ]);

    const spentMap = new Map(spentByCategory.map(item => [item._id, item.spent]));

    const categoryBreakdown = budget.categories.map(cat => {
      const spent = spentMap.get(cat.category) || 0;
      const variance = cat.budgetedAmount - spent;
      return {
        category: cat.category,
        budgeted: cat.budgetedAmount,
        spent,
        variance,
        performance: variance > 0 ? 'under' : variance < 0 ? 'over' : 'on-track' as 'under' | 'over' | 'on-track',
      };
    });

    const totalSpent = Array.from(spentMap.values()).reduce((sum, amount) => sum + amount, 0);
    const variance = budget.totalBudget - totalSpent;
    const adherenceRate = budget.totalBudget > 0 ? (1 - Math.abs(variance) / budget.totalBudget) * 100 : 0;

    return {
      totalBudget: budget.totalBudget,
      totalSpent,
      variance,
      adherenceRate: Math.max(0, adherenceRate),
      categoryBreakdown,
    };
  }

  private async getGoalProgress(startDate: Date, endDate: Date) {
    const goals = await Goal.find({
      userId: new mongoose.Types.ObjectId(this.userId),
      status: { $in: ['active', 'completed'] },
    }).lean();

    const monthlyContributions = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(this.userId),
          linkedGoalId: { $exists: true },
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$linkedGoalId',
          contribution: { $sum: '$amount' },
        },
      },
    ]);

    const contributionsMap = new Map(
      monthlyContributions.map(item => [item._id.toString(), item.contribution])
    );

    const completedThisMonth = goals.filter(goal =>
      goal.status === 'completed' &&
      goal.updatedAt >= startDate &&
      goal.updatedAt <= endDate
    ).length;

    const goalProgress = goals.map(goal => {
      const monthlyContribution = contributionsMap.get(goal._id.toString()) || 0;
      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      const now = new Date();
      const timeRemaining = goal.targetDate.getTime() - now.getTime();
      const monthsRemaining = Math.max(1, timeRemaining / (1000 * 60 * 60 * 24 * 30));
      const requiredMonthly = (goal.targetAmount - goal.currentAmount) / monthsRemaining;

      let status: 'on-track' | 'behind' | 'ahead' | 'completed' = 'on-track';
      if (goal.status === 'completed') {
        status = 'completed';
      } else if (monthlyContribution < requiredMonthly * 0.8) {
        status = 'behind';
      } else if (monthlyContribution > requiredMonthly * 1.2) {
        status = 'ahead';
      }

      return {
        id: goal._id.toString(),
        title: goal.title,
        progress: Math.min(100, progress),
        target: goal.targetAmount,
        current: goal.currentAmount,
        monthlyContribution,
        status,
      };
    });

    const onTrackGoals = goalProgress.filter(g => g.status === 'on-track' || g.status === 'ahead').length;
    const totalProgress = goalProgress.reduce((sum, goal) => sum + goal.progress, 0) / Math.max(1, goalProgress.length);

    return {
      totalGoals: goals.length,
      activeGoals: goals.filter(g => g.status === 'active').length,
      onTrackGoals,
      completedThisMonth,
      totalProgress,
      goals: goalProgress,
    };
  }

  private async getRunningBalance(endDate: Date): Promise<number> {
    const result = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(this.userId),
          date: { $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          income: {
            $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
          },
          expenses: {
            $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
          },
        },
      },
    ]);

    const data = result[0] || { income: 0, expenses: 0 };
    return data.income - data.expenses;
  }

  private calculateGrowth(current: number, previous: number) {
    if (previous === 0) {
      return { amount: current, percentage: current > 0 ? 100 : 0 };
    }

    const amount = current - previous;
    const percentage = (amount / previous) * 100;

    return { amount, percentage };
  }

  private generateInsights(monthData: any, budgetData: any, goalData: any): string[] {
    const insights = [];

    if (budgetData.adherenceRate < 70) {
      insights.push(`Budget adherence is low at ${budgetData.adherenceRate.toFixed(1)}%. Consider reviewing your spending habits.`);
    } else if (budgetData.adherenceRate > 95) {
      insights.push('Excellent budget adherence! You\'re staying within your planned spending.');
    }

    const topExpenseCategory = monthData.expenses.categories[0];
    if (topExpenseCategory && topExpenseCategory.percentage > 40) {
      insights.push(`${topExpenseCategory.category} accounts for ${topExpenseCategory.percentage.toFixed(1)}% of your expenses. Consider if this is optimal.`);
    }

    const savingsRate = monthData.income.total > 0 ?
      ((monthData.income.total - monthData.expenses.total) / monthData.income.total) * 100 : 0;

    if (savingsRate < 10) {
      insights.push('Your savings rate is below 10%. Try to reduce expenses or increase income.');
    } else if (savingsRate > 30) {
      insights.push('Great savings rate! Consider investing your surplus for better returns.');
    }

    if (goalData.onTrackGoals < goalData.activeGoals * 0.7) {
      insights.push('Some of your goals are falling behind schedule. Consider increasing contributions.');
    }

    return insights;
  }

  private analyzeTrends(current: any, previous: any) {
    const expenseChange = current.expenses.total - previous.expenses.total;
    const expensePercentageChange = previous.expenses.total > 0 ?
      (expenseChange / previous.expenses.total) * 100 : 0;

    let spendingTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (Math.abs(expensePercentageChange) > 5) {
      spendingTrend = expensePercentageChange > 0 ? 'increasing' : 'decreasing';
    }

    const topGrowthCategories = current.expenses.categories
      .map((cat: any) => {
        const prevCat = previous.expenses.categories.find((p: any) => p.category === cat.category);
        const growth = prevCat ? ((cat.amount - prevCat.amount) / prevCat.amount) * 100 : 100;
        return { category: cat.category, growth };
      })
      .filter((cat: any) => cat.growth > 10)
      .sort((a: any, b: any) => b.growth - a.growth)
      .slice(0, 3);

    const recommendations = [];
    if (spendingTrend === 'increasing') {
      recommendations.push('Your spending has increased. Review recent purchases and identify areas to cut back.');
    }

    if (topGrowthCategories.length > 0) {
      recommendations.push(`Monitor spending in ${topGrowthCategories[0].category} - it's grown significantly.`);
    }

    return {
      spendingTrend,
      topGrowthCategories,
      recommendations,
    };
  }

  async analyzeSpendingPatterns(timeframe: 'daily' | 'weekly' | 'monthly' | 'yearly', months: number = 12): Promise<SpendingPattern> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - months);

    const groupBy = this.getGroupByExpression(timeframe);

    const patterns = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(this.userId),
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            period: groupBy,
            type: '$type',
            category: '$category',
          },
          amount: { $sum: '$amount' },
        },
      },
      {
        $group: {
          _id: {
            period: '$_id.period',
            type: '$_id.type',
          },
          amount: { $sum: '$amount' },
          categories: {
            $push: {
              category: '$_id.category',
              amount: '$amount',
            },
          },
        },
      },
      {
        $group: {
          _id: '$_id.period',
          income: {
            $sum: { $cond: [{ $eq: ['$_id.type', 'income'] }, '$amount', 0] },
          },
          expenses: {
            $sum: { $cond: [{ $eq: ['$_id.type', 'expense'] }, '$amount', 0] },
          },
          expenseCategories: {
            $first: {
              $cond: [
                { $eq: ['$_id.type', 'expense'] },
                '$categories',
                [],
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const processedPatterns = patterns.map(pattern => ({
      period: this.formatPeriod(pattern._id, timeframe),
      income: pattern.income,
      expenses: pattern.expenses,
      net: pattern.income - pattern.expenses,
      categories: pattern.expenseCategories
        .map((cat: any) => ({
          category: cat.category,
          amount: cat.amount,
          percentage: pattern.expenses > 0 ? (cat.amount / pattern.expenses) * 100 : 0,
        }))
        .sort((a: any, b: any) => b.amount - a.amount)
        .slice(0, 5),
    }));

    const seasonality = this.analyzeSeasonality(processedPatterns);
    const recurring = await this.getRecurringTransactions();

    return {
      timeframe,
      patterns: processedPatterns,
      seasonality,
      recurring,
    };
  }

  private getGroupByExpression(timeframe: string) {
    switch (timeframe) {
      case 'daily':
        return { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
      case 'weekly':
        return { $dateToString: { format: '%Y-W%U', date: '$date' } };
      case 'monthly':
        return { $dateToString: { format: '%Y-%m', date: '$date' } };
      case 'yearly':
        return { $dateToString: { format: '%Y', date: '$date' } };
      default:
        return { $dateToString: { format: '%Y-%m', date: '$date' } };
    }
  }

  private formatPeriod(period: any, timeframe: string): string {
    return period.toString();
  }

  private analyzeSeasonality(patterns: any[]) {
    if (patterns.length === 0) {
      return {
        highestPeriod: '',
        lowestPeriod: '',
        variance: 0,
      };
    }

    const sortedByExpenses = [...patterns].sort((a, b) => b.expenses - a.expenses);
    const expenses = patterns.map(p => p.expenses);
    const avg = expenses.reduce((sum, exp) => sum + exp, 0) / expenses.length;
    const variance = expenses.reduce((sum, exp) => sum + Math.pow(exp - avg, 2), 0) / expenses.length;

    return {
      highestPeriod: sortedByExpenses[0]?.period || '',
      lowestPeriod: sortedByExpenses[sortedByExpenses.length - 1]?.period || '',
      variance: Math.sqrt(variance),
    };
  }

  private async getRecurringTransactions() {
    const recurringTransactions = await Transaction.find({
      userId: new mongoose.Types.ObjectId(this.userId),
      isRecurring: true,
      'recurringDetails.nextDue': { $exists: true },
    })
    .select('description amount type recurringDetails')
    .lean();

    const income = recurringTransactions
      .filter(t => t.type === 'income')
      .map(t => ({
        description: t.description,
        amount: t.amount,
        frequency: t.recurringDetails?.frequency || 'monthly',
        nextDate: t.recurringDetails?.nextDue || new Date(),
      }));

    const expenses = recurringTransactions
      .filter(t => t.type === 'expense')
      .map(t => ({
        description: t.description,
        amount: t.amount,
        frequency: t.recurringDetails?.frequency || 'monthly',
        nextDate: t.recurringDetails?.nextDue || new Date(),
      }));

    return { income, expenses };
  }
}