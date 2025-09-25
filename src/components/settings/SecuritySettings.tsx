'use client';

import React, { useState } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  Shield,
  Smartphone,
  Key,
  AlertTriangle,
  CheckCircle,
  Clock,
  Monitor,
  MapPin,
  Save
} from 'lucide-react';
import { useFormSubmission } from '@/hooks/useApiState';
import { ButtonLoading } from '../ui/Loading';
import ErrorDisplay from '../ui/ErrorDisplay';
import { cn } from '@/lib/utils/cn';

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface SecuritySession {
  id: string;
  device: string;
  location: string;
  ip: string;
  lastActive: string;
  current: boolean;
}

interface LoginActivity {
  id: string;
  device: string;
  location: string;
  ip: string;
  timestamp: string;
  success: boolean;
}

export default function SecuritySettings() {
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  const { submit: submitPassword, isSubmitting: isChangingPassword, error: passwordError } = useFormSubmission();

  // Mock data for sessions and activity
  const activeSessions: SecuritySession[] = [
    {
      id: '1',
      device: 'Chrome on Windows',
      location: 'New York, NY',
      ip: '192.168.1.1',
      lastActive: '2024-01-20T10:30:00Z',
      current: true
    },
    {
      id: '2',
      device: 'Safari on iPhone',
      location: 'New York, NY',
      ip: '192.168.1.2',
      lastActive: '2024-01-19T15:45:00Z',
      current: false
    },
    {
      id: '3',
      device: 'Firefox on MacOS',
      location: 'Los Angeles, CA',
      ip: '192.168.1.3',
      lastActive: '2024-01-18T09:20:00Z',
      current: false
    }
  ];

  const recentActivity: LoginActivity[] = [
    {
      id: '1',
      device: 'Chrome on Windows',
      location: 'New York, NY',
      ip: '192.168.1.1',
      timestamp: '2024-01-20T10:30:00Z',
      success: true
    },
    {
      id: '2',
      device: 'Unknown device',
      location: 'London, UK',
      ip: '192.168.1.4',
      timestamp: '2024-01-19T22:15:00Z',
      success: false
    },
    {
      id: '3',
      device: 'Safari on iPhone',
      location: 'New York, NY',
      ip: '192.168.1.2',
      timestamp: '2024-01-19T15:45:00Z',
      success: true
    }
  ];

  const validatePassword = (): boolean => {
    const errors: Record<string, string> = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else {
      // Password strength validation
      if (passwordData.newPassword.length < 8) {
        errors.newPassword = 'Password must be at least 8 characters long';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
        errors.newPassword = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
      } else if (passwordData.newPassword === passwordData.currentPassword) {
        errors.newPassword = 'New password must be different from current password';
      }
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword()) {
      return;
    }

    const result = await submitPassword(passwordData, async (data) => {
      // Mock API call
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (data.currentPassword === 'wrongpassword') {
            reject(new Error('Current password is incorrect'));
          } else {
            resolve({ success: true, message: 'Password changed successfully' });
          }
        }, 1000);
      });
    }, {
      successMessage: 'Password changed successfully!',
      errorMessage: 'Failed to change password. Please check your current password and try again.'
    });

    if (result) {
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  };

  const handlePasswordInputChange = (field: keyof PasswordFormData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/(?=.*[a-z])(?=.*[A-Z])/.test(password)) strength += 1;
    if (/(?=.*\d)/.test(password)) strength += 1;
    if (/(?=.*[!@#$%^&*])/.test(password)) strength += 1;

    return {
      score: strength,
      label: ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][strength],
      color: ['red', 'orange', 'yellow', 'blue', 'green'][strength]
    };
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleRevokeSession = (sessionId: string) => {
    // Mock revoke session
    console.log('Revoking session:', sessionId);
  };

  return (
    <div className="space-y-6">
      {/* Password Change Section */}
      <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Change Password</h2>

        <form onSubmit={handlePasswordChange} className="space-y-6">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                className={cn(
                  'pl-10 pr-10 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors',
                  passwordErrors.currentPassword ? 'border-red-300' : 'border-gray-300'
                )}
                placeholder="Enter your current password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {passwordErrors.currentPassword && <p className="text-red-600 text-sm mt-1">{passwordErrors.currentPassword}</p>}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                className={cn(
                  'pl-10 pr-10 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors',
                  passwordErrors.newPassword ? 'border-red-300' : 'border-gray-300'
                )}
                placeholder="Enter your new password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {passwordData.newPassword && (
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 bg-${passwordStrength.color}-500`}
                      style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                    />
                  </div>
                  <span className={`text-sm font-medium text-${passwordStrength.color}-600`}>
                    {passwordStrength.label}
                  </span>
                </div>
              </div>
            )}

            {passwordErrors.newPassword && <p className="text-red-600 text-sm mt-1">{passwordErrors.newPassword}</p>}

            {/* Password Requirements */}
            <div className="mt-2 text-sm text-gray-600">
              <p>Password must contain:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li className={passwordData.newPassword.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                  At least 8 characters
                </li>
                <li className={/(?=.*[a-z])(?=.*[A-Z])/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-500'}>
                  Both uppercase and lowercase letters
                </li>
                <li className={/(?=.*\d)/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-500'}>
                  At least one number
                </li>
              </ul>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                className={cn(
                  'pl-10 pr-10 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors',
                  passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                )}
                placeholder="Confirm your new password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {passwordErrors.confirmPassword && <p className="text-red-600 text-sm mt-1">{passwordErrors.confirmPassword}</p>}
          </div>

          {/* Error Display */}
          {passwordError && (
            <ErrorDisplay
              type="validation"
              variant="toast"
              error={passwordError}
            />
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isChangingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isChangingPassword ? (
                <ButtonLoading text="Changing Password..." />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2 inline" />
                  Change Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Two-Factor Authentication</h2>

        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              twoFactorEnabled ? 'bg-green-100' : 'bg-gray-100'
            )}>
              <Shield className={cn('w-6 h-6', twoFactorEnabled ? 'text-green-600' : 'text-gray-400')} />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {twoFactorEnabled ? 'Two-Factor Authentication Enabled' : 'Enable Two-Factor Authentication'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {twoFactorEnabled
                    ? 'Your account is protected with two-factor authentication.'
                    : 'Add an extra layer of security to your account by enabling two-factor authentication.'
                  }
                </p>
              </div>

              <button
                onClick={() => {
                  if (twoFactorEnabled) {
                    setTwoFactorEnabled(false);
                    setShowQRCode(false);
                  } else {
                    setShowQRCode(!showQRCode);
                  }
                }}
                className={cn(
                  'px-4 py-2 rounded-lg transition-colors',
                  twoFactorEnabled
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                )}
              >
                {twoFactorEnabled ? 'Disable' : 'Enable'}
              </button>
            </div>

            {showQRCode && !twoFactorEnabled && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Setup Two-Factor Authentication</h4>
                <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
                  <li>Install an authenticator app (Google Authenticator, Authy, etc.)</li>
                  <li>Scan the QR code below with your authenticator app</li>
                  <li>Enter the 6-digit code from your app to verify</li>
                </ol>

                <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg text-center">
                  <div className="w-32 h-32 bg-gray-200 mx-auto mb-4 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500 text-sm">QR Code</span>
                  </div>
                  <p className="text-xs text-gray-500">Manual key: ABCD EFGH IJKL MNOP</p>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="000000"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => setTwoFactorEnabled(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Active Sessions</h2>

        <div className="space-y-4">
          {activeSessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Monitor className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{session.device}</h4>
                    {session.current && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>{session.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Last active: {formatDate(session.lastActive)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">IP: {session.ip}</p>
                </div>
              </div>

              {!session.current && (
                <button
                  onClick={() => handleRevokeSession(session.id)}
                  className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Login Activity */}
      <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Login Activity</h2>

        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center space-x-4">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  activity.success ? 'bg-green-500' : 'bg-red-500'
                )}></div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{activity.device}</span>
                    {activity.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{activity.location}</span>
                    <span>{formatDate(activity.timestamp)}</span>
                  </div>
                </div>
              </div>
              <span className={cn(
                'px-2 py-1 text-xs font-medium rounded-full',
                activity.success
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              )}>
                {activity.success ? 'Success' : 'Failed'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}