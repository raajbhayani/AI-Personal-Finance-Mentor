import { z } from 'zod';

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().trim().min(1, 'Message content is required').max(8000, 'Message content cannot exceed 8000 characters'),
  timestamp: z.date().optional(),
  metadata: z.object({
    financialContext: z.any().optional(),
    processingTime: z.number().optional(),
    tokenCount: z.number().optional(),
  }).optional(),
});

export const ConversationContextSchema = z.object({
  includeRecentTransactions: z.boolean().default(true),
  includeFinancialSummary: z.boolean().default(true),
  maxHistory: z.number().min(1).max(20).default(10),
  userPreferences: z.object({
    riskTolerance: z.enum(['low', 'medium', 'high']).optional(),
    investmentGoals: z.array(z.string()).optional(),
    communicationStyle: z.enum(['formal', 'casual', 'technical']).optional(),
  }).optional(),
});

export const CreateChatRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Message is required')
    .max(2000, 'Message cannot exceed 2000 characters'),
  conversationId: z.string().optional(),
  context: ConversationContextSchema.default({}),
});

export const UpdateConversationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters')
    .optional(),
  tags: z
    .array(z.string().trim().min(1, 'Tag cannot be empty').max(20, 'Tag cannot exceed 20 characters'))
    .max(20, 'Cannot have more than 20 tags')
    .optional(),
  isActive: z.boolean().optional(),
});

export const ConversationQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
  search: z.string().trim().min(1).optional(),
  tags: z.string().optional(),
  isActive: z.boolean().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeMessages: z.boolean().default(false),
});

export const BulkDeleteConversationsSchema = z.object({
  ids: z
    .array(z.string().min(1, 'Conversation ID cannot be empty'))
    .min(1, 'At least one conversation ID is required')
    .max(50, 'Cannot delete more than 50 conversations at once'),
});

export const FinancialQueryClassificationSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, 'Query is required')
    .max(1000, 'Query cannot exceed 1000 characters'),
});

export const ConversationSummarySchema = z.object({
  messages: z
    .array(ChatMessageSchema)
    .min(1, 'At least one message is required for summarization')
    .max(50, 'Cannot summarize more than 50 messages at once'),
});

export const TitleGenerationSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Message is required')
    .max(500, 'Message cannot exceed 500 characters'),
});

export const AIResponseSchema = z.object({
  content: z.string().min(1, 'Response content is required'),
  usage: z.object({
    input_tokens: z.number().nonnegative(),
    output_tokens: z.number().nonnegative(),
  }).optional(),
  processingTime: z.number().nonnegative(),
  conversationId: z.string().optional(),
});

export const FinancialContextSchema = z.object({
  totalBalance: z.number(),
  monthlyIncome: z.number().nonnegative(),
  monthlyExpenses: z.number().nonnegative(),
  savingsRate: z.number(),
  financialHealthScore: z.number().min(0).max(100),
  topCategories: z.array(z.object({
    category: z.string(),
    amount: z.number().nonnegative(),
    percentage: z.number().min(0).max(100),
  })),
  insights: z.array(z.string()),
});

export const RateLimitResponseSchema = z.object({
  allowed: z.boolean(),
  remaining: z.number().nonnegative(),
  resetTime: z.number(),
  retryAfter: z.number().optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ConversationContext = z.infer<typeof ConversationContextSchema>;
export type CreateChatRequest = z.infer<typeof CreateChatRequestSchema>;
export type UpdateConversation = z.infer<typeof UpdateConversationSchema>;
export type ConversationQuery = z.infer<typeof ConversationQuerySchema>;
export type BulkDeleteConversations = z.infer<typeof BulkDeleteConversationsSchema>;
export type FinancialQueryClassification = z.infer<typeof FinancialQueryClassificationSchema>;
export type ConversationSummary = z.infer<typeof ConversationSummarySchema>;
export type TitleGeneration = z.infer<typeof TitleGenerationSchema>;
export type AIResponse = z.infer<typeof AIResponseSchema>;
export type FinancialContext = z.infer<typeof FinancialContextSchema>;
export type RateLimitResponse = z.infer<typeof RateLimitResponseSchema>;

export function validateChatRequest(data: unknown): CreateChatRequest {
  return CreateChatRequestSchema.parse(data);
}

export function validateUpdateConversation(data: unknown): UpdateConversation {
  return UpdateConversationSchema.parse(data);
}

export function validateConversationQuery(data: unknown): ConversationQuery {
  return ConversationQuerySchema.parse(data);
}

export function validateBulkDeleteConversations(data: unknown): BulkDeleteConversations {
  return BulkDeleteConversationsSchema.parse(data);
}

export function validateFinancialQueryClassification(data: unknown): FinancialQueryClassification {
  return FinancialQueryClassificationSchema.parse(data);
}

export function validateConversationSummary(data: unknown): ConversationSummary {
  return ConversationSummarySchema.parse(data);
}

export function validateTitleGeneration(data: unknown): TitleGeneration {
  return TitleGenerationSchema.parse(data);
}