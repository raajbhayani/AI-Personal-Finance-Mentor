import { GraphQLError } from 'graphql';

class AuthenticationError extends GraphQLError {
  constructor(message: string) {
    super(message, { extensions: { code: 'UNAUTHENTICATED' } });
  }
}

class UserInputError extends GraphQLError {
  constructor(message: string) {
    super(message, { extensions: { code: 'BAD_USER_INPUT' } });
  }
}

class ForbiddenError extends GraphQLError {
  constructor(message: string) {
    super(message, { extensions: { code: 'FORBIDDEN' } });
  }
}
import { Transaction } from '../../models/Transaction';
import { Goal } from '../../models/Goal';
import { User } from '../../models/User';
import mongoose from 'mongoose';
import type { Context } from '../context';

interface MonthlyReportFilters {
  year: number;
  month: number;
}

interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  previousAmount?: number;
  change?: number;
}

interface SpendingTrend {
  date: Date;
  amount: number;
  category?: string;
}

interface BudgetComparison {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercentage: number;
}

interface Achievement {
  id: string;
  type: string;
  title: string;
  description: string;
  amount?: number;
  date: Date;
  goalId?: string;
}

interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  category?: string;
}

export const reportResolvers = {
  Query: {
    getMonthlyReport: async (
      _: any,
      { year, month }: { year: number; month: number },
      context: Context
    ) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to access this resource');
      }

      try {
        // Validate input
        if (year < 2000 || year > new Date().getFullYear() + 1) {
          throw new UserInputError('Invalid year');
        }

        if (month < 1 || month > 12) {
          throw new UserInputError('Month must be between 1 and 12');
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        // Get transactions for the month
        const transactions = await Transaction.find({
          userId: context.user.id,
          date: { $gte: startDate, $lte: endDate },
        });

        // Calculate basic statistics
        const income = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const expenses = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const netIncome = income - expenses;
        const savingsRate = income > 0 ? (netIncome / income) * 100 : 0;

        // Category breakdown
        const categoryBreakdown = await this.calculateCategoryBreakdown(
          context.user.id,
          startDate,
          endDate,
          year,
          month - 1
        );

        // Spending trends (daily spending for the month)
        const spendingTrends = await this.calculateSpendingTrends(
          context.user.id,
          startDate,
          endDate
        );

        // Budget comparison (simplified - in real app would use budget data)
        const budgetComparison = await this.calculateBudgetComparison(
          categoryBreakdown,
          expenses
        );

        // Achievements for the month
        const achievements = await this.calculateAchievements(
          context.user.id,
          startDate,
          endDate,
          netIncome,
          savingsRate
        );

        // Recommendations based on spending patterns
        const recommendations = await this.generateRecommendations(
          categoryBreakdown,
          savingsRate,
          netIncome
        );

        const report = {
          id: `${context.user.id}-${year}-${month}`,
          userId: context.user.id,
          year,
          month,
          totalIncome: income,
          totalExpenses: expenses,
          netIncome,
          savingsRate,
          budgetAdherence: 85, // Simplified calculation
          categoryBreakdown,
          spendingTrends,
          budgetComparison,
          achievements,
          recommendations,
          generatedAt: new Date(),
        };

        return report;
      } catch (error) {
        console.error('Error generating monthly report:', error);
        if (error instanceof UserInputError) {
          throw error;
        }
        throw new Error('Failed to generate monthly report');
      }
    },

    getMonthlyReports: async (
      _: any,
      { year }: { year?: number },
      context: Context
    ) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to access this resource');
      }

      try {
        const targetYear = year || new Date().getFullYear();
        const reports = [];

        // Generate reports for each month of the year (up to current month)
        const currentDate = new Date();
        const maxMonth = targetYear === currentDate.getFullYear() ? currentDate.getMonth() + 1 : 12;

        for (let month = 1; month <= maxMonth; month++) {
          try {
            const report = await reportResolvers.Query.getMonthlyReport(
              _,
              { year: targetYear, month },
              context
            );
            reports.push(report);
          } catch (error) {
            console.error(`Error generating report for ${targetYear}-${month}:`, error);
            // Continue with next month if one fails
          }
        }

        return reports;
      } catch (error) {
        console.error('Error generating monthly reports:', error);
        throw new Error('Failed to generate monthly reports');
      }
    },

    getDashboardStats: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to access this resource');
      }

      try {
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        // Get transactions for current month
        const monthlyTransactions = await Transaction.find({
          userId: context.user.id,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        });

        // Get all transactions for total balance
        const allTransactions = await Transaction.find({
          userId: context.user.id,
        });

        const totalBalance = allTransactions.reduce((sum, t) => {
          return t.type === 'income' ? sum + t.amount : sum - t.amount;
        }, 0);

        const monthlyIncome = monthlyTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const monthlyExpenses = monthlyTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

        // Get goal statistics
        const goals = await Goal.find({ userId: context.user.id });
        const activeGoals = goals.filter(g => g.status === 'active').length;
        const completedGoals = goals.filter(g => g.status === 'completed').length;

        // Get top spending category
        const categoryTotals = monthlyTransactions
          .filter(t => t.type === 'expense')
          .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
          }, {} as Record<string, number>);

        const topSpendingCategory = Object.keys(categoryTotals).reduce((a, b) =>
          categoryTotals[a] > categoryTotals[b] ? a : b
        , 'other');

        return {
          totalBalance,
          monthlyIncome,
          monthlyExpenses,
          savingsRate,
          activeGoals,
          completedGoals,
          budgetAdherence: 85, // Simplified
          topSpendingCategory,
        };
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        throw new Error('Failed to fetch dashboard statistics');
      }
    },

    getCategoryStats: async (
      _: any,
      {
        dateFrom,
        dateTo,
        type,
      }: {
        dateFrom?: Date;
        dateTo?: Date;
        type?: 'INCOME' | 'EXPENSE';
      },
      context: Context
    ) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to access this resource');
      }

      try {
        let query: any = { userId: context.user.id };

        if (type) {
          query.type = type.toLowerCase();
        }

        if (dateFrom || dateTo) {
          query.date = {};
          if (dateFrom) query.date.$gte = new Date(dateFrom);
          if (dateTo) query.date.$lte = new Date(dateTo);
        }

        const stats = await Transaction.aggregate([
          { $match: query },
          {
            $group: {
              _id: '$category',
              totalAmount: { $sum: '$amount' },
              transactionCount: { $sum: 1 },
              averageAmount: { $avg: '$amount' },
            },
          },
          { $sort: { totalAmount: -1 } },
        ]);

        const totalAmount = stats.reduce((sum, stat) => sum + stat.totalAmount, 0);

        return stats.map(stat => ({
          category: stat._id,
          totalAmount: stat.totalAmount,
          transactionCount: stat.transactionCount,
          averageAmount: stat.averageAmount,
          percentage: totalAmount > 0 ? (stat.totalAmount / totalAmount) * 100 : 0,
        }));
      } catch (error) {
        console.error('Error fetching category stats:', error);
        throw new Error('Failed to fetch category statistics');
      }
    },
  },

  Mutation: {
    generateMonthlyReport: async (
      _: any,
      { year, month }: { year: number; month: number },
      context: Context
    ) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to generate a report');
      }

      try {
        // This is the same as getMonthlyReport but can be used for explicit generation
        return await reportResolvers.Query.getMonthlyReport(_, { year, month }, context);
      } catch (error) {
        console.error('Error generating monthly report:', error);
        throw new Error('Failed to generate monthly report');
      }
    },
  },

  MonthlyReport: {
    user: async (report: any) => {
      try {
        return await User.findById(report.userId).select('-password');
      } catch (error) {
        console.error('Error fetching report user:', error);
        throw new Error('Failed to fetch user data');
      }
    },
  },

  // Helper methods
  async calculateCategoryBreakdown(
    userId: string,
    startDate: Date,
    endDate: Date,
    year: number,
    previousMonth: number
  ): Promise<CategoryBreakdown[]> {
    const transactions = await Transaction.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
      type: 'expense',
    });

    // Get previous month's data for comparison
    const prevStartDate = new Date(year, previousMonth, 1);
    const prevEndDate = new Date(year, previousMonth + 1, 0);
    const prevTransactions = await Transaction.find({
      userId,
      date: { $gte: prevStartDate, $lte: prevEndDate },
      type: 'expense',
    });

    const categoryTotals = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const prevCategoryTotals = prevTransactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

    return Object.entries(categoryTotals).map(([category, amount]) => {
      const previousAmount = prevCategoryTotals[category] || 0;
      const change = previousAmount > 0 ? ((amount - previousAmount) / previousAmount) * 100 : 0;

      return {
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        transactionCount: transactions.filter(t => t.category === category).length,
        previousAmount,
        change,
      };
    });
  },

  async calculateSpendingTrends(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SpendingTrend[]> {
    const trends = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: startDate, $lte: endDate },
          type: 'expense',
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' },
          },
          amount: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return trends.map(trend => ({
      date: new Date(trend._id),
      amount: trend.amount,
    }));
  },

  async calculateBudgetComparison(
    categoryBreakdown: CategoryBreakdown[],
    totalExpenses: number
  ): Promise<BudgetComparison[]> {
    // Simplified budget comparison - in real app, would use actual budget data
    return categoryBreakdown.map(category => {
      const estimatedBudget = category.amount * 1.1; // 10% buffer
      const variance = estimatedBudget - category.amount;
      const variancePercentage = estimatedBudget > 0 ? (variance / estimatedBudget) * 100 : 0;

      return {
        category: category.category,
        budgeted: estimatedBudget,
        actual: category.amount,
        variance,
        variancePercentage,
      };
    });
  },

  async calculateAchievements(
    userId: string,
    startDate: Date,
    endDate: Date,
    netIncome: number,
    savingsRate: number
  ): Promise<Achievement[]> {
    const achievements: Achievement[] = [];

    // Savings achievement
    if (savingsRate > 20) {
      achievements.push({
        id: `${userId}-savings-${startDate.getTime()}`,
        type: 'SAVINGS',
        title: 'Great Saver!',
        description: `You saved ${savingsRate.toFixed(1)}% of your income this month`,
        amount: netIncome,
        date: endDate,
      });
    }

    // Goal completion achievements
    const completedGoals = await Goal.find({
      userId,
      status: 'completed',
      updatedAt: { $gte: startDate, $lte: endDate },
    });

    completedGoals.forEach(goal => {
      achievements.push({
        id: `${userId}-goal-${goal._id}`,
        type: 'GOAL_COMPLETED',
        title: 'Goal Achieved!',
        description: `Congratulations on completing "${goal.title}"`,
        amount: goal.targetAmount,
        date: goal.updatedAt,
        goalId: goal._id.toString(),
      });
    });

    return achievements;
  },

  async generateRecommendations(
    categoryBreakdown: CategoryBreakdown[],
    savingsRate: number,
    netIncome: number
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Savings recommendations
    if (savingsRate < 20) {
      recommendations.push({
        id: 'increase-savings',
        type: 'SAVINGS',
        title: 'Increase Your Savings Rate',
        description: 'Try to save at least 20% of your income each month for better financial health',
        priority: 'HIGH',
      });
    }

    // Category-specific recommendations
    const highestCategory = categoryBreakdown.reduce((prev, current) =>
      prev.amount > current.amount ? prev : current
    );

    if (highestCategory && highestCategory.percentage > 40) {
      recommendations.push({
        id: `reduce-${highestCategory.category}`,
        type: 'SPENDING',
        title: `Reduce ${highestCategory.category} Spending`,
        description: `You spent ${highestCategory.percentage.toFixed(1)}% of your budget on ${highestCategory.category}. Consider ways to reduce this expense.`,
        priority: 'MEDIUM',
        category: highestCategory.category,
      });
    }

    return recommendations;
  },
};