import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';

// Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isEmailVerified: boolean;
  avatar?: string;
  preferences: {
    currency: string;
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
      budgetAlerts: boolean;
      goalReminders: boolean;
    };
    privacy: {
      dataSharing: boolean;
      analytics: boolean;
    };
  };
  createdAt: string;
  lastLogin?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupCredentials {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  acceptTerms: boolean;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message: string }>;
  signup: (credentials: SignupCredentials) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
}

// Action types
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOGOUT' };

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    default:
      return state;
  }
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API helper functions
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`/api/auth${endpoint}`, defaultOptions);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'An error occurred');
  }

  return data;
}

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Auto-refresh token periodically
  useEffect(() => {
    if (state.isAuthenticated) {
      const interval = setInterval(() => {
        refreshAuth();
      }, 14 * 60 * 1000); // Refresh every 14 minutes

      return () => clearInterval(interval);
    }
  }, [state.isAuthenticated]);

  async function checkAuthStatus() {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const data = await apiCall('/me');
      dispatch({ type: 'SET_USER', payload: data.user });
    } catch (error) {
      dispatch({ type: 'SET_USER', payload: null });
    }
  }

  async function login(credentials: LoginCredentials) {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const data = await apiCall('/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      dispatch({ type: 'SET_USER', payload: data.user });

      return { success: true, message: data.message };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      return { success: false, message };
    }
  }

  async function signup(credentials: SignupCredentials) {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const data = await apiCall('/signup', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      dispatch({ type: 'SET_USER', payload: data.user });

      return { success: true, message: data.message };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Signup failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      return { success: false, message };
    }
  }

  async function logout() {
    try {
      await apiCall('/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
      router.push('/login');
    }
  }

  async function refreshAuth() {
    try {
      const data = await apiCall('/refresh', { method: 'POST' });
      dispatch({ type: 'SET_USER', payload: data.user });
    } catch (error) {
      // If refresh fails, log out user
      dispatch({ type: 'LOGOUT' });
    }
  }

  function clearError() {
    dispatch({ type: 'CLEAR_ERROR' });
  }

  const value: AuthContextType = {
    ...state,
    login,
    signup,
    logout,
    refreshAuth,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protected routes
interface WithAuthOptions {
  redirectTo?: string;
  requiredRoles?: string[];
}

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const { redirectTo = '/login', requiredRoles = [] } = options;

  return function AuthenticatedComponent(props: P) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading) {
        if (!isAuthenticated) {
          router.push(redirectTo);
          return;
        }

        if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
          router.push('/unauthorized');
          return;
        }
      }
    }, [isAuthenticated, isLoading, user, router]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
      return null;
    }

    return <Component {...props} />;
  };
}

// Hook for protected pages
export function useRequireAuth(redirectTo = '/login') {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return { isAuthenticated, isLoading };
}