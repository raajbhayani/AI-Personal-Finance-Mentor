export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  percentage: number;
}

export const ValidationMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  minLength: (min: number) => `Must be at least ${min} characters`,
  maxLength: (max: number) => `Must not exceed ${max} characters`,
  password: {
    minLength: 'Password must be at least 8 characters',
    uppercase: 'Password must contain at least one uppercase letter',
    lowercase: 'Password must contain at least one lowercase letter',
    number: 'Password must contain at least one number',
    special: 'Password must contain at least one special character',
  },
  confirmPassword: 'Passwords do not match',
  name: 'Name must contain only letters and spaces',
};

export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  name: /^[a-zA-Z\s]+$/,
  phone: /^\+?[\d\s-()]+$/,
};

export function validateField(value: string, rules: ValidationRule): string | null {
  if (rules.required && (!value || value.trim() === '')) {
    return ValidationMessages.required;
  }

  if (value && rules.minLength && value.length < rules.minLength) {
    return ValidationMessages.minLength(rules.minLength);
  }

  if (value && rules.maxLength && value.length > rules.maxLength) {
    return ValidationMessages.maxLength(rules.maxLength);
  }

  if (value && rules.pattern && !rules.pattern.test(value)) {
    return 'Invalid format';
  }

  if (value && rules.custom) {
    return rules.custom(value);
  }

  return null;
}

export function validateEmail(email: string): string | null {
  return validateField(email, {
    required: true,
    pattern: ValidationPatterns.email,
    custom: (value) => {
      if (!ValidationPatterns.email.test(value)) {
        return ValidationMessages.email;
      }
      return null;
    },
  });
}

export function validatePassword(password: string): string | null {
  if (!password || password.length < 8) {
    return ValidationMessages.password.minLength;
  }

  const feedback: string[] = [];

  if (!/[A-Z]/.test(password)) {
    feedback.push(ValidationMessages.password.uppercase);
  }

  if (!/[a-z]/.test(password)) {
    feedback.push(ValidationMessages.password.lowercase);
  }

  if (!/\d/.test(password)) {
    feedback.push(ValidationMessages.password.number);
  }

  if (!/[@$!%*?&]/.test(password)) {
    feedback.push(ValidationMessages.password.special);
  }

  return feedback.length > 0 ? feedback[0] : null;
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, feedback: ['Password is required'], percentage: 0 };
  }

  let score = 0;
  const feedback: string[] = [];

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Use at least 8 characters');
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add uppercase letters');
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add lowercase letters');
  }

  // Number check
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add numbers');
  }

  // Special character check
  if (/[@$!%*?&]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add special characters (@$!%*?&)');
  }

  // Length bonus
  if (password.length >= 12) {
    score = Math.min(score + 1, 5);
  }

  const percentage = Math.min((score / 4) * 100, 100);

  return { score, feedback, percentage };
}

export function validateConfirmPassword(password: string, confirmPassword: string): string | null {
  if (!confirmPassword) {
    return ValidationMessages.required;
  }

  if (password !== confirmPassword) {
    return ValidationMessages.confirmPassword;
  }

  return null;
}

export function validateName(name: string): string | null {
  return validateField(name, {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: ValidationPatterns.name,
    custom: (value) => {
      if (!ValidationPatterns.name.test(value)) {
        return ValidationMessages.name;
      }
      return null;
    },
  });
}

export function validateForm(
  data: Record<string, string>,
  validators: Record<string, (value: string) => string | null>
): FormValidationResult {
  const errors: ValidationError[] = [];

  Object.entries(validators).forEach(([field, validator]) => {
    const value = data[field] || '';
    const error = validator(value);
    if (error) {
      errors.push({ field, message: error });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}