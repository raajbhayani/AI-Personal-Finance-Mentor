import Anthropic from '@anthropic-ai/sdk';
import { FinancialProfile } from './financialAnalysis';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  processingTime: number;
  conversationId?: string;
}

export interface ConversationContext {
  financialProfile: FinancialProfile;
  recentMessages: AIMessage[];
  conversationSummary?: string;
  userPreferences?: {
    riskTolerance: 'low' | 'medium' | 'high';
    investmentGoals: string[];
    communicationStyle: 'formal' | 'casual' | 'technical';
  };
}

export class AIService {
  private anthropic: Anthropic;
  private readonly maxTokens = 4000;
  private readonly model = 'ai-model-latest';

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async generateFinancialAdvice(
    userQuery: string,
    context: ConversationContext
  ): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const messages = this.buildMessageHistory(userQuery, context);

      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt,
        messages: messages,
        temperature: 0.7,
      });

      const processingTime = Date.now() - startTime;

      if (response.content[0]?.type === 'text') {
        return {
          content: response.content[0].text,
          usage: {
            input_tokens: response.usage.input_tokens,
            output_tokens: response.usage.output_tokens,
          },
          processingTime,
        };
      } else {
        throw new Error('Unexpected response format from AI service');
      }
    } catch (error) {
      console.error('AI service error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to generate AI response'
      );
    }
  }

  private buildSystemPrompt(context: ConversationContext): string {
    const { financialProfile } = context;

    return `You are an expert AI personal finance mentor with deep knowledge of financial planning, budgeting, investing, and wealth management. Your role is to provide personalized, actionable financial advice based on the user's current financial situation.

CURRENT USER FINANCIAL PROFILE:
- Total Balance: $${financialProfile.totalBalance.toFixed(2)}
- Monthly Income: $${financialProfile.monthlyIncome.toFixed(2)}
- Monthly Expenses: $${financialProfile.monthlyExpenses.toFixed(2)}
- Savings Rate: ${financialProfile.savingsRate}%
- Financial Health Score: ${financialProfile.financialHealth.score}/100

SPENDING ANALYSIS:
- Spending Trend: ${financialProfile.spendingTrends.trend} (${financialProfile.spendingTrends.percentageChange}% change)
- Top Expense Categories: ${financialProfile.topCategories.map(cat => `${cat.category} (${cat.percentage}%)`).join(', ')}

KEY INSIGHTS:
${financialProfile.insights.map(insight => `- ${insight}`).join('\n')}

FINANCIAL HEALTH INDICATORS:
${financialProfile.financialHealth.indicators.map(indicator =>
  `- ${indicator.metric}: ${indicator.status.toUpperCase()} - ${indicator.recommendation}`
).join('\n')}

GUIDELINES FOR RESPONSES:
1. Be empathetic, encouraging, and non-judgmental
2. Provide specific, actionable advice tailored to their situation
3. Use their actual financial data in your recommendations
4. Explain financial concepts in clear, understandable terms
5. Suggest realistic goals and steps they can take immediately
6. Address both short-term tactics and long-term strategy
7. Be honest about risks and limitations
8. Encourage good financial habits and celebrate progress
9. Keep responses concise but comprehensive (aim for 200-400 words)
10. Use formatting like bullet points for clarity when appropriate

IMPORTANT: Never provide specific investment recommendations for individual stocks, bonds, or other securities. Focus on general asset allocation principles, diversification strategies, and types of investment vehicles that might be appropriate for their situation and risk tolerance.

Remember: You are providing educational financial guidance, not professional financial advice. Encourage users to consult with qualified financial advisors for major financial decisions.`;
  }

  private buildMessageHistory(
    userQuery: string,
    context: ConversationContext
  ): AIMessage[] {
    const messages: AIMessage[] = [];

    if (context.conversationSummary) {
      messages.push({
        role: 'system',
        content: `Previous conversation summary: ${context.conversationSummary}`,
      });
    }

    context.recentMessages.forEach(msg => {
      if (msg.role !== 'system') {
        messages.push(msg);
      }
    });

    messages.push({
      role: 'user',
      content: userQuery,
    });

    return messages.slice(-10);
  }

  async summarizeConversation(messages: AIMessage[]): Promise<string> {
    try {
      const conversationText = messages
        .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join('\n\n');

      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 500,
        system: `You are tasked with summarizing a financial advice conversation. Create a concise summary (100-200 words) that captures:
1. The main financial topics discussed
2. Key advice or recommendations given
3. The user's primary financial concerns or goals
4. Any action items or next steps mentioned

Focus on the most important points that would be useful context for continuing the conversation.`,
        messages: [
          {
            role: 'user',
            content: `Please summarize this financial advice conversation:\n\n${conversationText}`,
          },
        ],
        temperature: 0.5,
      });

      if (response.content[0]?.type === 'text') {
        return response.content[0].text;
      } else {
        throw new Error('Failed to generate conversation summary');
      }
    } catch (error) {
      console.error('Conversation summary error:', error);
      return 'Previous conversation covered various financial topics and advice.';
    }
  }

  async generateConversationTitle(firstMessage: string): Promise<string> {
    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 50,
        system: 'Generate a short, descriptive title (3-6 words) for a financial advice conversation based on the user\'s first message. Focus on the main financial topic or question.',
        messages: [
          {
            role: 'user',
            content: `Generate a title for this financial question: "${firstMessage}"`,
          },
        ],
        temperature: 0.3,
      });

      if (response.content[0]?.type === 'text') {
        return response.content[0].text.replace(/['"]/g, '').trim();
      } else {
        return 'Financial Advice Chat';
      }
    } catch (error) {
      console.error('Title generation error:', error);
      return 'Financial Advice Chat';
    }
  }

  async classifyFinancialQuery(query: string): Promise<string[]> {
    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 100,
        system: `Classify this financial query into relevant categories. Choose from: budgeting, saving, investing, debt, retirement, taxes, insurance, emergency-fund, credit, real-estate, business, education, goals. Return only the category names as a comma-separated list.`,
        messages: [
          {
            role: 'user',
            content: `Classify this financial query: "${query}"`,
          },
        ],
        temperature: 0.2,
      });

      if (response.content[0]?.type === 'text') {
        return response.content[0].text
          .split(',')
          .map(tag => tag.trim().toLowerCase())
          .filter(tag => tag.length > 0);
      } else {
        return ['general'];
      }
    } catch (error) {
      console.error('Query classification error:', error);
      return ['general'];
    }
  }
}