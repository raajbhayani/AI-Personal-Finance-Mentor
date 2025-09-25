import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useMutation } from '@apollo/client';
import { verifyToken, isTokenExpired, JWTPayload } from '@/lib/utils/auth';
import { LOGIN_MUTATION, SIGNUP_MUTATION, LOGOUT_MUTATION, REFRESH_TOKEN_MUTATION } from '@/lib/graphql/mutations/auth';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  currency: string;
  timezone?: string;
  dateOfBirth?: Date;
  preferences: {
    darkMode: boolean;
    notifications: {
      email: boolean;
      push: boolean;
      goalReminders: boolean;
      budgetAlerts: boolean;
      weeklyReports: boolean;
      monthlyReports: boolean;
    };
    privacy: {
      shareDataForInsights: boolean;
      allowMarketing: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface SignupInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth?: Date;
  currency?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signup: (input: SignupInput) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    token: null,
  });

  const [loginMutation] = useMutation(LOGIN_MUTATION);
  const [signupMutation] = useMutation(SIGNUP_MUTATION);
  const [logoutMutation] = useMutation(LOGOUT_MUTATION);
  const [refreshTokenMutation] = useMutation(REFRESH_TOKEN_MUTATION);

  const isClient = typeof window !== 'undefined';

  const getStoredToken = (): string | null => {
    if (!isClient) return null;

    return localStorage.getItem('authToken') ||
           sessionStorage.getItem('authToken') ||
           document.cookie
             .split('; ')
             .find(row => row.startsWith('auth-token='))
             ?.split('=')[1] || null;
  };

  const setTokenStorage = (token: string, rememberMe: boolean = false) => {
    if (!isClient) return;

    if (rememberMe) {
      localStorage.setItem('authToken', token);
    } else {
      sessionStorage.setItem('authToken', token);
    }

    document.cookie = `auth-token=${token}; path=/; max-age=${rememberMe ? 7 * 24 * 60 * 60 : 0}; secure; samesite=strict`;
  };

  const clearTokenStorage = () => {
    if (!isClient) return;

    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; secure; samesite=strict';
  };

  const fetchUserProfile = async (token: string): Promise<User | null> => {
    try {
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const validateAndSetAuth = async (token: string) => {
    try {
      if (isTokenExpired(token)) {
        clearTokenStorage();
        setState(prev => ({ ...prev, isLoading: false, isAuthenticated: false, user: null, token: null }));
        return false;
      }

      const payload: JWTPayload = verifyToken(token);
      if (!payload || !payload.userId) {
        clearTokenStorage();
        setState(prev => ({ ...prev, isLoading: false, isAuthenticated: false, user: null, token: null }));
        return false;
      }

      const userProfile = await fetchUserProfile(token);
      if (!userProfile) {
        clearTokenStorage();
        setState(prev => ({ ...prev, isLoading: false, isAuthenticated: false, user: null, token: null }));
        return false;
      }

      setState(prev => ({
        ...prev,
        user: userProfile,
        isAuthenticated: true,
        token,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      clearTokenStorage();
      setState(prev => ({ ...prev, isLoading: false, isAuthenticated: false, user: null, token: null }));
      return false;
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const { data } = await loginMutation({
        variables: {
          input: { email, password }
        }
      });

      if (!data.login.token) {
        throw new Error('No authentication token received');
      }

      setTokenStorage(data.login.token, rememberMe);

      setState(prev => ({
        ...prev,
        user: data.login.user,
        isAuthenticated: true,
        token: data.login.token,
        isLoading: false,
      }));

    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      throw new Error(errorMessage);
    }
  };

  const signup = async (input: SignupInput): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const { data } = await signupMutation({
        variables: { input }
      });

      if (!data.signup.token) {
        throw new Error('No authentication token received');
      }

      setTokenStorage(data.signup.token, true);

      setState(prev => ({
        ...prev,
        user: data.signup.user,
        isAuthenticated: true,
        token: data.signup.token,
        isLoading: false,
      }));

    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    clearTokenStorage();
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      token: null,
    });

    if (router.pathname !== '/login' && router.pathname !== '/' && !router.pathname.startsWith('/signup')) {
      router.push('/login');
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    const currentToken = state.token || getStoredToken();
    if (!currentToken) return false;

    try {
      const { data } = await refreshTokenMutation();

      if (data.refreshToken.token) {
        setTokenStorage(data.refreshToken.token, true);
        setState(prev => ({
          ...prev,
          token: data.refreshToken.token,
          user: data.refreshToken.user
        }));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      return false;
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...userData } : null,
    }));
  };

  useEffect(() => {
    if (!isClient) return;

    const initializeAuth = async () => {
      const token = getStoredToken();

      if (!token) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      await validateAndSetAuth(token);
    };

    initializeAuth();
  }, [isClient]);

  useEffect(() => {
    if (!isClient || !state.token) return;

    const checkTokenExpiry = () => {
      const token = state.token || getStoredToken();
      if (token && isTokenExpired(token)) {
        logout();
      }
    };

    const interval = setInterval(checkTokenExpiry, 60000);
    return () => clearInterval(interval);
  }, [state.token, isClient]);

  useEffect(() => {
    if (!isClient) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken') {
        if (e.newValue) {
          validateAndSetAuth(e.newValue);
        } else {
          logout();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isClient]);

  const contextValue: AuthContextType = {
    ...state,
    login,
    signup,
    logout,
    refreshToken,
    updateUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}