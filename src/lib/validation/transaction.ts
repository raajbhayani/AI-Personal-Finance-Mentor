import { z } from 'zod';

// Base validation schemas
export const TransactionCategorySchema = z.enum([
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Investment',
  'Salary',
  'Freelance',
  'Business',
  'Gifts',
  'Housing',
  'Insurance',
  'Taxes',
  'Savings',
  'Debt Payment',
  'Other',
]);

export const TransactionTypeSchema = z.enum(['income', 'expense']);

export const TransactionStatusSchema = z.enum(['pending', 'completed', 'failed', 'cancelled']);

export const PaymentMethodSchema = z.enum([
  'cash',
  'credit_card',
  'debit_card',
  'bank_transfer',
  'digital_wallet',
  'check',
  'other',
]);

export const RecurringFrequencySchema = z.enum(['daily', 'weekly', 'monthly', 'yearly']);

export const CurrencyCodeSchema = z
  .string()
  .length(3, 'Currency code must be exactly 3 characters')
  .regex(/^[A-Z]{3}$/, 'Currency code must be uppercase letters');

// Recurring details schema
export const RecurringDetailsSchema = z.object({
  frequency: RecurringFrequencySchema,
  endDate: z.date().optional(),
  nextDue: z.date().optional(),
  parentTransactionId: z.string().optional(),
});

// Base transaction schema
export const BaseTransactionSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be positive')
    .finite('Amount must be a finite number')
    .multipleOf(0.01, 'Amount can have at most 2 decimal places'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(200, 'Description cannot exceed 200 characters'),
  category: TransactionCategorySchema,
  subcategory: z
    .string()
    .trim()
    .max(50, 'Subcategory cannot exceed 50 characters')
    .optional(),
  type: TransactionTypeSchema,
  status: TransactionStatusSchema.default('completed'),
  date: z.date(),
  tags: z
    .array(z.string().trim().min(1, 'Tag cannot be empty').max(20, 'Tag cannot exceed 20 characters'))
    .max(10, 'Cannot have more than 10 tags')
    .default([]),
  location: z
    .string()
    .trim()
    .max(100, 'Location cannot exceed 100 characters')
    .optional(),
  notes: z
    .string()
    .trim()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional(),
  receipt: z.string().url('Receipt must be a valid URL').optional(),
  attachments: z
    .array(z.string().url('Attachment must be a valid URL'))
    .max(5, 'Cannot have more than 5 attachments')
    .default([]),
  paymentMethod: PaymentMethodSchema.optional(),
  currency: CurrencyCodeSchema.default('USD'),
  exchangeRate: z
    .number()
    .positive('Exchange rate must be positive')
    .finite('Exchange rate must be a finite number')
    .optional(),
  merchant: z
    .string()
    .trim()
    .max(100, 'Merchant name cannot exceed 100 characters')
    .optional(),
  isRecurring: z.boolean().default(false),
  linkedGoalId: z.string().optional(),
  budgetId: z.string().optional(),
});

// Create transaction schema
export const CreateTransactionSchema = BaseTransactionSchema.extend({
  recurringDetails: RecurringDetailsSchema.optional(),
}).superRefine((data, ctx) => {
  // Validate recurring details
  if (data.isRecurring && !data.recurringDetails) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Recurring details are required when isRecurring is true',
      path: ['recurringDetails'],
    });
  }

  // Validate exchange rate
  if (data.currency !== 'USD' && !data.exchangeRate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Exchange rate is required for non-USD currencies',
      path: ['exchangeRate'],
    });
  }

  // Validate date (not in future beyond 1 day)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (data.date > tomorrow) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Transaction date cannot be more than 1 day in the future',
      path: ['date'],
    });
  }

  // Validate amount based on type
  if (data.type === 'expense' && data.amount > 100000) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Expense amount seems unusually high. Please verify.',
      path: ['amount'],
    });
  }
});

// Update transaction schema (all fields optional except ID)
export const UpdateTransactionSchema = BaseTransactionSchema.partial().extend({
  id: z.string().min(1, 'Transaction ID is required'),
  recurringDetails: RecurringDetailsSchema.optional(),
});

