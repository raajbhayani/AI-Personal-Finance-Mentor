'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { designTokens } from '@/lib/design/tokens';
import { animations } from '@/lib/design/animations';
import { ariaPatterns } from '@/lib/accessibility/aria';
import { focusStyles } from '@/lib/accessibility/focus';

interface PolishedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success' | 'warning';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const buttonVariants = {
  primary: {
    background: `linear-gradient(135deg, ${designTokens.colors.primary[500]}, ${designTokens.colors.primary[600]})`,
    color: designTokens.colors.gray[50],
    border: `1px solid ${designTokens.colors.primary[600]}`,
    shadow: designTokens.boxShadow.sm,
    hover: {
      background: `linear-gradient(135deg, ${designTokens.colors.primary[600]}, ${designTokens.colors.primary[700]})`,
      shadow: designTokens.boxShadow.md,
      transform: 'translateY(-1px)',
    },
    active: {
      background: `linear-gradient(135deg, ${designTokens.colors.primary[700]}, ${designTokens.colors.primary[800]})`,
      transform: 'translateY(0)',
      shadow: designTokens.boxShadow.sm,
    },
    disabled: {
      background: designTokens.colors.gray[300],
      color: designTokens.colors.gray[500],
      border: `1px solid ${designTokens.colors.gray[300]}`,
      shadow: 'none',
    },
  },
  secondary: {
    background: `linear-gradient(135deg, ${designTokens.colors.secondary[500]}, ${designTokens.colors.secondary[600]})`,
    color: designTokens.colors.gray[50],
    border: `1px solid ${designTokens.colors.secondary[600]}`,
    shadow: designTokens.boxShadow.sm,
    hover: {
      background: `linear-gradient(135deg, ${designTokens.colors.secondary[600]}, ${designTokens.colors.secondary[700]})`,
      shadow: designTokens.boxShadow.md,
      transform: 'translateY(-1px)',
    },
    active: {
      background: `linear-gradient(135deg, ${designTokens.colors.secondary[700]}, ${designTokens.colors.secondary[800]})`,
      transform: 'translateY(0)',
      shadow: designTokens.boxShadow.sm,
    },
  },
  outline: {
    background: 'transparent',
    color: designTokens.colors.primary[600],
    border: `2px solid ${designTokens.colors.primary[300]}`,
    shadow: 'none',
    hover: {
      background: designTokens.colors.primary[50],
      borderColor: designTokens.colors.primary[400],
      shadow: designTokens.boxShadow.sm,
    },
    active: {
      background: designTokens.colors.primary[100],
      borderColor: designTokens.colors.primary[500],
    },
  },
  ghost: {
    background: 'transparent',
    color: designTokens.colors.gray[700],
    border: '2px solid transparent',
    shadow: 'none',
    hover: {
      background: designTokens.colors.gray[100],
      color: designTokens.colors.gray[900],
    },
    active: {
      background: designTokens.colors.gray[200],
    },
  },
  destructive: {
    background: `linear-gradient(135deg, ${designTokens.colors.error[500]}, ${designTokens.colors.error[600]})`,
    color: designTokens.colors.gray[50],
    border: `1px solid ${designTokens.colors.error[600]}`,
    shadow: designTokens.boxShadow.sm,
    hover: {
      background: `linear-gradient(135deg, ${designTokens.colors.error[600]}, ${designTokens.colors.error[700]})`,
      shadow: designTokens.boxShadow.md,
      transform: 'translateY(-1px)',
    },
    active: {
      background: `linear-gradient(135deg, ${designTokens.colors.error[700]}, ${designTokens.colors.error[800]})`,
      transform: 'translateY(0)',
      shadow: designTokens.boxShadow.sm,
    },
  },
  success: {
    background: `linear-gradient(135deg, ${designTokens.colors.success[500]}, ${designTokens.colors.success[600]})`,
    color: designTokens.colors.gray[50],
    border: `1px solid ${designTokens.colors.success[600]}`,
    shadow: designTokens.boxShadow.sm,
    hover: {
      background: `linear-gradient(135deg, ${designTokens.colors.success[600]}, ${designTokens.colors.success[700]})`,
      shadow: designTokens.boxShadow.md,
      transform: 'translateY(-1px)',
    },
  },
  warning: {
    background: `linear-gradient(135deg, ${designTokens.colors.warning[500]}, ${designTokens.colors.warning[600]})`,
    color: designTokens.colors.gray[50],
    border: `1px solid ${designTokens.colors.warning[600]}`,
    shadow: designTokens.boxShadow.sm,
    hover: {
      background: `linear-gradient(135deg, ${designTokens.colors.warning[600]}, ${designTokens.colors.warning[700]})`,
      shadow: designTokens.boxShadow.md,
      transform: 'translateY(-1px)',
    },
  },
};

const buttonSizes = {
  xs: {
    padding: '0.375rem 0.75rem',
    fontSize: designTokens.typography.fontSize.xs[0],
    lineHeight: designTokens.typography.fontSize.xs[1].lineHeight,
    minHeight: '1.75rem',
    gap: '0.25rem',
  },
  sm: {
    padding: '0.5rem 1rem',
    fontSize: designTokens.typography.fontSize.sm[0],
    lineHeight: designTokens.typography.fontSize.sm[1].lineHeight,
    minHeight: '2.25rem',
    gap: '0.375rem',
  },
  md: {
    padding: '0.625rem 1.25rem',
    fontSize: designTokens.typography.fontSize.base[0],
    lineHeight: designTokens.typography.fontSize.base[1].lineHeight,
    minHeight: '2.75rem',
    gap: '0.5rem',
  },
  lg: {
    padding: '0.75rem 1.5rem',
    fontSize: designTokens.typography.fontSize.lg[0],
    lineHeight: designTokens.typography.fontSize.lg[1].lineHeight,
    minHeight: '3.25rem',
    gap: '0.625rem',
  },
  xl: {
    padding: '1rem 2rem',
    fontSize: designTokens.typography.fontSize.xl[0],
    lineHeight: designTokens.typography.fontSize.xl[1].lineHeight,
    minHeight: '3.75rem',
    gap: '0.75rem',
  },
};

