import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../../lib/db/mongodb';
import { authMiddleware } from '../../../lib/middleware/auth';
import { FinancialAnalysisService } from '../../../lib/services/financialAnalysis';
import { AIService } from '../../../lib/services/aiService';
import { aiRateLimiter } from '../../../lib/services/rateLimiter';

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

    try {
      const rateLimitCheck = await aiRateLimiter.checkLimit(userId);
      testResults.push({
        test: 'Rate Limiting',
        status: rateLimitCheck.allowed ? 'passed' : 'warning',
        message: rateLimitCheck.allowed ?
          `Rate limit OK. ${rateLimitCheck.remaining} requests remaining` :
          `Rate limit exceeded. Reset at ${new Date(rateLimitCheck.resetTime).toISOString()}`,
        remaining: rateLimitCheck.remaining,
      });
    } catch (error) {
      testResults.push({
        test: 'Rate Limiting',
        status: 'failed',
        message: 'Rate limiter error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    let financialProfile = null;
    try {
      const financialAnalysis = new FinancialAnalysisService(userId);
      financialProfile = await financialAnalysis.generateFinancialProfile();
      testResults.push({
        test: 'Financial Analysis',
        status: 'passed',
        message: 'Financial profile generated successfully',
        data: {
          balance: financialProfile.totalBalance,
          savingsRate: financialProfile.savingsRate,
          healthScore: financialProfile.financialHealth.score,
          categoriesAnalyzed: financialProfile.topCategories.length,
          insightsGenerated: financialProfile.insights.length,
        },
      });
    } catch (error) {
      testResults.push({
        test: 'Financial Analysis',
        status: 'failed',
        message: 'Financial analysis failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      testResults.push({
        test: 'AI Service Configuration',
        status: 'failed',
        message: 'AI API key environment variable is not set',
      });
    } else {
      testResults.push({
        test: 'AI Service Configuration',
        status: 'passed',
        message: 'API key is configured',
      });

      try {
        const aiService = new AIService();

        const testQuery = 'How can I improve my savings rate?';
        const tags = await aiService.classifyFinancialQuery(testQuery);
        testResults.push({
          test: 'Query Classification',
          status: 'passed',
          message: 'Query classified successfully',
          tags,
        });

        const title = await aiService.generateConversationTitle(testQuery);
        testResults.push({
          test: 'Title Generation',
          status: 'passed',
          message: 'Conversation title generated',
          title,
        });

        if (financialProfile) {
          const startTime = Date.now();

          const response = await aiService.generateFinancialAdvice(testQuery, {
            financialProfile,
            recentMessages: [],
          });

          const processingTime = Date.now() - startTime;

          testResults.push({
            test: 'AI Response Generation',
            status: 'passed',
            message: 'AI response generated successfully',
            data: {
              responseLength: response.content.length,
              processingTime: processingTime,
              tokensUsed: response.usage,
              truncatedResponse: response.content.substring(0, 200) + '...',
            },
          });
        }

      } catch (error) {
        testResults.push({
          test: 'AI Response Generation',
          status: 'failed',
          message: 'AI service failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const passedTests = testResults.filter(test => test.status === 'passed').length;
    const totalTests = testResults.length;
    const warningTests = testResults.filter(test => test.status === 'warning').length;

    return res.status(200).json({
      success: true,
      message: `AI integration test completed: ${passedTests}/${totalTests} tests passed`,
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
      rateLimitStats: aiRateLimiter.getStats(),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('AI integration test error:', error);
    return res.status(500).json({
      success: false,
      message: 'AI integration test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default authMiddleware(handler);