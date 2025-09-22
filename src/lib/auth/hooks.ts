import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context';

// Hook for form handling with authentication
export function useAuthForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { error: authError, clearError } = useAuth();

  const clearErrors = useCallback(() => {
    setErrors({});
    clearError();
  }, [clearError]);

  const setFieldError = useCallback((field: string, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  return {
    isSubmitting,
    setIsSubmitting,
    errors,
    setErrors,
    authError,
    clearErrors,
    setFieldError,
    clearFieldError,
  };
}

// Hook for checking user permissions
export function usePermissions() {
  const { user } = useAuth();

  const hasRole = useCallback((role: string) => {
    return user?.role === role;
  }, [user?.role]);

  const hasAnyRole = useCallback((roles: string[]) => {
    return user?.role ? roles.includes(user.role) : false;
  }, [user?.role]);

  const isAdmin = useCallback(() => {
    return user?.role === 'ADMIN';
  }, [user?.role]);

  const isPremium = useCallback(() => {
    return user?.role === 'PREMIUM' || user?.role === 'ADMIN';
  }, [user?.role]);

  const isEmailVerified = useCallback(() => {
    return user?.isEmailVerified === true;
  }, [user?.isEmailVerified]);

  return {
    hasRole,
    hasAnyRole,
    isAdmin,
    isPremium,
    isEmailVerified,
  };
}

// Hook for session management
export function useSession() {
  const { user, isAuthenticated, isLoading, refreshAuth } = useAuth();
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Update last activity time
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  // Auto-refresh session on activity
  useEffect(() => {
    if (isAuthenticated) {
      const events = ['click', 'keypress', 'scroll', 'mousemove'];

      events.forEach(event => {
        document.addEventListener(event, updateActivity, { passive: true });
      });

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, updateActivity);
        });
      };
    }
  }, [isAuthenticated, updateActivity]);

  // Check for session timeout
  useEffect(() => {
    if (isAuthenticated) {
      const checkTimeout = setInterval(() => {
        const timeSinceLastActivity = Date.now() - lastActivity;
        const timeoutDuration = 30 * 60 * 1000; // 30 minutes

        if (timeSinceLastActivity > timeoutDuration) {
          // Session timeout - refresh auth to check if still valid
          refreshAuth();
        }
      }, 60 * 1000); // Check every minute

      return () => clearInterval(checkTimeout);
    }
  }, [isAuthenticated, lastActivity, refreshAuth]);

  return {
    user,
    isAuthenticated,
    isLoading,
    lastActivity,
    updateActivity,
  };
}

// Hook for user preferences
export function useUserPreferences() {
  const { user } = useAuth();

  const getCurrency = useCallback(() => {
    return user?.preferences?.currency || 'USD';
  }, [user?.preferences?.currency]);

  const getLanguage = useCallback(() => {
    return user?.preferences?.language || 'en';
  }, [user?.preferences?.language]);

  const getTimezone = useCallback(() => {
    return user?.preferences?.timezone || 'UTC';
  }, [user?.preferences?.timezone]);

  const getNotificationSettings = useCallback(() => {
    return user?.preferences?.notifications || {
      email: true,
      push: true,
      budgetAlerts: true,
      goalReminders: true,
    };
  }, [user?.preferences?.notifications]);

  const getPrivacySettings = useCallback(() => {
    return user?.preferences?.privacy || {
      dataSharing: false,
      analytics: true,
    };
  }, [user?.preferences?.privacy]);

  return {
    getCurrency,
    getLanguage,
    getTimezone,
    getNotificationSettings,
    getPrivacySettings,
  };
}

// Hook for authentication state management
export function useAuthState() {
  const auth = useAuth();
  const [previousAuthState, setPreviousAuthState] = useState(auth.isAuthenticated);

  useEffect(() => {
    if (previousAuthState !== auth.isAuthenticated) {
      // Authentication state changed
      if (auth.isAuthenticated) {
        // User just logged in
        console.log('User logged in');
      } else {
        // User just logged out
        console.log('User logged out');
      }
      setPreviousAuthState(auth.isAuthenticated);
    }
  }, [auth.isAuthenticated, previousAuthState]);

  return {
    ...auth,
    wasRecentlyAuthenticated: previousAuthState === false && auth.isAuthenticated === true,
    wasRecentlyLoggedOut: previousAuthState === true && auth.isAuthenticated === false,
  };
}

// Hook for handling authentication redirects
export function useAuthRedirect() {
  const { isAuthenticated, isLoading } = useAuth();

  const getRedirectPath = useCallback((currentPath: string, isProtected: boolean = true) => {
    if (isLoading) return null;

    if (isProtected && !isAuthenticated) {
      return `/login?redirect=${encodeURIComponent(currentPath)}`;
    }

    if (!isProtected && isAuthenticated) {
      // Redirect authenticated users away from auth pages
      const authPages = ['/login', '/signup', '/forgot-password'];
      if (authPages.includes(currentPath)) {
        return '/dashboard';
      }
    }

    return null;
  }, [isAuthenticated, isLoading]);

  return { getRedirectPath };
}

// Hook for validation states
export function useValidation() {
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  const validateField = useCallback((field: string, value: any, rules: any[]) => {
    const errors: string[] = [];

    rules.forEach(rule => {
      if (rule.required && (!value || value.toString().trim() === '')) {
        errors.push(rule.message || `${field} is required`);
      }

      if (rule.minLength && value && value.toString().length < rule.minLength) {
        errors.push(rule.message || `${field} must be at least ${rule.minLength} characters`);
      }

      if (rule.maxLength && value && value.toString().length > rule.maxLength) {
        errors.push(rule.message || `${field} cannot exceed ${rule.maxLength} characters`);
      }

      if (rule.pattern && value && !rule.pattern.test(value.toString())) {
        errors.push(rule.message || `${field} format is invalid`);
      }

      if (rule.custom && value) {
        const customError = rule.custom(value);
        if (customError) {
          errors.push(customError);
        }
      }
    });

    setValidationErrors(prev => ({
      ...prev,
      [field]: errors,
    }));

    return errors.length === 0;
  }, []);

  const clearValidationErrors = useCallback(() => {
    setValidationErrors({});
  }, []);

  const clearFieldValidationErrors = useCallback((field: string) => {
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  return {
    validationErrors,
    validateField,
    clearValidationErrors,
    clearFieldValidationErrors,
  };
}