export function PolishedButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  children,
  className,
  'aria-label': ariaLabel,
  ...props
}: PolishedButtonProps) {
  const isDisabled = disabled || loading;
  const variantStyles = buttonVariants[variant];
  const sizeStyles = buttonSizes[size];

  const buttonClasses = cn(
    // Base styles
    'relative inline-flex items-center justify-center',
    'font-medium tracking-wide',
    'border transition-all duration-200 ease-out',
    'rounded-lg cursor-pointer select-none',
    'touch-manipulation',

    // Focus styles
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'focus-visible:ring-primary-500',

    // Disabled styles
    isDisabled && 'cursor-not-allowed opacity-60',

    // Full width
    fullWidth && 'w-full',

    // Custom className
    className
  );

  const buttonStyle = {
    // Size styles
    padding: sizeStyles.padding,
    fontSize: sizeStyles.fontSize,
    lineHeight: sizeStyles.lineHeight,
    minHeight: sizeStyles.minHeight,
    gap: sizeStyles.gap,

    // Variant styles
    background: isDisabled && variant !== 'outline' && variant !== 'ghost'
      ? variantStyles.disabled?.background || designTokens.colors.gray[300]
      : variantStyles.background,
    color: isDisabled
      ? variantStyles.disabled?.color || designTokens.colors.gray[500]
      : variantStyles.color,
    border: isDisabled
      ? variantStyles.disabled?.border || `1px solid ${designTokens.colors.gray[300]}`
      : variantStyles.border,
    boxShadow: isDisabled
      ? 'none'
      : variantStyles.shadow,
  };

  const hoverStyle = !isDisabled && variantStyles.hover ? {
    '&:hover': {
      background: variantStyles.hover.background,
      color: variantStyles.hover.color,
      borderColor: variantStyles.hover.borderColor,
      boxShadow: variantStyles.hover.shadow,
      transform: variantStyles.hover.transform,
    },
  } : {};

  const activeStyle = !isDisabled && variantStyles.active ? {
    '&:active': {
      background: variantStyles.active.background,
      color: variantStyles.active.color,
      borderColor: variantStyles.active.borderColor,
      boxShadow: variantStyles.active.shadow,
      transform: variantStyles.active.transform,
    },
  } : {};

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
      className={buttonClasses}
      style={{
        ...buttonStyle,
        ...hoverStyle,
        ...activeStyle,
      }}
      disabled={isDisabled}
      {...ariaAttributes}
      {...props}
    >
      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="animate-spin rounded-full border-2 border-current border-t-transparent"
            style={{
              width: size === 'xs' ? '12px' : size === 'sm' ? '14px' : '16px',
              height: size === 'xs' ? '12px' : size === 'sm' ? '14px' : '16px',
            }}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Content wrapper */}
      <div
        className={cn(
          'flex items-center justify-center',
          loading && 'opacity-0'
        )}
        style={{ gap: sizeStyles.gap }}
      >
        {leftIcon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}

        <span className="truncate">
          {children}
        </span>

        {rightIcon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </div>

      {/* Ripple effect on click */}
      <div className="absolute inset-0 rounded-lg overflow-hidden">
        <div className="absolute inset-0 bg-white opacity-0 transition-opacity duration-150 pointer-events-none" />
      </div>
    </button>
  );
}

// Button group component
interface ButtonGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  spacing?: keyof typeof designTokens.spacing;
  className?: string;
}

export function ButtonGroup({
  children,
  orientation = 'horizontal',
  spacing = '2',
  className,
}: ButtonGroupProps) {
  return (
    <div
      className={cn(
        'flex',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        className
      )}
      style={{
        gap: designTokens.spacing[spacing],
      }}
      role="group"
    >
      {children}
    </div>
  );
}

// Icon button variant
interface IconButtonProps extends Omit<PolishedButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export function IconButton({
  icon,
  size = 'md',
  variant = 'ghost',
  className,
  ...props
}: IconButtonProps) {
  const sizeMap = {
    xs: 'w-7 h-7',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14',
  };

  return (
    <PolishedButton
      variant={variant}
      size={size}
      className={cn(
        'p-0 aspect-square rounded-full',
        sizeMap[size],
        className
      )}
      {...props}
    >
      <span className="flex items-center justify-center" aria-hidden="true">
        {icon}
      </span>
    </PolishedButton>
  );
}

// Floating action button
interface FabProps extends Omit<PolishedButtonProps, 'size' | 'children'> {
  icon: React.ReactNode;
  size?: 'md' | 'lg';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  'aria-label': string;
}

export function FloatingActionButton({
  icon,
  size = 'lg',
  position = 'bottom-right',
  variant = 'primary',
  className,
  ...props
}: FabProps) {
  const sizeClasses = {
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6',
  };

  return (
    <PolishedButton
      variant={variant}
      className={cn(
        'rounded-full shadow-lg hover:shadow-xl',
        'z-50 transition-all duration-300',
        sizeClasses[size],
        positionClasses[position],
        className
      )}
      {...props}
    >
      <span className="flex items-center justify-center text-xl" aria-hidden="true">
        {icon}
      </span>
    </PolishedButton>
  );
}