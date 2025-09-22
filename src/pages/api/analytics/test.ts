import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../../lib/db/mongodb';
import { authMiddleware } from '../../../lib/middleware/auth';
import { AnalyticsService } from '../../../lib/services/analyticsService';
import { analyticsCacheService } from '../../../lib/services/cacheService';
import { Transaction } from '../../../models/Transaction';
import { Budget } from '../../../models/Budget';
import { Goal } from '../../../models/Goal';

interface AuthenticatedRequest extends NextApiRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    await connectDB();

    const userId = req.user.userId;
    const testResults: any[] = [];

    testResults.push({
      test: 'Database Connection',
      status: 'passed',
      message: 'Successfully connected to MongoDB',
    });

    await testDatabaseQueries(userId, testResults);
    await testAnalyticsService(userId, testResults);
    await testCacheService(userId, testResults);
    await testAggregationPipelines(userId, testResults);
    await testPerformance(userId, testResults);

    const passedTests = testResults.filter(test => test.status === 'passed').length;
    const totalTests = testResults.length;
    const warningTests = testResults.filter(test => test.status === 'warning').length;

    return res.status(200).json({
      success: true,
      message: `Analytics system test completed: ${passedTests}/${totalTests} tests passed`,
      results: testResults,
      summary: {
        totalTests,
        passedTests,
        warningTests,
        failedTests: totalTests - passedTests - warningTests,
        successRate: `${((passedTests / totalTests) * 100).toFixed(1)}%`,
        systemHealth: passedTests === totalTests ? 'excellent' :
                     passedTests >= totalTests * 0.8 ? 'good' :
                     passedTests >= totalTests * 0.6 ? 'fair' : 'poor',
      },
      cacheStats: analyticsCacheService.getStats(),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Analytics test error:', error);
    return res.status(500).json({
      success: false,
      message: 'Analytics test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function testDatabaseQueries(userId: string, testResults: any[]) {
  try {
    const [transactionCount, budgetCount, goalCount] = await Promise.all([
      Transaction.countDocuments({ userId }),
      Budget.countDocuments({ userId }),
      Goal.countDocuments({ userId }),
    ]);

    testResults.push({
      test: 'Database Document Counts',
      status: 'passed',
      message: 'Successfully queried document counts',
      data: { transactionCount, budgetCount, goalCount },
    });

    if (transactionCount === 0) {
      testResults.push({
        test: 'Sample Data Availability',
        status: 'warning',
        message: 'No transactions found. Analytics will have limited data to work with.',
      });
    } else {
      testResults.push({
        test: 'Sample Data Availability',
        status: 'passed',
        message: `Found ${transactionCount} transactions for analytics`,
      });
    }

  } catch (error) {
    testResults.push({
      test: 'Database Queries',
      status: 'failed',
      message: 'Failed to query database',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function testAnalyticsService(userId: string, testResults: any[]) {
  try {
    const analyticsService = new AnalyticsService(userId);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const startTime = Date.now();
    const monthlyReport = await analyticsService.generateMonthlyReport(currentYear, currentMonth);
    const reportTime = Date.now() - startTime;

    testResults.push({
      test: 'Monthly Report Generation',
      status: 'passed',
      message: 'Monthly report generated successfully',
      processingTime: reportTime,
      data: {
        income: monthlyReport.income.total,
        expenses: monthlyReport.expenses.total,
        balance: monthlyReport.balance.net,
        savingsRate: monthlyReport.balance.savingsRate,
        categoriesAnalyzed: monthlyReport.expenses.categories.length,
      },
    });

    const patternsStartTime = Date.now();
    const spendingPatterns = await analyticsService.analyzeSpendingPatterns('monthly', 6);
    const patternsTime = Date.now() - patternsStartTime;

    testResults.push({
      test: 'Spending Patterns Analysis',
      status: 'passed',
      message: 'Spending patterns analyzed successfully',
      processingTime: patternsTime,
      data: {
        timeframe: spendingPatterns.timeframe,
        patternsCount: spendingPatterns.patterns.length,
        recurringTransactions: spendingPatterns.recurring.income.length + spendingPatterns.recurring.expenses.length,
      },
    });

  } catch (error) {
    testResults.push({
      test: 'Analytics Service',
      status: 'failed',
      message: 'Analytics service test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function testCacheService(userId: string, testResults: any[]) {
  try {
    const testKey = `test:${userId}:${Date.now()}`;
    const testData = { message: 'test data', timestamp: Date.now() };

    await analyticsCacheService.setFinancialSummary(userId, testData);
    const cachedData = await analyticsCacheService.getFinancialSummary(userId);

    if (cachedData && JSON.stringify(cachedData) === JSON.stringify(testData)) {
      testResults.push({
        test: 'Cache Service - Set/Get',
        status: 'passed',
        message: 'Cache set and get operations work correctly',
      });
    } else {
      testResults.push({
        test: 'Cache Service - Set/Get',
        status: 'failed',
        message: 'Cache data mismatch',
      });
    }

    await analyticsCacheService.invalidateUserData(userId);
    const afterInvalidate = await analyticsCacheService.getFinancialSummary(userId);

    if (afterInvalidate === null) {
      testResults.push({
        test: 'Cache Service - Invalidation',
        status: 'passed',
        message: 'Cache invalidation works correctly',
      });
    } else {
      testResults.push({
        test: 'Cache Service - Invalidation',
        status: 'failed',
        message: 'Cache invalidation failed',
      });
    }

    const cacheStats = analyticsCacheService.getStats();
    testResults.push({
      test: 'Cache Service - Stats',
      status: 'passed',
      message: 'Cache statistics retrieved',
      data: cacheStats,
    });

  } catch (error) {
    testResults.push({
      test: 'Cache Service',
      status: 'failed',
      message: 'Cache service test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function testAggregationPipelines(userId: string, testResults: any[]) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const categoryAggregation = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: 'expense',
          date: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avg: { $avg: '$amount' },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]);

    testResults.push({
      test: 'Category Aggregation Pipeline',
      status: 'passed',
      message: 'Category aggregation completed successfully',
      data: {
        categoriesFound: categoryAggregation.length,
        topCategory: categoryAggregation[0]?._id || 'None',
      },
    });

    const timeSeriesAggregation = await Transaction.aggregate([
      {
        $match: {
          userId,
          date: { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            type: '$type',
          },
          amount: { $sum: '$amount' },
        },
      },
      {
        $group: {
          _id: '$_id.date',
          income: {
            $sum: { $cond: [{ $eq: ['$_id.type', 'income'] }, '$amount', 0] },
          },
          expenses: {
            $sum: { $cond: [{ $eq: ['$_id.type', 'expense'] }, '$amount', 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    testResults.push({
      test: 'Time Series Aggregation Pipeline',
      status: 'passed',
      message: 'Time series aggregation completed successfully',
      data: {
        daysAnalyzed: timeSeriesAggregation.length,
      },
    });

  } catch (error) {
    testResults.push({
      test: 'Aggregation Pipelines',
      status: 'failed',
      message: 'Aggregation pipeline test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function testPerformance(userId: string, testResults: any[]) {
  try {
    const performanceTests = [
      {
        name: 'Large Dataset Query',
        test: async () => {
          const start = Date.now();
          await Transaction.find({ userId }).limit(1000).lean();
          return Date.now() - start;
        },
        threshold: 1000, // 1 second
      },
      {
        name: 'Complex Aggregation',
        test: async () => {
          const start = Date.now();
          await Transaction.aggregate([
            { $match: { userId } },
            {
              $group: {
                _id: {
                  category: '$category',
                  month: { $month: '$date' },
                },
                amount: { $sum: '$amount' },
              },
            },
            {
              $group: {
                _id: '$_id.category',
                monthlyData: {
                  $push: {
                    month: '$_id.month',
                    amount: '$amount',
                  },
                },
                total: { $sum: '$amount' },
              },
            },
          ]);
          return Date.now() - start;
        },
        threshold: 2000, // 2 seconds
      },
    ];

    for (const perfTest of performanceTests) {
      try {
        const executionTime = await perfTest.test();
        const status = executionTime <= perfTest.threshold ? 'passed' : 'warning';

        testResults.push({
          test: `Performance - ${perfTest.name}`,
          status,
          message: `Execution time: ${executionTime}ms (threshold: ${perfTest.threshold}ms)`,
          executionTime,
          threshold: perfTest.threshold,
        });
      } catch (error) {
        testResults.push({
          test: `Performance - ${perfTest.name}`,
          status: 'failed',
          message: 'Performance test failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

  } catch (error) {
    testResults.push({
      test: 'Performance Testing',
      status: 'failed',
      message: 'Performance testing failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default authMiddleware(handler);