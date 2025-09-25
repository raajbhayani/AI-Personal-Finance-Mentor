import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Mail, Lock, DollarSign, ArrowRight } from 'lucide-react';
import { loginSchema, type LoginFormData } from '@/lib/validation/schemas';
import { useFormValidation } from '@/lib/hooks/useFormValidation';
import { InputField } from '@/components/ui/FormField';
import ValidationFeedback, { FormValidationSummary } from '@/components/ui/ValidationFeedback';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [serverError, setServerError] = useState<string>('');

  const {
    values,
    setValue,
    isValid,
    errors,
    isSubmitting,
    handleSubmit,
    setError,
    clearErrors,
    getFieldProps,
  } = useFormValidation(loginSchema, {
    email: '',
    password: '',
    rememberMe: false,
  }, {
    validateOnChange: true,
    validateOnBlur: true,
    debounceDelay: 300,
  });

  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const redirectTo = (router.query.redirect as string) || '/dashboard';
      router.push(redirectTo);
    }
  }, [isAuthenticated, authLoading, router]);

  // Handle URL parameters for redirect
  useEffect(() => {
    const { redirect, error, expired, message } = router.query;

    if (error) {
      let errorMessage = 'Login failed. Please try again.';
      if (error === 'invalid') {
        errorMessage = 'Your session is invalid. Please sign in again.';
      }
      setServerError(errorMessage);
    }

    if (expired) {
      setServerError('Your session has expired. Please sign in again.');
    }

    if (message) {
      console.log('Message:', message);
    }
  }, [router.query]);

  const onSubmit = async (formData: LoginFormData) => {
    setServerError('');
    clearErrors();

    try {
      await login(formData.email, formData.password, formData.rememberMe);
      const redirectTo = (router.query.redirect as string) || '/dashboard';
      router.push(redirectTo);
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Invalid email or password. Please try again.';
      setServerError(errorMessage);
      setError('general', errorMessage);
    }
  };

  return (
    <>
      <Head>
        <title>Login - AI Personal Finance Mentor</title>
        <meta name="description" content="Sign in to your AI Personal Finance Mentor account to manage your finances" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-to-r from-blue-400/10 to-emerald-400/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-8 -left-8 w-96 h-96 bg-gradient-to-r from-emerald-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center space-x-2 mb-8 group">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-xl group-hover:shadow-lg transition-all duration-300">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                FinanceMentor
              </span>
            </Link>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
            <p className="text-gray-600">
              Sign in to your account to continue your financial journey
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 p-8 space-y-6">
            {/* Server Error */}
            {serverError && (
              <ValidationFeedback
                type="error"
                message={serverError}
                onDismiss={() => setServerError('')}
                dismissible
              />
            )}

            {/* Form Validation Summary */}
            <FormValidationSummary
              errors={errors}
              onDismiss={clearErrors}
            />

            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit); }} className="space-y-6">
              {/* Email Input */}
              <InputField
                label="Email address"
                type="email"
                required
                placeholder="Enter your email"
                autoComplete="email"
                leftIcon={<Mail className="h-5 w-5" />}
                disabled={isSubmitting || authLoading}
                {...getFieldProps('email')}
              />

              {/* Password Input */}
              <InputField
                label="Password"
                type="password"
                required
                placeholder="Enter your password"
                autoComplete="current-password"
                leftIcon={<Lock className="h-5 w-5" />}
                showPasswordToggle
                disabled={isSubmitting || authLoading}
                {...getFieldProps('password')}
              />

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={values.rememberMe}
                    onChange={(e) => setValue('rememberMe', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-200 touch-manipulation"
                    disabled={isSubmitting || authLoading}
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>

                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-500 transition-colors duration-200 focus:outline-none focus:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || authLoading || !isValid}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-4 sm:py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-base min-h-[52px]"
              >
                {isSubmitting || authLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    Sign in
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </div>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isLoading || authLoading}
                className="flex items-center justify-center px-4 py-3 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-[0.98] min-h-[48px]"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>

              <button
                type="button"
                disabled={isLoading || authLoading}
                className="flex items-center justify-center px-4 py-3 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-[0.98] min-h-[48px]"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </button>
            </div>

            {/* Sign up link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  href="/signup"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200 focus:outline-none focus:underline"
                >
                  Create one now
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              By signing in, you agree to our{' '}
              <Link href="/terms" className="text-blue-600 hover:text-blue-500 transition-colors duration-200">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-blue-600 hover:text-blue-500 transition-colors duration-200">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}