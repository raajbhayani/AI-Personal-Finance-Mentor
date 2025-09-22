import { ErrorCode } from './customErrors';

export interface UserFriendlyMessage {
  title: string;
  message: string;
  action?: string;
  details?: string;
  icon?: string;
  severity: 'error' | 'warning' | 'info';
  category: 'auth' | 'validation' | 'network' | 'system' | 'business' | 'security';
}

export interface ErrorContext {
  isAuthenticated?: boolean;
  userRole?: string;
  isOffline?: boolean;
  retryCount?: number;
  fieldName?: string;
  resourceName?: string;
}

export class UserMessageService {
  private static readonly messages: Record<ErrorCode, (context?: ErrorContext) => UserFriendlyMessage> = {
    // Authentication Errors
    [ErrorCode.INVALID_CREDENTIALS]: (context) => ({
      title: 'Login Failed',
      message: 'The email or password you entered is incorrect.',
      action: 'Please check your credentials and try again.',
      details: 'If you forgot your password, you can reset it using the "Forgot Password" link.',
      icon: '🔐',
      severity: 'error',
      category: 'auth',
    }),

    [ErrorCode.TOKEN_EXPIRED]: (context) => ({
      title: 'Session Expired',
      message: 'Your session has expired for security reasons.',
      action: 'Please log in again to continue.',
      details: 'This helps keep your account secure.',
      icon: '⏰',
      severity: 'warning',
      category: 'auth',
    }),

    [ErrorCode.INVALID_TOKEN]: (context) => ({
      title: 'Authentication Error',
      message: 'There was a problem verifying your identity.',
      action: 'Please log in again.',
      details: 'This may happen if you\'re using an outdated link or if there was a security issue.',
      icon: '❌',
      severity: 'error',
      category: 'auth',
    }),

    [ErrorCode.ACCOUNT_LOCKED]: (context) => ({
      title: 'Account Temporarily Locked',
      message: 'Your account has been temporarily locked due to multiple failed login attempts.',
      action: 'Please try again in 15 minutes or reset your password.',
      details: 'This is a security measure to protect your account.',
      icon: '🔒',
      severity: 'error',
      category: 'auth',
    }),

    [ErrorCode.EMAIL_NOT_VERIFIED]: (context) => ({
      title: 'Email Verification Required',
      message: 'Please verify your email address to continue.',
      action: 'Check your email for a verification link.',
      details: 'Don\'t see the email? Check your spam folder or request a new verification email.',
      icon: '📧',
      severity: 'warning',
      category: 'auth',
    }),

    [ErrorCode.PASSWORD_RESET_REQUIRED]: (context) => ({
      title: 'Password Reset Required',
      message: 'You need to reset your password before continuing.',
      action: 'Please use the "Forgot Password" option to create a new password.',
      details: 'This may be required for security reasons or if your password has expired.',
      icon: '🔑',
      severity: 'warning',
      category: 'auth',
    }),

    // Authorization Errors
    [ErrorCode.INSUFFICIENT_PERMISSIONS]: (context) => ({
      title: 'Access Denied',
      message: 'You don\'t have permission to perform this action.',
      action: context?.userRole
        ? 'Contact your administrator if you believe you should have access.'
        : 'Please log in with an account that has the necessary permissions.',
      details: context?.userRole
        ? `Your current role (${context.userRole}) doesn't include this permission.`
        : undefined,
      icon: '🚫',
      severity: 'error',
      category: 'auth',
    }),

    [ErrorCode.RESOURCE_ACCESS_DENIED]: (context) => ({
      title: 'Access Restricted',
      message: `You cannot access this ${context?.resourceName || 'resource'}.`,
      action: 'Make sure you have the right permissions or contact support.',
      details: 'This resource may be private or restricted to certain users.',
      icon: '🔐',
      severity: 'error',
      category: 'auth',
    }),

    // Validation Errors
    [ErrorCode.VALIDATION_FAILED]: (context) => ({
      title: 'Invalid Information',
      message: context?.fieldName
        ? `Please check the ${context.fieldName} field.`
        : 'Some of the information you entered is not valid.',
      action: 'Please correct the highlighted fields and try again.',
      details: 'Make sure all required fields are filled out correctly.',
      icon: '⚠️',
      severity: 'error',
      category: 'validation',
    }),

    [ErrorCode.MISSING_REQUIRED_FIELD]: (context) => ({
      title: 'Required Information Missing',
      message: context?.fieldName
        ? `${context.fieldName} is required.`
        : 'Please fill in all required fields.',
      action: 'Complete the required information and try again.',
      icon: '📝',
      severity: 'error',
      category: 'validation',
    }),

    [ErrorCode.INVALID_EMAIL_FORMAT]: (context) => ({
      title: 'Invalid Email Address',
      message: 'Please enter a valid email address.',
      action: 'Check that your email is in the correct format (example@domain.com).',
      icon: '📧',
      severity: 'error',
      category: 'validation',
    }),

    [ErrorCode.PASSWORD_TOO_WEAK]: (context) => ({
      title: 'Password Too Weak',
      message: 'Your password doesn\'t meet the security requirements.',
      action: 'Create a stronger password with at least 8 characters, including uppercase, lowercase, numbers, and symbols.',
      details: 'Strong passwords help keep your account secure.',
      icon: '🔒',
      severity: 'error',
      category: 'validation',
    }),

    [ErrorCode.INVALID_DATE_FORMAT]: (context) => ({
      title: 'Invalid Date',
      message: 'Please enter a valid date.',
      action: 'Make sure the date is in the correct format and is a real date.',
      icon: '📅',
      severity: 'error',
      category: 'validation',
    }),

    [ErrorCode.INVALID_AMOUNT]: (context) => ({
      title: 'Invalid Amount',
      message: 'Please enter a valid monetary amount.',
      action: 'Use numbers only, with up to 2 decimal places (e.g., 123.45).',
      icon: '💰',
      severity: 'error',
      category: 'validation',
    }),

    // Database Errors
    [ErrorCode.USER_NOT_FOUND]: (context) => ({
      title: 'User Not Found',
      message: 'We couldn\'t find an account with that information.',
      action: 'Please check your details or create a new account.',
      details: 'If you\'re sure you have an account, try using a different email address.',
      icon: '👤',
      severity: 'error',
      category: 'business',
    }),

    [ErrorCode.DUPLICATE_ENTRY]: (context) => ({
      title: 'Already Exists',
      message: context?.fieldName
        ? `This ${context.fieldName} is already in use.`
        : 'This information is already in our system.',
      action: 'Please use different information or log in to your existing account.',
      icon: '🔄',
      severity: 'error',
      category: 'business',
    }),

    [ErrorCode.DB_CONNECTION_FAILED]: (context) => ({
      title: 'Service Temporarily Unavailable',
      message: 'We\'re experiencing technical difficulties.',
      action: 'Please try again in a few moments.',
      details: 'If the problem persists, please contact support.',
      icon: '⚡',
      severity: 'error',
      category: 'system',
    }),

    [ErrorCode.DB_QUERY_FAILED]: (context) => ({
      title: 'Unable to Process Request',
      message: 'We encountered an error while processing your request.',
      action: 'Please try again, or contact support if the problem continues.',
      icon: '💾',
      severity: 'error',
      category: 'system',
    }),

    // Business Logic Errors
    [ErrorCode.INSUFFICIENT_BALANCE]: (context) => ({
      title: 'Insufficient Balance',
      message: 'You don\'t have enough funds for this transaction.',
      action: 'Please check your account balance or add funds.',
      details: 'Make sure you have enough money in your account before making a transaction.',
      icon: '💳',
      severity: 'error',
      category: 'business',
    }),

    [ErrorCode.GOAL_NOT_ACHIEVABLE]: (context) => ({
      title: 'Goal Not Achievable',
      message: 'The goal you\'ve set may not be realistic with your current financial situation.',
      action: 'Consider adjusting your goal amount or timeframe.',
      details: 'Our AI can help you create a more achievable financial plan.',
      icon: '🎯',
      severity: 'warning',
      category: 'business',
    }),

    [ErrorCode.BUDGET_EXCEEDED]: (context) => ({
      title: 'Budget Limit Exceeded',
      message: 'This transaction would exceed your budget limit.',
      action: 'Review your budget or categorize this as a different expense type.',
      details: 'Staying within budget helps you achieve your financial goals.',
      icon: '📊',
      severity: 'warning',
      category: 'business',
    }),

    [ErrorCode.INVALID_TRANSACTION_DATE]: (context) => ({
      title: 'Invalid Transaction Date',
      message: 'The transaction date cannot be in the future or too far in the past.',
      action: 'Please select a valid date for your transaction.',
      icon: '📅',
      severity: 'error',
      category: 'business',
    }),

    // Security Errors
    [ErrorCode.RATE_LIMIT_EXCEEDED]: (context) => ({
      title: 'Too Many Requests',
      message: 'You\'re making requests too quickly.',
      action: 'Please wait a moment before trying again.',
      details: 'This helps protect our service and your account.',
      icon: '⏱️',
      severity: 'warning',
      category: 'security',
    }),

    [ErrorCode.SUSPICIOUS_ACTIVITY]: (context) => ({
      title: 'Unusual Activity Detected',
      message: 'We\'ve noticed some unusual activity on your account.',
      action: 'For your security, please verify your identity.',
      details: 'This is a precautionary measure to protect your account.',
      icon: '🛡️',
      severity: 'warning',
      category: 'security',
    }),

    [ErrorCode.IP_BLOCKED]: (context) => ({
      title: 'Access Temporarily Restricted',
      message: 'Access from your location has been temporarily restricted.',
      action: 'Please contact support if you believe this is an error.',
      details: 'This may be due to security policies or unusual activity.',
      icon: '🌐',
      severity: 'error',
      category: 'security',
    }),

    [ErrorCode.DEVICE_NOT_TRUSTED]: (context) => ({
      title: 'New Device Detected',
      message: 'We don\'t recognize this device.',
      action: 'Please verify your identity to continue using this device.',
      details: 'Check your email for a verification link.',
      icon: '📱',
      severity: 'warning',
      category: 'security',
    }),

    // External Service Errors
    [ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE]: (context) => ({
      title: 'Service Temporarily Unavailable',
      message: context?.isOffline
        ? 'You appear to be offline.'
        : 'One of our services is temporarily unavailable.',
      action: context?.isOffline
        ? 'Please check your internet connection and try again.'
        : 'Please try again in a few minutes.',
      details: context?.isOffline
        ? 'Some features may not work without an internet connection.'
        : 'We\'re working to restore full service as quickly as possible.',
      icon: context?.isOffline ? '📡' : '🔧',
      severity: 'error',
      category: 'network',
    }),

    [ErrorCode.EXTERNAL_SERVICE_TIMEOUT]: (context) => ({
      title: 'Request Timed Out',
      message: 'The request is taking longer than expected.',
      action: 'Please try again, or check your internet connection.',
      details: 'This may happen during high traffic or poor connectivity.',
      icon: '⏰',
      severity: 'error',
      category: 'network',
    }),

    [ErrorCode.AI_SERVICE_ERROR]: (context) => ({
      title: 'AI Assistant Unavailable',
      message: 'Our AI financial advisor is temporarily unavailable.',
      action: 'You can still use other features. Please try the AI assistant again later.',
      details: 'We\'re working to restore AI services as quickly as possible.',
      icon: '🤖',
      severity: 'error',
      category: 'network',
    }),

    [ErrorCode.PAYMENT_GATEWAY_ERROR]: (context) => ({
      title: 'Payment Processing Error',
      message: 'We couldn\'t process your payment at this time.',
      action: 'Please check your payment method and try again.',
      details: 'If the problem continues, contact your bank or try a different payment method.',
      icon: '💳',
      severity: 'error',
      category: 'network',
    }),

    // System Errors
    [ErrorCode.SYSTEM_ERROR]: (context) => ({
      title: 'Something Went Wrong',
      message: 'We encountered an unexpected error.',
      action: context?.retryCount && context.retryCount > 0
        ? 'Please refresh the page or contact support if the problem continues.'
        : 'Please try again in a moment.',
      details: 'Our team has been notified and is working on a fix.',
      icon: '⚠️',
      severity: 'error',
      category: 'system',
    }),

    [ErrorCode.MAINTENANCE_MODE]: (context) => ({
      title: 'Scheduled Maintenance',
      message: 'We\'re currently performing scheduled maintenance.',
      action: 'Please check back in a few minutes.',
      details: 'We\'re making improvements to serve you better.',
      icon: '🔧',
      severity: 'info',
      category: 'system',
    }),

    [ErrorCode.FEATURE_DISABLED]: (context) => ({
      title: 'Feature Temporarily Disabled',
      message: 'This feature is currently unavailable.',
      action: 'Please try again later or use alternative features.',
      details: 'We may be updating this feature or performing maintenance.',
      icon: '🚧',
      severity: 'warning',
      category: 'system',
    }),

    // File Upload Errors
    [ErrorCode.FILE_TOO_LARGE]: (context) => ({
      title: 'File Too Large',
      message: 'The file you\'re trying to upload is too large.',
      action: 'Please choose a smaller file (under 10MB) and try again.',
      details: 'Large files can slow down the system for everyone.',
      icon: '📄',
      severity: 'error',
      category: 'validation',
    }),

    [ErrorCode.INVALID_FILE_TYPE]: (context) => ({
      title: 'Invalid File Type',
      message: 'This file type is not supported.',
      action: 'Please upload a supported file format (PDF, JPG, PNG, or CSV).',
      details: 'Supported formats help keep your data secure and properly processed.',
      icon: '📎',
      severity: 'error',
      category: 'validation',
    }),

    [ErrorCode.FILE_UPLOAD_FAILED]: (context) => ({
      title: 'Upload Failed',
      message: 'We couldn\'t upload your file.',
      action: 'Please check your internet connection and try again.',
      details: 'Make sure the file isn\'t corrupted and your connection is stable.',
      icon: '📤',
      severity: 'error',
      category: 'network',
    }),
  };