// Transaction filter schema
export const TransactionFilterSchema = z.object({
  type: TransactionTypeSchema.optional(),
  category: TransactionCategorySchema.optional(),
  status: TransactionStatusSchema.optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  amountMin: z.number().positive().optional(),
  amountMax: z.number().positive().optional(),
  tags: z.array(z.string()).optional(),
  paymentMethod: PaymentMethodSchema.optional(),
  currency: CurrencyCodeSchema.optional(),
  merchant: z.string().trim().optional(),
  search: z.string().trim().min(1).optional(),
  linkedGoalId: z.string().optional(),
  budgetId: z.string().optional(),
  isRecurring: z.boolean().optional(),
}).superRefine((data, ctx) => {
  // Validate date range
  if (data.dateFrom && data.dateTo && data.dateFrom > data.dateTo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'dateFrom cannot be after dateTo',
      path: ['dateFrom'],
    });
  }

  // Validate amount range
  if (data.amountMin && data.amountMax && data.amountMin > data.amountMax) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'amountMin cannot be greater than amountMax',
      path: ['amountMin'],
    });
  }
});

// Pagination schema
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z
    .enum(['date', 'amount', 'description', 'category', 'createdAt', 'updatedAt'])
    .default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Transaction query schema (combines filters and pagination)
export const TransactionQuerySchema = TransactionFilterSchema.extend({
  page: PaginationSchema.shape.page,
  limit: PaginationSchema.shape.limit,
  sortBy: PaginationSchema.shape.sortBy,
  sortOrder: PaginationSchema.shape.sortOrder,
});

// Bulk operations schema
export const BulkDeleteTransactionSchema = z.object({
  ids: z
    .array(z.string().min(1, 'Transaction ID cannot be empty'))
    .min(1, 'At least one transaction ID is required')
    .max(50, 'Cannot delete more than 50 transactions at once'),
});

export const BulkUpdateTransactionSchema = z.object({
  ids: z
    .array(z.string().min(1, 'Transaction ID cannot be empty'))
    .min(1, 'At least one transaction ID is required')
    .max(50, 'Cannot update more than 50 transactions at once'),
  updates: z.object({
    category: TransactionCategorySchema.optional(),
    status: TransactionStatusSchema.optional(),
    tags: z.array(z.string().trim().min(1).max(20)).max(10).optional(),
    paymentMethod: PaymentMethodSchema.optional(),
  }),
});

// Category analysis schema
export const CategoryAnalysisSchema = z.object({
  dateFrom: z.date(),
  dateTo: z.date(),
  type: TransactionTypeSchema.optional(),
  currency: CurrencyCodeSchema.default('USD'),
  groupBy: z.enum(['day', 'week', 'month', 'year']).default('month'),
}).superRefine((data, ctx) => {
  if (data.dateFrom > data.dateTo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'dateFrom cannot be after dateTo',
      path: ['dateFrom'],
    });
  }

  // Validate date range is not too large
  const daysDiff = Math.abs(data.dateTo.getTime() - data.dateFrom.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff > 365 * 2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Date range cannot exceed 2 years',
      path: ['dateTo'],
    });
  }
});

// Export types
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;
export type TransactionFilter = z.infer<typeof TransactionFilterSchema>;
export type TransactionQuery = z.infer<typeof TransactionQuerySchema>;
export type BulkDeleteTransactionInput = z.infer<typeof BulkDeleteTransactionSchema>;
export type BulkUpdateTransactionInput = z.infer<typeof BulkUpdateTransactionSchema>;
export type CategoryAnalysisInput = z.infer<typeof CategoryAnalysisSchema>;

// Validation helper functions
export function validateCreateTransaction(data: unknown): CreateTransactionInput {
  return CreateTransactionSchema.parse(data);
}

export function validateUpdateTransaction(data: unknown): UpdateTransactionInput {
  return UpdateTransactionSchema.parse(data);
}

export function validateTransactionQuery(data: unknown): TransactionQuery {
  return TransactionQuerySchema.parse(data);
}

export function validateTransactionFilter(data: unknown): TransactionFilter {
  return TransactionFilterSchema.parse(data);
}

export function validateBulkDelete(data: unknown): BulkDeleteTransactionInput {
  return BulkDeleteTransactionSchema.parse(data);
}

export function validateBulkUpdate(data: unknown): BulkUpdateTransactionInput {
  return BulkUpdateTransactionSchema.parse(data);
}

export function validateCategoryAnalysis(data: unknown): CategoryAnalysisInput {
  return CategoryAnalysisSchema.parse(data);
}