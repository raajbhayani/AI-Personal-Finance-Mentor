import { z } from 'zod';

// Common validation patterns
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
const phoneRegex = /^\+?[\d\s-()]+$/;

// Password strength validation
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must be less than 128 characters')
  .regex(passwordRegex, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

// Email validation
export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .min(1, 'Email is required')
  .max(254, 'Email is too long');

// Authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const signupSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Transaction schemas
export const transactionCategorySchema = z.enum([
  'food_dining',
  'transportation',
  'shopping',
  'entertainment',
  'bills_utilities',
  'healthcare',
  'education',
  'travel',
  'business',
  'gifts_donations',
  'investments',
  'other'
], {
  errorMap: () => ({ message: 'Please select a valid category' }),
});

export const transactionTypeSchema = z.enum(['income', 'expense'], {
  errorMap: () => ({ message: 'Transaction type must be either income or expense' }),
});

export const createTransactionSchema = z.object({
  description: z
    .string()
    .min(1, 'Description is required')
    .max(255, 'Description must be less than 255 characters')
    .trim(),
  amount: z
    .number({
      required_error: 'Amount is required',
      invalid_type_error: 'Amount must be a valid number',
    })
    .positive('Amount must be greater than zero')
    .max(1000000, 'Amount cannot exceed $1,000,000')
    .multipleOf(0.01, 'Amount can only have up to 2 decimal places'),
  type: transactionTypeSchema,
  category: transactionCategorySchema,
  date: z
    .string()
    .min(1, 'Date is required')
    .refine(date => {
      const parsedDate = new Date(date);
      const now = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(now.getFullYear() + 1);

      return parsedDate >= oneYearAgo && parsedDate <= oneYearFromNow;
    }, 'Date must be within the last year or next year'),
  tags: z
    .array(z.string().max(20, 'Tag must be less than 20 characters'))
    .max(5, 'Maximum 5 tags allowed')
    .optional(),
  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial().extend({
  id: z.string().min(1, 'Transaction ID is required'),
});

// Financial Goal schemas
export const goalCategorySchema = z.enum([
  'emergency_fund',
  'vacation',
  'home_purchase',
  'car_purchase',
  'education',
  'retirement',
  'debt_payoff',
  'investment',
  'other'
], {
  errorMap: () => ({ message: 'Please select a valid goal category' }),
});

const baseGoalSchema = z.object({
  title: z
    .string()
    .min(1, 'Goal title is required')
    .max(100, 'Goal title must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  targetAmount: z
    .number({
      required_error: 'Target amount is required',
      invalid_type_error: 'Target amount must be a valid number',
    })
    .positive('Target amount must be greater than zero')
    .max(10000000, 'Target amount cannot exceed $10,000,000'),
  currentAmount: z
    .number({
      invalid_type_error: 'Current amount must be a valid number',
    })
    .min(0, 'Current amount cannot be negative')
    .optional()
    .default(0),
  targetDate: z
    .string()
    .min(1, 'Target date is required')
    .refine(date => {
      const parsedDate = new Date(date);
      const now = new Date();
      return parsedDate > now;
    }, 'Target date must be in the future'),
  category: goalCategorySchema,
  priority: z
    .enum(['low', 'medium', 'high'], {
      errorMap: () => ({ message: 'Priority must be low, medium, or high' }),
    })
    .default('medium'),
});

export const createGoalSchema = baseGoalSchema.refine(data => (data.currentAmount || 0) <= data.targetAmount, {
  message: 'Current amount cannot exceed target amount',
  path: ['currentAmount'],
});

export const updateGoalSchema = baseGoalSchema.partial().extend({
  id: z.string().min(1, 'Goal ID is required'),
}).refine(data => (data.currentAmount || 0) <= (data.targetAmount || Infinity), {
  message: 'Current amount cannot exceed target amount',
  path: ['currentAmount'],
});

// Budget schemas
export const createBudgetSchema = z.object({
  name: z
    .string()
    .min(1, 'Budget name is required')
    .max(100, 'Budget name must be less than 100 characters')
    .trim(),
  category: transactionCategorySchema,
  amount: z
    .number({
      required_error: 'Budget amount is required',
      invalid_type_error: 'Budget amount must be a valid number',
    })
    .positive('Budget amount must be greater than zero')
    .max(100000, 'Budget amount cannot exceed $100,000'),
  period: z.enum(['weekly', 'monthly', 'yearly'], {
    errorMap: () => ({ message: 'Period must be weekly, monthly, or yearly' }),
  }),
  startDate: z
    .string()
    .min(1, 'Start date is required'),
  endDate: z
    .string()
    .min(1, 'End date is required'),
  alertThreshold: z
    .number()
    .min(0, 'Alert threshold cannot be negative')
    .max(100, 'Alert threshold cannot exceed 100%')
    .optional()
    .default(80),
}).refine(data => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end > start;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

// Profile schemas
export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
  email: emailSchema,
  phone: z
    .string()
    .regex(phoneRegex, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  dateOfBirth: z
    .string()
    .refine(date => {
      if (!date) return true; // Optional field
      const parsedDate = new Date(date);
      const now = new Date();
      const age = now.getFullYear() - parsedDate.getFullYear();
      return age >= 13 && age <= 120;
    }, 'You must be between 13 and 120 years old')
    .optional(),
  currency: z
    .enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'], {
      errorMap: () => ({ message: 'Please select a valid currency' }),
    })
    .default('USD'),
  timezone: z
    .string()
    .min(1, 'Timezone is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'New passwords do not match',
  path: ['confirmNewPassword'],
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
});

// Contact/Support schemas
export const contactSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  email: emailSchema,
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(200, 'Subject must be less than 200 characters')
    .trim(),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters long')
    .max(2000, 'Message must be less than 2000 characters')
    .trim(),
  category: z
    .enum(['bug_report', 'feature_request', 'account_issue', 'billing', 'general'], {
      errorMap: () => ({ message: 'Please select a valid category' }),
    }),
});

// Export type inference for TypeScript
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type CreateTransactionData = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionData = z.infer<typeof updateTransactionSchema>;
export type CreateGoalData = z.infer<typeof createGoalSchema>;
export type UpdateGoalData = z.infer<typeof updateGoalSchema>;
export type CreateBudgetData = z.infer<typeof createBudgetSchema>;
export type UpdateProfileData = z.infer<typeof updateProfileSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
export type ContactFormData = z.infer<typeof contactSchema>;

// Validation helper functions
export const validateField = (schema: z.ZodSchema, value: any): string | null => {
  try {
    schema.parse(value);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || 'Invalid value';
    }
    return 'Validation error';
  }
};

export const validateForm = <T>(schema: z.ZodSchema<T>, data: any): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach(err => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};

// Real-time validation hook helper
export const createFieldValidator = (schema: z.ZodSchema) => {
  return (value: any): { isValid: boolean; error?: string } => {
    try {
      schema.parse(value);
      return { isValid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { isValid: false, error: error.errors[0]?.message };
      }
      return { isValid: false, error: 'Invalid value' };
    }
  };
};