  static getUserMessage(
    errorCode: ErrorCode,
    context?: ErrorContext
  ): UserFriendlyMessage {
    const messageGenerator = this.messages[errorCode];

    if (!messageGenerator) {
      return {
        title: 'Unknown Error',
        message: 'An unexpected error occurred.',
        action: 'Please try again or contact support.',
        icon: '❓',
        severity: 'error',
        category: 'system',
      };
    }

    return messageGenerator(context);
  }

  static getMessagesByCategory(category: UserFriendlyMessage['category']): ErrorCode[] {
    return Object.keys(this.messages)
      .filter(code => this.messages[code as ErrorCode]().category === category)
      .map(code => code as ErrorCode);
  }

  static formatMessage(
    errorCode: ErrorCode,
    context?: ErrorContext,
    includeDetails: boolean = true
  ): string {
    const userMessage = this.getUserMessage(errorCode, context);

    let formatted = `${userMessage.title}\n${userMessage.message}`;

    if (userMessage.action) {
      formatted += `\n\nWhat to do: ${userMessage.action}`;
    }

    if (includeDetails && userMessage.details) {
      formatted += `\n\nAdditional info: ${userMessage.details}`;
    }

    return formatted;
  }

  static getActionableErrors(): ErrorCode[] {
    return Object.keys(this.messages)
      .filter(code => Boolean(this.messages[code as ErrorCode]().action))
      .map(code => code as ErrorCode);
  }

