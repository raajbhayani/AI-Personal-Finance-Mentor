import { Transaction } from '../../models/Transaction';
import mongoose from 'mongoose';

export interface FinancialProfile {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  spendingTrends: {
    lastMonth: number;
    previousMonth: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    percentageChange: number;
  };
  topCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
    transactionCount: number;
  }>;
  recentTransactions: any[];
  financialHealth: {
    score: number;
    indicators: Array<{
      metric: string;
      value: number;
      status: 'good' | 'warning' | 'poor';
      recommendation: string;
    }>;
  };
  insights: string[];
}

export class FinancialAnalysisService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async generateFinancialProfile(): Promise<FinancialProfile> {
    const [
      balanceData,
      monthlyData,
      categoryData,
      recentTransactions,
      spendingTrends
    ] = await Promise.all([
      this.calculateBalance(),
      this.calculateMonthlyMetrics(),
      this.analyzeCategorySpending(),
      this.getRecentTransactions(),
      this.analyzeSpendingTrends()
    ]);

    const financialHealth = this.calculateFinancialHealth(balanceData, monthlyData, spendingTrends);
    const insights = this.generateInsights(balanceData, monthlyData, categoryData, spendingTrends);

    return {
      totalBalance: balanceData.balance,
      monthlyIncome: monthlyData.income,
      monthlyExpenses: monthlyData.expenses,
      savingsRate: monthlyData.savingsRate,
      spendingTrends,
      topCategories: categoryData,
      recentTransactions,
      financialHealth,
      insights,
    };
  }

  private async calculateBalance() {
    const result = await Transaction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(this.userId) } },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] }
          },
          totalExpenses: {
            $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] }
          }
        }
      }
    ]);

    const data = result[0] || { totalIncome: 0, totalExpenses: 0 };
    return {
      balance: data.totalIncome - data.totalExpenses,
      income: data.totalIncome,
      expenses: data.totalExpenses
    };
  }

  private async calculateMonthlyMetrics() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const result = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(this.userId),
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          income: {
            $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] }
          },
          expenses: {
            $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] }
          }
        }
      }
    ]);

    const data = result[0] || { income: 0, expenses: 0 };
    const savingsRate = data.income > 0 ? ((data.income - data.expenses) / data.income) * 100 : 0;

    return {
      income: data.income,
      expenses: data.expenses,
      savingsRate: Math.round(savingsRate * 100) / 100
    };
  }

  private async analyzeCategorySpending() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const result = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(this.userId),
          type: 'expense',
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { amount: -1 } },
      { $limit: 10 }
    ]);

    const totalExpenses = result.reduce((sum, item) => sum + item.amount, 0);

    return result.map(item => ({
      category: item._id,
      amount: item.amount,
      percentage: totalExpenses > 0 ? Math.round((item.amount / totalExpenses) * 100) : 0,
      transactionCount: item.count
    }));
  }

  private async getRecentTransactions() {
    return await Transaction.find({ userId: this.userId })
      .sort({ date: -1 })
      .limit(10)
      .lean()
      .select('amount description category type date merchant');
  }

  private async analyzeSpendingTrends() {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    const [currentExpenses, previousExpenses] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(this.userId),
            type: 'expense',
            date: { $gte: currentMonth }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(this.userId),
            type: 'expense',
            date: { $gte: previousMonth, $lt: currentMonth }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const current = currentExpenses[0]?.total || 0;
    const previous = previousExpenses[0]?.total || 0;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    let percentageChange = 0;

    if (previous > 0) {
      percentageChange = ((current - previous) / previous) * 100;
      if (Math.abs(percentageChange) > 5) {
        trend = percentageChange > 0 ? 'increasing' : 'decreasing';
      }
    }

    return {
      lastMonth: current,
      previousMonth: previous,
      trend,
      percentageChange: Math.round(percentageChange * 100) / 100
    };
  }

  private calculateFinancialHealth(balance: any, monthly: any, trends: any) {
    const indicators = [];
    let totalScore = 0;

    const savingsIndicator = {
      metric: 'Savings Rate',
      value: monthly.savingsRate,
      status: monthly.savingsRate >= 20 ? 'good' : monthly.savingsRate >= 10 ? 'warning' : 'poor' as 'good' | 'warning' | 'poor',
      recommendation: monthly.savingsRate < 10 ? 'Aim to save at least 10% of your income' : monthly.savingsRate < 20 ? 'Great progress! Try to reach 20% savings rate' : 'Excellent savings rate!'
    };
    indicators.push(savingsIndicator);
    totalScore += savingsIndicator.status === 'good' ? 40 : savingsIndicator.status === 'warning' ? 25 : 10;

    const spendingTrendIndicator = {
      metric: 'Spending Trend',
      value: trends.percentageChange,
      status: trends.trend === 'decreasing' ? 'good' : trends.trend === 'stable' ? 'warning' : 'poor' as 'good' | 'warning' | 'poor',
      recommendation: trends.trend === 'increasing' ? 'Your spending has increased. Review your recent purchases' : trends.trend === 'stable' ? 'Stable spending is good. Look for optimization opportunities' : 'Great job reducing your spending!'
    };
    indicators.push(spendingTrendIndicator);
    totalScore += spendingTrendIndicator.status === 'good' ? 30 : spendingTrendIndicator.status === 'warning' ? 20 : 5;

    const balanceIndicator = {
      metric: 'Account Balance',
      value: balance.balance,
      status: balance.balance > 0 ? 'good' : balance.balance > -1000 ? 'warning' : 'poor' as 'good' | 'warning' | 'poor',
      recommendation: balance.balance <= 0 ? 'Focus on increasing income or reducing expenses' : 'Positive balance is great! Consider investing surplus funds'
    };
    indicators.push(balanceIndicator);
    totalScore += balanceIndicator.status === 'good' ? 30 : balanceIndicator.status === 'warning' ? 15 : 0;

    return {
      score: Math.min(100, totalScore),
      indicators
    };
  }

  private generateInsights(balance: any, monthly: any, categories: any, trends: any): string[] {
    const insights = [];

    if (monthly.savingsRate < 10) {
      insights.push('Your savings rate is below the recommended 10%. Consider reducing expenses or increasing income.');
    } else if (monthly.savingsRate > 20) {
      insights.push('Excellent savings rate! You might consider investing your surplus for better returns.');
    }

    if (trends.trend === 'increasing' && trends.percentageChange > 15) {
      insights.push(`Your spending increased by ${trends.percentageChange.toFixed(1)}% this month. Review your recent purchases.`);
    }

    if (categories.length > 0) {
      const topCategory = categories[0];
      if (topCategory.percentage > 40) {
        insights.push(`You're spending ${topCategory.percentage}% of your budget on ${topCategory.category}. Consider if this is necessary.`);
      }
    }

    if (balance.balance < 0) {
      insights.push('You have a negative balance. Focus on reducing expenses and increasing income to improve your financial position.');
    }

    const expenseRatio = monthly.income > 0 ? (monthly.expenses / monthly.income) * 100 : 0;
    if (expenseRatio > 90) {
      insights.push('Your expenses are consuming most of your income. Look for areas to cut back.');
    }

    return insights;
  }
}