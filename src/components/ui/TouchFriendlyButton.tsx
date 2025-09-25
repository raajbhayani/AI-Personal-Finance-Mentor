'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { designTokens } from '@/lib/design/tokens';
import { touchFeedback, useRippleEffect, useTouchGestures, touchPreferences } from '@/lib/touch/feedback';
import { ariaPatterns } from '@/lib/accessibility/aria';

interface TouchFriendlyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  hapticFeedback?: 'tap' | 'press' | 'success' | 'error' | 'none';
  rippleEffect?: boolean;
  children: React.ReactNode;
}

export function TouchFriendlyButton({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  loadingText,
  leftIcon,
  rightIcon,
  hapticFeedback = 'tap',
  rippleEffect = true,
  disabled,
  className,
  onClick,
  onTouchStart,
  children,
  'aria-label': ariaLabel,
  ...props
}: TouchFriendlyButtonProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const addRipple = useRippleEffect();
  const gestureDetector = useTouchGestures(buttonRef);

  const isDisabled = disabled || loading;

  // Handle click with haptic feedback
  const handleClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) return;

    // Trigger haptic feedback
    if (hapticFeedback !== 'none' && touchPreferences.hapticsEnabled) {
      switch (hapticFeedback) {
        case 'tap':
          touchFeedback.tap();
          break;
        case 'press':
          touchFeedback.press();
          break;
        case 'success':
          touchFeedback.success();
          break;
        case 'error':
          touchFeedback.error();
          break;
      }
    }

    // Trigger ripple effect
    if (rippleEffect && touchPreferences.rippleEnabled) {
      addRipple(event);
    }

    onClick?.(event);
  }, [isDisabled, hapticFeedback, rippleEffect, addRipple, onClick]);

  // Handle touch start for immediate feedback
  const handleTouchStart = React.useCallback((event: React.TouchEvent<HTMLButtonElement>) => {
    if (isDisabled) return;

    // Immediate light haptic feedback on touch
    if (touchPreferences.hapticsEnabled) {
      touchFeedback.tap();
    }

    onTouchStart?.(event);
  }, [isDisabled, onTouchStart]);

  // Button size configurations (minimum 44px touch target)
  const sizeConfig = {
    sm: {
      minHeight: '44px',
      padding: '12px 16px',
      fontSize: designTokens.typography.fontSize.sm[0],
      iconSize: '16px',
      gap: '8px',
    },
    md: {
      minHeight: '48px',
      padding: '14px 20px',
      fontSize: designTokens.typography.fontSize.base[0],
      iconSize: '18px',
      gap: '10px',
    },
    lg: {
      minHeight: '52px',
      padding: '16px 24px',
      fontSize: designTokens.typography.fontSize.lg[0],
      iconSize: '20px',
      gap: '12px',
    },
    xl: {
      minHeight: '56px',
      padding: '18px 28px',
      fontSize: designTokens.typography.fontSize.xl[0],
      iconSize: '24px',
      gap: '14px',
    },
  };

  // Variant styles
  const variantStyles = {
    primary: {
      background: `linear-gradient(135deg, ${designTokens.colors.primary[500]}, ${designTokens.colors.primary[600]})`,
      color: designTokens.colors.gray[50],
      border: `1px solid ${designTokens.colors.primary[600]}`,
      shadow: designTokens.boxShadow.sm,
      active: {
        background: `linear-gradient(135deg, ${designTokens.colors.primary[600]}, ${designTokens.colors.primary[700]})`,
        transform: 'scale(0.98)',
      },
    },
    secondary: {
      background: `linear-gradient(135deg, ${designTokens.colors.secondary[500]}, ${designTokens.colors.secondary[600]})`,
      color: designTokens.colors.gray[50],
      border: `1px solid ${designTokens.colors.secondary[600]}`,
      shadow: designTokens.boxShadow.sm,
      active: {
        background: `linear-gradient(135deg, ${designTokens.colors.secondary[600]}, ${designTokens.colors.secondary[700]})`,
        transform: 'scale(0.98)',
      },
    },
    outline: {
      background: 'transparent',
      color: designTokens.colors.primary[600],
      border: `2px solid ${designTokens.colors.primary[300]}`,
      shadow: 'none',
      active: {
        background: designTokens.colors.primary[50],
        borderColor: designTokens.colors.primary[500],
        transform: 'scale(0.98)',
      },
    },
    ghost: {
      background: 'transparent',
      color: designTokens.colors.gray[700],
      border: '2px solid transparent',
      shadow: 'none',
      active: {
        background: designTokens.colors.gray[100],
        transform: 'scale(0.98)',
      },
    },
    destructive: {
      background: `linear-gradient(135deg, ${designTokens.colors.error[500]}, ${designTokens.colors.error[600]})`,
      color: designTokens.colors.gray[50],
      border: `1px solid ${designTokens.colors.error[600]}`,
      shadow: designTokens.boxShadow.sm,
      active: {
        background: `linear-gradient(135deg, ${designTokens.colors.error[600]}, ${designTokens.colors.error[700]})`,
        transform: 'scale(0.98)',
      },
    },
  };

  const config = sizeConfig[size];
  const styles = variantStyles[variant];

  const buttonClasses = cn(
    // Base styles
    'relative inline-flex items-center justify-center',
    'font-medium rounded-lg transition-all duration-150 ease-out',
    'select-none overflow-hidden',
    'touch-manipulation', // Optimizes for touch
    'active:scale-95', // Provides visual feedback

    // Focus styles
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'focus-visible:ring-primary-500',

    // Disabled styles
    isDisabled && 'opacity-60 cursor-not-allowed',

    // Full width
    fullWidth && 'w-full',

    className
  );

  const buttonStyle = {
    minHeight: config.minHeight,
    padding: config.padding,
    fontSize: config.fontSize,
    gap: config.gap,
    background: isDisabled ? designTokens.colors.gray[300] : styles.background,
    color: isDisabled ? designTokens.colors.gray[500] : styles.color,
    border: isDisabled ? `1px solid ${designTokens.colors.gray[300]}` : styles.border,
    boxShadow: isDisabled ? 'none' : styles.shadow,
  };

  // ARIA attributes
  const ariaAttributes = {
    ...ariaPatterns.button(
      ariaLabel || (typeof children === 'string' ? children : 'Button'),
      { disabled: isDisabled }
    ),
    'aria-busy': loading,
    ...(loading && loadingText && { 'aria-label': loadingText }),
  };

  return (
    <button
      ref={buttonRef}
      className={buttonClasses}
      style={buttonStyle}
      disabled={isDisabled}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      {...ariaAttributes}
      {...props}
    >
      {/* Loading state */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded-lg">
          <div
            className="animate-spin rounded-full border-2 border-current border-t-transparent"
            style={{ width: config.iconSize, height: config.iconSize }}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          'flex items-center justify-center',
          loading && 'opacity-0'
        )}
        style={{ gap: config.gap }}
      >
        {leftIcon && (
          <span
            className="flex-shrink-0"
            style={{ width: config.iconSize, height: config.iconSize }}
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        )}

        <span className="truncate">
          {children}
        </span>

        {rightIcon && (
          <span
            className="flex-shrink-0"
            style={{ width: config.iconSize, height: config.iconSize }}
            aria-hidden="true"
          >
            {rightIcon}
          </span>
        )}
      </div>

      {/* Touch feedback overlay */}
      <div className="absolute inset-0 rounded-lg pointer-events-none">
        <div className="absolute inset-0 bg-white opacity-0 transition-opacity duration-75 rounded-lg" />
      </div>
    </button>
  );
}

