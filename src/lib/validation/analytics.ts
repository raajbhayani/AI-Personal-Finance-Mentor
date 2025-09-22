import { z } from 'zod';

export const DateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
}).refine(data => data.startDate <= data.endDate, {
  message: 'Start date must be before or equal to end date',
  path: ['endDate'],
});

export const PeriodSchema = z.object({
  year: z.number().int().min(2020).max(2030),
  month: z.number().int().min(1).max(12).optional(),
  quarter: z.number().int().min(1).max(4).optional(),
});

export const ReportsQuerySchema = z.object({
  type: z.enum(['monthly', 'quarterly', 'yearly']).default('monthly'),
  year: z.number().int().min(2020).max(2030).default(new Date().getFullYear()),
  month: z.number().int().min(1).max(12).optional(),
  quarter: z.number().int().min(1).max(4).optional(),
  includeComparisons: z.boolean().default(true),
  includeProjections: z.boolean().default(false),
  format: z.enum(['json', 'csv', 'pdf']).default('json'),
}).refine(data => {
  if (data.type === 'monthly' && !data.month) {
    return false;
  }
  if (data.type === 'quarterly' && !data.quarter) {
    return false;
  }
  return true;
}, {
  message: 'Month is required for monthly reports, quarter is required for quarterly reports',
  path: ['month'],
});

export const PatternsQuerySchema = z.object({
  timeframe: z.enum(['daily', 'weekly', 'monthly', 'yearly']).default('monthly'),
  months: z.number().int().min(1).max(36).default(12),
  category: z.string().min(1).max(50).optional(),
  analysisType: z.enum(['spending', 'income', 'both']).default('both'),
  includeForecasting: z.boolean().default(false),
  groupBy: z.enum(['category', 'merchant', 'paymentMethod']).optional(),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
}).refine(data => {
  if (data.minAmount && data.maxAmount && data.minAmount > data.maxAmount) {
    return false;
  }
  return true;
}, {
  message: 'Min amount cannot be greater than max amount',
  path: ['maxAmount'],
});

export const BudgetComparisonQuerySchema = z.object({
  budgetId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid budget ID format').optional(),
  period: z.enum(['current', 'last', 'custom']).default('current'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  includeProjections: z.boolean().default(true),
  granularity: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
  categories: z.array(z.string()).optional(),
}).refine(data => {
  if (data.period === 'custom' && (!data.startDate || !data.endDate)) {
    return false;
  }
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start <= end;
  }
  return true;
}, {
  message: 'Start date and end date are required for custom period, and start date must be before end date',
  path: ['endDate'],
});

