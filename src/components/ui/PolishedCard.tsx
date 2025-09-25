'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { designTokens } from '@/lib/design/tokens';
import { animations } from '@/lib/design/animations';

interface PolishedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  hover?: 'none' | 'lift' | 'scale' | 'glow' | 'border';
  loading?: boolean;
  children: React.ReactNode;
}

const cardVariants = {
  default: {
    background: designTokens.colors.gray[50],
    border: `1px solid ${designTokens.colors.gray[200]}`,
    shadow: designTokens.boxShadow.sm,
  },
  elevated: {
    background: designTokens.colors.gray[50],
    border: 'none',
    shadow: designTokens.boxShadow.lg,
  },
  outlined: {
    background: 'transparent',
    border: `2px solid ${designTokens.colors.gray[200]}`,
    shadow: 'none',
  },
  ghost: {
    background: 'transparent',
    border: 'none',
    shadow: 'none',
  },
  gradient: {
    background: `linear-gradient(135deg, ${designTokens.colors.gray[50]}, ${designTokens.colors.gray[100]})`,
    border: `1px solid ${designTokens.colors.gray[200]}`,
    shadow: designTokens.boxShadow.md,
  },
};

const cardPadding = {
  none: '0',
  sm: designTokens.spacing[3],
  md: designTokens.spacing[4],
  lg: designTokens.spacing[6],
  xl: designTokens.spacing[8],
};

const cardRadius = {
  none: '0',
  sm: designTokens.borderRadius.sm,
  md: designTokens.borderRadius.md,
  lg: designTokens.borderRadius.lg,
  xl: designTokens.borderRadius.xl,
  '2xl': designTokens.borderRadius['2xl'],
};

const hoverEffects = {
  none: {},
  lift: {
    transform: 'translateY(-2px)',
    shadow: designTokens.boxShadow.xl,
  },
  scale: {
    transform: 'scale(1.02)',
    shadow: designTokens.boxShadow.lg,
  },
  glow: {
    shadow: `0 0 20px ${designTokens.colors.primary[500]}20`,
  },
  border: {
    borderColor: designTokens.colors.primary[300],
  },
};

export function PolishedCard({
  variant = 'default',
  padding = 'md',
  radius = 'lg',
  hover = 'none',
  loading = false,
  className,
  children,
  ...props
}: PolishedCardProps) {
  const variantStyles = cardVariants[variant];
  const hoverStyles = hoverEffects[hover];

  const cardClasses = cn(
    'relative overflow-hidden transition-all duration-200 ease-out',
    loading && 'animate-pulse',
    className
  );

  const cardStyle = {
    background: variantStyles.background,
    border: variantStyles.border,
    boxShadow: variantStyles.shadow,
    padding: cardPadding[padding],
    borderRadius: cardRadius[radius],
  };

  const hoverStyle = hover !== 'none' ? {
    '&:hover': {
      transform: hoverStyles.transform,
      boxShadow: hoverStyles.shadow,
      borderColor: hoverStyles.borderColor,
    },
  } : {};

  return (
    <div
      className={cardClasses}
      style={{
        ...cardStyle,
        ...hoverStyle,
      }}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      )}
      {children}
    </div>
  );
}

// Card header component
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  divided?: boolean;
}

export function CardHeader({
  title,
  subtitle,
  action,
  divided = false,
  className,
  children,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between',
        divided && `border-b border-gray-200 pb-4 mb-4`,
        className
      )}
      {...props}
    >
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="mt-1 text-sm text-gray-500 truncate">
            {subtitle}
          </p>
        )}
        {children}
      </div>
      {action && (
        <div className="flex-shrink-0 ml-4">
          {action}
        </div>
      )}
    </div>
  );
}

// Card content component
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: 'none' | 'sm' | 'md' | 'lg';
}

export function CardContent({
  spacing = 'md',
  className,
  children,
  ...props
}: CardContentProps) {
  const spacingClasses = {
    none: '',
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
  };

  return (
    <div
      className={cn(spacingClasses[spacing], className)}
      {...props}
    >
      {children}
    </div>
  );
}

// Card footer component
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  divided?: boolean;
  justify?: 'start' | 'end' | 'center' | 'between' | 'around';
}