  static getCriticalErrors(): ErrorCode[] {
    const criticalErrors = [
      ErrorCode.SYSTEM_ERROR,
      ErrorCode.DB_CONNECTION_FAILED,
      ErrorCode.SUSPICIOUS_ACTIVITY,
      ErrorCode.ACCOUNT_LOCKED,
      ErrorCode.IP_BLOCKED,
    ];

    return criticalErrors;
  }

  static shouldShowRetry(errorCode: ErrorCode): boolean {
    const retryableErrors = [
      ErrorCode.DB_CONNECTION_FAILED,
      ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
      ErrorCode.EXTERNAL_SERVICE_TIMEOUT,
      ErrorCode.AI_SERVICE_ERROR,
      ErrorCode.PAYMENT_GATEWAY_ERROR,
      ErrorCode.FILE_UPLOAD_FAILED,
    ];

    return retryableErrors.includes(errorCode);
  }

  static shouldContactSupport(errorCode: ErrorCode): boolean {
    const supportRequiredErrors = [
      ErrorCode.ACCOUNT_LOCKED,
      ErrorCode.SUSPICIOUS_ACTIVITY,
      ErrorCode.IP_BLOCKED,
      ErrorCode.INSUFFICIENT_PERMISSIONS,
      ErrorCode.SYSTEM_ERROR,
    ];

    return supportRequiredErrors.includes(errorCode);
  }

  static getLocalizedMessage(
    errorCode: ErrorCode,
    locale: string = 'en',
    context?: ErrorContext
  ): UserFriendlyMessage {
    // For now, only English is supported
    // In a real application, you would have locale-specific message mappings
    if (locale !== 'en') {
      console.warn(`Locale ${locale} not supported, falling back to English`);
    }

    return this.getUserMessage(errorCode, context);
  }
}

// Convenience functions for common use cases
export const getUserMessage = UserMessageService.getUserMessage;
export const formatErrorMessage = UserMessageService.formatMessage;
export const shouldShowRetry = UserMessageService.shouldShowRetry;
export const shouldContactSupport = UserMessageService.shouldContactSupport;

// React hook for error messages
export const useErrorMessage = (errorCode?: ErrorCode, context?: ErrorContext) => {
  return React.useMemo(() => {
    if (!errorCode) return null;
    return UserMessageService.getUserMessage(errorCode, context);
  }, [errorCode, context]);
};

// Default export for the service
export default UserMessageService;