export const GoalProgressQuerySchema = z.object({
  goalId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid goal ID format').optional(),
  status: z.enum(['active', 'completed', 'paused', 'cancelled', 'all']).default('active'),
  timeframe: z.enum(['monthly', 'quarterly', 'yearly', 'all']).default('all'),
  includeProjections: z.boolean().default(true),
  includeHistory: z.boolean().default(true),
  sortBy: z.enum(['progress', 'targetDate', 'priority', 'createdAt']).default('targetDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

export const AnalyticsFilterSchema = z.object({
  dateRange: DateRangeSchema.optional(),
  categories: z.array(z.string()).max(20, 'Cannot filter by more than 20 categories').optional(),
  transactionTypes: z.array(z.enum(['income', 'expense'])).optional(),
  amountRange: z.object({
    min: z.number().nonnegative(),
    max: z.number().positive(),
  }).refine(data => data.min <= data.max, {
    message: 'Min amount cannot be greater than max amount',
    path: ['max'],
  }).optional(),
  paymentMethods: z.array(z.string()).optional(),
  merchants: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export const CustomReportSchema = z.object({
  name: z.string().min(1, 'Report name is required').max(100, 'Report name cannot exceed 100 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  type: z.enum(['income', 'expense', 'budget', 'goal', 'overview']),
  filters: AnalyticsFilterSchema,
  metrics: z.array(z.enum([
    'total_amount',
    'average_amount',
    'transaction_count',
    'growth_rate',
    'category_breakdown',
    'trend_analysis',
    'budget_variance',
    'goal_progress',
    'savings_rate',
  ])).min(1, 'At least one metric is required'),
  groupBy: z.enum(['day', 'week', 'month', 'quarter', 'year', 'category', 'merchant']).optional(),
  chartType: z.enum(['line', 'bar', 'pie', 'table', 'trend']).default('table'),
  schedule: z.object({
    enabled: z.boolean().default(false),
    frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    dayOfMonth: z.number().int().min(1).max(31).optional(),
    recipients: z.array(z.string().email()).max(10, 'Cannot have more than 10 recipients').optional(),
  }).optional(),
});

export const ExportRequestSchema = z.object({
  reportType: z.enum(['monthly', 'quarterly', 'yearly', 'patterns', 'budget', 'goals', 'custom']),
  format: z.enum(['csv', 'xlsx', 'pdf', 'json']),
  filters: AnalyticsFilterSchema.optional(),
  includeCharts: z.boolean().default(false),
  includeRawData: z.boolean().default(true),
  dateRange: DateRangeSchema.optional(),
  email: z.string().email().optional(),
});

export const CacheConfigSchema = z.object({
  key: z.string().min(1, 'Cache key is required'),
  ttl: z.number().int().positive().max(86400, 'TTL cannot exceed 24 hours'),
  tags: z.array(z.string()).optional(),
  invalidateOn: z.array(z.enum(['transaction', 'budget', 'goal', 'user'])).optional(),
});

export const AnalyticsMetricsSchema = z.object({
  totalIncome: z.number().nonnegative(),
  totalExpenses: z.number().nonnegative(),
  netIncome: z.number(),
  savingsRate: z.number().min(-100).max(100),
  budgetAdherence: z.number().min(0).max(100),
  goalProgress: z.number().min(0).max(100),
  transactionCount: z.number().nonnegative(),
  averageTransactionAmount: z.number().nonnegative(),
  categoryBreakdown: z.array(z.object({
    category: z.string(),
    amount: z.number().nonnegative(),
    percentage: z.number().min(0).max(100),
    count: z.number().nonnegative(),
  })),
  monthlyTrend: z.array(z.object({
    period: z.string(),
    income: z.number().nonnegative(),
    expenses: z.number().nonnegative(),
    net: z.number(),
  })),
});

export const DashboardConfigSchema = z.object({
  widgets: z.array(z.object({
    id: z.string(),
    type: z.enum(['metric', 'chart', 'table', 'goal', 'budget']),
    title: z.string().max(50),
    size: z.enum(['small', 'medium', 'large']),
    position: z.object({
      x: z.number().nonnegative(),
      y: z.number().nonnegative(),
      width: z.number().positive(),
      height: z.number().positive(),
    }),
    config: z.record(z.any()),
    refreshInterval: z.number().int().positive().optional(),
  })).max(20, 'Cannot have more than 20 widgets'),
  layout: z.enum(['grid', 'masonry', 'flex']).default('grid'),
  theme: z.enum(['light', 'dark', 'auto']).default('light'),
  autoRefresh: z.boolean().default(true),
  refreshInterval: z.number().int().positive().default(300000), // 5 minutes
});

export type ReportsQuery = z.infer<typeof ReportsQuerySchema>;
export type PatternsQuery = z.infer<typeof PatternsQuerySchema>;
export type BudgetComparisonQuery = z.infer<typeof BudgetComparisonQuerySchema>;
export type GoalProgressQuery = z.infer<typeof GoalProgressQuerySchema>;
export type AnalyticsFilter = z.infer<typeof AnalyticsFilterSchema>;
export type CustomReport = z.infer<typeof CustomReportSchema>;
export type ExportRequest = z.infer<typeof ExportRequestSchema>;
export type CacheConfig = z.infer<typeof CacheConfigSchema>;
export type AnalyticsMetrics = z.infer<typeof AnalyticsMetricsSchema>;
export type DashboardConfig = z.infer<typeof DashboardConfigSchema>;

export function validateReportsQuery(data: unknown): ReportsQuery {
  return ReportsQuerySchema.parse(data);
}

export function validatePatternsQuery(data: unknown): PatternsQuery {
  return PatternsQuerySchema.parse(data);
}

export function validateBudgetComparisonQuery(data: unknown): BudgetComparisonQuery {
  return BudgetComparisonQuerySchema.parse(data);
}

export function validateGoalProgressQuery(data: unknown): GoalProgressQuery {
  return GoalProgressQuerySchema.parse(data);
}

export function validateAnalyticsFilter(data: unknown): AnalyticsFilter {
  return AnalyticsFilterSchema.parse(data);
}

export function validateCustomReport(data: unknown): CustomReport {
  return CustomReportSchema.parse(data);
}

export function validateExportRequest(data: unknown): ExportRequest {
  return ExportRequestSchema.parse(data);
}

export function validateDashboardConfig(data: unknown): DashboardConfig {
  return DashboardConfigSchema.parse(data);
}