export function CardFooter({
  divided = false,
  justify = 'end',
  className,
  children,
  ...props
}: CardFooterProps) {
  const justifyClasses = {
    start: 'justify-start',
    end: 'justify-end',
    center: 'justify-center',
    between: 'justify-between',
    around: 'justify-around',
  };

  return (
    <div
      className={cn(
        'flex items-center',
        justifyClasses[justify],
        divided && `border-t border-gray-200 pt-4 mt-4`,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Financial card variants
interface FinancialCardProps extends PolishedCardProps {
  type?: 'balance' | 'income' | 'expense' | 'investment' | 'goal';
  status?: 'positive' | 'negative' | 'neutral';
}

export function FinancialCard({
  type = 'balance',
  status = 'neutral',
  className,
  children,
  ...props
}: FinancialCardProps) {
  const typeStyles = {
    balance: {
      background: `linear-gradient(135deg, ${designTokens.colors.primary[500]}, ${designTokens.colors.primary[600]})`,
      color: designTokens.colors.gray[50],
    },
    income: {
      background: `linear-gradient(135deg, ${designTokens.colors.success[500]}, ${designTokens.colors.success[600]})`,
      color: designTokens.colors.gray[50],
    },
    expense: {
      background: `linear-gradient(135deg, ${designTokens.colors.error[500]}, ${designTokens.colors.error[600]})`,
      color: designTokens.colors.gray[50],
    },
    investment: {
      background: `linear-gradient(135deg, #8b5cf6, #7c3aed)`,
      color: designTokens.colors.gray[50],
    },
    goal: {
      background: `linear-gradient(135deg, ${designTokens.colors.warning[500]}, ${designTokens.colors.warning[600]})`,
      color: designTokens.colors.gray[50],
    },
  };

  const statusStyles = {
    positive: {
      borderLeft: `4px solid ${designTokens.colors.success[500]}`,
    },
    negative: {
      borderLeft: `4px solid ${designTokens.colors.error[500]}`,
    },
    neutral: {},
  };

  return (
    <PolishedCard
      variant="gradient"
      hover="lift"
      className={cn('text-white', className)}
      style={{
        ...typeStyles[type],
        ...statusStyles[status],
      }}
      {...props}
    >
      {children}
    </PolishedCard>
  );
}

// Metric card component
interface MetricCardProps extends PolishedCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    percentage: boolean;
    period: string;
  };
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
}

export function MetricCard({
  title,
  value,
  change,
  icon,
  color = 'primary',
  className,
  ...props
}: MetricCardProps) {
  const colorStyles = {
    primary: designTokens.colors.primary[500],
    success: designTokens.colors.success[500],
    warning: designTokens.colors.warning[500],
    error: designTokens.colors.error[500],
    info: designTokens.colors.info[500],
  };

  const isPositiveChange = change && change.value > 0;
  const isNegativeChange = change && change.value < 0;

  return (
    <PolishedCard
      variant="elevated"
      hover="lift"
      className={cn('p-6', className)}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 truncate">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change && (
            <div className="mt-2 flex items-center">
              <span
                className={cn(
                  'text-sm font-medium',
                  isPositiveChange && 'text-green-600',
                  isNegativeChange && 'text-red-600',
                  !isPositiveChange && !isNegativeChange && 'text-gray-500'
                )}
              >
                {isPositiveChange && '+'}
                {change.value}
                {change.percentage && '%'}
              </span>
              <span className="ml-2 text-xs text-gray-500">
                {change.period}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className="flex-shrink-0 p-3 rounded-lg"
            style={{
              backgroundColor: `${colorStyles[color]}15`,
              color: colorStyles[color],
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </PolishedCard>
  );
}

// Chart card component
interface ChartCardProps extends PolishedCardProps {
  title: string;
  subtitle?: string;
  chart: React.ReactNode;
  actions?: React.ReactNode;
  loading?: boolean;
}

export function ChartCard({
  title,
  subtitle,
  chart,
  actions,
  loading = false,
  className,
  ...props
}: ChartCardProps) {
  return (
    <PolishedCard
      variant="elevated"
      hover="lift"
      loading={loading}
      className={className}
      {...props}
    >
      <CardHeader
        title={title}
        subtitle={subtitle}
        action={actions}
        divided
      />
      <CardContent>
        <div className="h-64 flex items-center justify-center">
          {loading ? (
            <div className="animate-pulse bg-gray-200 rounded w-full h-full" />
          ) : (
            chart
          )}
        </div>
      </CardContent>
    </PolishedCard>
  );
}

// Summary card component for dashboard
interface SummaryCardProps extends PolishedCardProps {
  title: string;
  items: Array<{
    label: string;
    value: string | number;
    color?: string;
  }>;
}

export function SummaryCard({
  title,
  items,
  className,
  ...props
}: SummaryCardProps) {
  return (
    <PolishedCard
      variant="outlined"
      hover="border"
      className={className}
      {...props}
    >
      <CardHeader title={title} divided />
      <CardContent spacing="sm">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">{item.label}</span>
            <span
              className="text-sm font-semibold"
              style={{ color: item.color || designTokens.colors.gray[900] }}
            >
              {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
            </span>
          </div>
        ))}
      </CardContent>
    </PolishedCard>
  );
}