// Floating action button with enhanced touch support
interface TouchFabProps extends Omit<TouchFriendlyButtonProps, 'size' | 'children'> {
  icon: React.ReactNode;
  size?: 'md' | 'lg';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  'aria-label': string;
}

export function TouchFab({
  icon,
  size = 'lg',
  position = 'bottom-right',
  variant = 'primary',
  hapticFeedback = 'press',
  className,
  ...props
}: TouchFabProps) {
  const sizeClasses = {
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
  };

  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6',
  };

  return (
    <TouchFriendlyButton
      variant={variant}
      hapticFeedback={hapticFeedback}
      className={cn(
        'rounded-full shadow-lg hover:shadow-xl',
        'z-50 transition-all duration-200',
        'p-0', // Override padding for perfect circle
        sizeClasses[size],
        positionClasses[position],
        className
      )}
      {...props}
    >
      <span className="flex items-center justify-center text-xl" aria-hidden="true">
        {icon}
      </span>
    </TouchFriendlyButton>
  );
}

// Icon button with touch optimization
interface TouchIconButtonProps extends Omit<TouchFriendlyButtonProps, 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export function TouchIconButton({
  icon,
  size = 'md',
  variant = 'ghost',
  hapticFeedback = 'tap',
  className,
  ...props
}: TouchIconButtonProps) {
  const sizeConfig = {
    sm: 'w-11 h-11', // Minimum 44px
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
    xl: 'w-16 h-16',
  };

  return (
    <TouchFriendlyButton
      variant={variant}
      size={size}
      hapticFeedback={hapticFeedback}
      className={cn(
        'p-0 aspect-square rounded-full',
        sizeConfig[size],
        className
      )}
      {...props}
    >
      <span className="flex items-center justify-center" aria-hidden="true">
        {icon}
      </span>
    </TouchFriendlyButton>
  );
}

// Toggle button with enhanced touch feedback
interface TouchToggleButtonProps extends Omit<TouchFriendlyButtonProps, 'hapticFeedback'> {
  pressed: boolean;
  onToggle: (pressed: boolean) => void;
}

export function TouchToggleButton({
  pressed,
  onToggle,
  variant = 'outline',
  children,
  className,
  onClick,
  ...props
}: TouchToggleButtonProps) {
  const handleClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const newPressed = !pressed;
    onToggle(newPressed);

    // Different haptic feedback based on state
    if (newPressed) {
      touchFeedback.select();
    } else {
      touchFeedback.tap();
    }

    onClick?.(event);
  }, [pressed, onToggle, onClick]);

  return (
    <TouchFriendlyButton
      variant={pressed ? 'primary' : variant}
      hapticFeedback="none" // We handle haptics manually
      className={cn(
        'transition-all duration-200',
        pressed && 'scale-95',
        className
      )}
      onClick={handleClick}
      aria-pressed={pressed}
      {...props}
    >
      {children}
    </TouchFriendlyButton>
  );
}

// Button group with touch-optimized spacing
interface TouchButtonGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TouchButtonGroup({
  children,
  orientation = 'horizontal',
  spacing = 'md',
  className,
}: TouchButtonGroupProps) {
  const spacingValues = {
    sm: '8px',
    md: '12px',
    lg: '16px',
  };

  return (
    <div
      className={cn(
        'flex',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        className
      )}
      style={{
        gap: spacingValues[spacing],
      }}
      role="group"
    >
      {children}
    </div>
  );
}