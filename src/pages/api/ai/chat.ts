import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../../lib/db/mongodb';
import { authMiddleware } from '../../../lib/middleware/auth';
import { validateRequestBody } from '../../../lib/middleware/validation';
import { Conversation } from '../../../models/Conversation';
import { AIService, ConversationContext } from '../../../lib/services/aiService';
import { FinancialAnalysisService } from '../../../lib/services/financialAnalysis';
import { checkRateLimit, aiRateLimiter } from '../../../lib/services/rateLimiter';
import { z } from 'zod';

const ChatRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Message is required')
    .max(2000, 'Message cannot exceed 2000 characters'),
  conversationId: z.string().optional(),
  context: z.object({
    includeRecentTransactions: z.boolean().default(true),
    includeFinancialSummary: z.boolean().default(true),
    maxHistory: z.number().min(1).max(20).default(10),
  }).default({}),
});

type ChatRequest = z.infer<typeof ChatRequestSchema>;

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

    const rateLimitResult = await checkRateLimit(userId, aiRateLimiter);

    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: rateLimitResult.retryAfter,
      });
    }

    const validation = validateRequestBody(ChatRequestSchema, req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    const { message, conversationId, context } = validation.data as ChatRequest;

    let conversation = null;

    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        userId,
        isActive: true,
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found',
        });
      }
    }

    const financialAnalysis = new FinancialAnalysisService(userId);
    const aiService = new AIService();

    const [financialProfile, tags] = await Promise.all([
      context.includeFinancialSummary ? financialAnalysis.generateFinancialProfile() : null,
      aiService.classifyFinancialQuery(message),
    ]);

    if (!conversation) {
      const title = await aiService.generateConversationTitle(message);

      conversation = new Conversation({
        userId,
        title,
        messages: [],
        context: {
          lastAnalyzed: new Date(),
        },
        tags,
      });
    }

    const conversationContext: ConversationContext = {
      financialProfile: financialProfile!,
      recentMessages: conversation.messages
        .slice(-context.maxHistory)
        .map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
      conversationSummary: conversation.context.conversationSummary,
    };

    const startTime = Date.now();

    const aiResponse = await aiService.generateFinancialAdvice(
      message,
      conversationContext
    );

    const userMessage = {
      role: 'user' as const,
      content: message,
      timestamp: new Date(),
      metadata: {
        financialContext: context.includeFinancialSummary ? {
          balance: financialProfile?.totalBalance,
          savingsRate: financialProfile?.savingsRate,
        } : undefined,
      },
    };

    const assistantMessage = {
      role: 'assistant' as const,
      content: aiResponse.content,
      timestamp: new Date(),
      metadata: {
        processingTime: aiResponse.processingTime,
        tokenCount: aiResponse.usage ?
          aiResponse.usage.input_tokens + aiResponse.usage.output_tokens : undefined,
      },
    };

    conversation.messages.push(userMessage, assistantMessage);

    if (conversation.messages.length > 10) {
      const messagesToSummarize = conversation.messages.slice(0, -6);
      const summary = await aiService.summarizeConversation(
        messagesToSummarize.map(msg => ({
          role: msg.role,
          content: msg.content,
        }))
      );

      conversation.context.conversationSummary = summary;
      conversation.messages = conversation.messages.slice(-6);
    }

    if (financialProfile) {
      conversation.context.userFinancialProfile = {
        totalBalance: financialProfile.totalBalance,
        monthlyIncome: financialProfile.monthlyIncome,
        monthlyExpenses: financialProfile.monthlyExpenses,
        savingsRate: financialProfile.savingsRate,
        topCategories: financialProfile.topCategories,
        recentTransactions: context.includeRecentTransactions ?
          financialProfile.recentTransactions : [],
        goals: [],
        budgets: [],
      };
      conversation.context.lastAnalyzed = new Date();
    }

    conversation.tags = Array.from(new Set([...conversation.tags, ...tags]));

    await conversation.save();

    return res.status(200).json({
      success: true,
      data: {
        response: aiResponse.content,
        conversationId: conversation._id,
        metadata: {
          processingTime: aiResponse.processingTime,
          tokensUsed: aiResponse.usage,
          financialHealthScore: financialProfile?.financialHealth.score,
          tags,
        },
        conversation: {
          title: conversation.title,
          messageCount: conversation.messages.length,
          lastUpdated: conversation.updatedAt,
        },
      },
    });

  } catch (error) {
    console.error('AI chat error:', error);

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return res.status(500).json({
          success: false,
          message: 'AI service configuration error',
        });
      }

      if (error.message.includes('rate limit') || error.message.includes('quota')) {
        return res.status(429).json({
          success: false,
          message: 'AI service temporarily unavailable. Please try again later.',
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to process AI request',
    });
  }
}

export default authMiddleware(handler);