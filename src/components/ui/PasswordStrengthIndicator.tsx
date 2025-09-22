'use client';

import React from 'react';
import { Check, X } from 'lucide-react';
import { getPasswordStrength, type PasswordStrength } from '../../lib/utils/validation';
import { cn } from '../../lib/utils/cn';

interface PasswordStrengthIndicatorProps {
  password: string;
  showDetails?: boolean;
}

const strengthLabels = {
  0: 'Very Weak',
  1: 'Weak',
  2: 'Fair',
  3: 'Good',
  4: 'Strong',
  5: 'Very Strong',
};

const strengthColors = {
  0: 'bg-red-500',
  1: 'bg-red-400',
  2: 'bg-yellow-500',
  3: 'bg-blue-500',
  4: 'bg-emerald-500',
  5: 'bg-emerald-600',
};

const strengthTextColors = {
  0: 'text-red-600',
  1: 'text-red-500',
  2: 'text-yellow-600',
  3: 'text-blue-600',
  4: 'text-emerald-600',
  5: 'text-emerald-700',
};

export default function PasswordStrengthIndicator({
  password,
  showDetails = true,
}: PasswordStrengthIndicatorProps) {
  const strength = getPasswordStrength(password);

  if (!password) {
    return null;
  }

  const requirements = [
    { label: 'At least 8 characters', test: password.length >= 8 },
    { label: 'Contains uppercase letter', test: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', test: /[a-z]/.test(password) },
    { label: 'Contains number', test: /\d/.test(password) },
    { label: 'Contains special character', test: /[@$!%*?&]/.test(password) },
  ];

  return (
    <div className="space-y-3">
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Password Strength</span>
          <span className={cn('text-sm font-medium', strengthTextColors[strength.score])}>
            {strengthLabels[strength.score]}
          </span>
        </div>

        <div className="flex space-x-1">
          {[0, 1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className={cn(
                'h-2 flex-1 rounded-full transition-all duration-300',
                index < strength.score
                  ? strengthColors[strength.score]
                  : 'bg-gray-200'
              )}
            />
          ))}
        </div>

        <div className="text-xs text-gray-500">
          {Math.round(strength.percentage)}% complete
        </div>
      </div>

      {/* Requirements Checklist */}
      {showDetails && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Password Requirements</h4>
          <div className="space-y-1">
            {requirements.map((requirement, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div
                  className={cn(
                    'flex items-center justify-center w-4 h-4 rounded-full transition-all duration-200',
                    requirement.test
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-gray-100 text-gray-400'
                  )}
                >
                  {requirement.test ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <X className="w-3 h-3" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-sm transition-colors duration-200',
                    requirement.test ? 'text-emerald-600' : 'text-gray-500'
                  )}
                >
                  {requirement.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback Messages */}
      {strength.feedback.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-blue-800 mb-1">Suggestions:</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            {strength.feedback.slice(0, 3).map((feedback, index) => (
              <li key={index} className="flex items-start space-x-1">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{feedback}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}