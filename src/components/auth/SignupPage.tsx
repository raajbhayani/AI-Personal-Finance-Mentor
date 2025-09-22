'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { User, Mail, Lock, DollarSign, ArrowRight, CheckCircle } from 'lucide-react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import PasswordStrengthIndicator from '../ui/PasswordStrengthIndicator';
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateName,
} from '../../lib/utils/validation';

interface SignupForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface SignupFormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function SignupPage() {
  const [formData, setFormData] = useState<SignupForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleInputChange = (field: keyof SignupForm) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: SignupFormErrors = {};

    // Validate name
    const nameError = validateName(formData.name);
    if (nameError) {
      newErrors.name = nameError;
    }

    // Validate email
    const emailError = validateEmail(formData.email);
    if (emailError) {
      newErrors.email = emailError;
    }

    // Validate password
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      newErrors.password = passwordError;
    }

    // Validate confirm password
    const confirmPasswordError = validateConfirmPassword(formData.password, formData.confirmPassword);
    if (confirmPasswordError) {
      newErrors.confirmPassword = confirmPasswordError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!agreeToTerms) {
      setErrors({ general: 'Please agree to the Terms of Service and Privacy Policy to continue.' });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate success
      setShowSuccess(true);

      // In real app, redirect to email verification or dashboard
      setTimeout(() => {
        console.log('Signup successful');
      }, 3000);
    } catch (error) {
      setErrors({ general: 'Something went wrong. Please try again later.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 p-8 text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome aboard!</h2>
              <p className="text-gray-600">
                Your account has been created successfully. Please check your email to verify your account.
              </p>
            </div>
            <Link href="/login">
              <Button className="w-full" rightIcon={<ArrowRight className="h-5 w-5" />}>
                Continue to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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

          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h2>
          <p className="text-gray-600">
            Join thousands of users who are already improving their financial health
          </p>
        </div>

        {/* Signup Card */}
        <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 p-8 space-y-6">
          {/* Error Alert */}
          {errors.general && (
            <Alert variant="error" dismissible onDismiss={() => setErrors({ ...errors, general: undefined })}>
              {errors.general}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input */}
            <Input
              type="text"
              label="Full name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleInputChange('name')}
              error={errors.name}
              leftIcon={<User className="h-5 w-5" />}
              required
              autoComplete="name"
              disabled={isLoading}
            />

            {/* Email Input */}
            <Input
              type="email"
              label="Email address"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange('email')}
              error={errors.email}
              leftIcon={<Mail className="h-5 w-5" />}
              required
              autoComplete="email"
              disabled={isLoading}
            />

            {/* Password Input */}
            <div className="space-y-3">
              <Input
                type="password"
                label="Password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleInputChange('password')}
                error={errors.password}
                leftIcon={<Lock className="h-5 w-5" />}
                showPasswordToggle
                required
                autoComplete="new-password"
                disabled={isLoading}
              />

              {/* Password Strength Indicator */}
              {formData.password && (
                <PasswordStrengthIndicator
                  password={formData.password}
                  showDetails={true}
                />
              )}
            </div>

            {/* Confirm Password Input */}
            <Input
              type="password"
              label="Confirm password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              error={errors.confirmPassword}
              leftIcon={<Lock className="h-5 w-5" />}
              showPasswordToggle
              required
              autoComplete="new-password"
              disabled={isLoading}
            />

            {/* Terms Agreement */}
            <div className="space-y-4">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-200"
                  disabled={isLoading}
                  required
                />
                <span className="text-sm text-gray-600 leading-relaxed">
                  I agree to the{' '}
                  <Link
                    href="/terms"
                    className="text-blue-600 hover:text-blue-500 transition-colors duration-200 focus:outline-none focus:underline"
                  >
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link
                    href="/privacy"
                    className="text-blue-600 hover:text-blue-500 transition-colors duration-200 focus:outline-none focus:underline"
                  >
                    Privacy Policy
                  </Link>
                </span>
              </label>

              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={subscribeNewsletter}
                  onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-200"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-600 leading-relaxed">
                  Subscribe to our newsletter for financial tips and product updates
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              loading={isLoading}
              disabled={isLoading || !agreeToTerms}
              className="w-full"
              rightIcon={!isLoading && <ArrowRight className="h-5 w-5" />}
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or sign up with</span>
            </div>
          </div>

          {/* Social Signup */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              disabled={isLoading}
              className="flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </Button>

            <Button
              variant="outline"
              disabled={isLoading}
              className="flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </Button>
          </div>

          {/* Login link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200 focus:outline-none focus:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}