// Design tokens for consistent styling across the application

export const designTokens = {
  // Color palette
  colors: {
    // Primary brand colors
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },

    // Secondary/accent colors
    secondary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },

    // Semantic colors
    success: {
      50: '#f0fdf4',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
    },

    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
    },

    error: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
    },

    info: {
      50: '#eff6ff',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
    },

    // Neutral colors
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712',
    },

    // Financial context colors
    finance: {
      income: '#22c55e',
      expense: '#ef4444',
      investment: '#8b5cf6',
      savings: '#06b6d4',
      debt: '#f97316',
    },
  },

  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'monospace'],
    },

    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
    },

    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },

    letterSpacing: {
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
    },
  },

  // Spacing scale
  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    11: '2.75rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem',
  },

  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    DEFAULT: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },

  // Shadows
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none',
  },

  // Animation durations
  duration: {
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms',
  },

  // Animation curves
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },

  // Z-index scale
  zIndex: {
    0: '0',
    10: '10',
    20: '20',
    30: '30',
    40: '40',
    50: '50',
    auto: 'auto',
    dropdown: '1000',
    sticky: '1020',
    fixed: '1030',
    modal: '1040',
    popover: '1050',
    tooltip: '1060',
    toast: '1070',
  },

  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Component-specific tokens
  components: {
    // Button variants
    button: {
      padding: {
        sm: '0.5rem 0.75rem',
        md: '0.625rem 1rem',
        lg: '0.75rem 1.5rem',
        xl: '1rem 2rem',
      },
      minHeight: {
        sm: '2rem',
        md: '2.5rem',
        lg: '3rem',
        xl: '3.5rem',
      },
      borderRadius: '0.5rem',
      fontWeight: '500',
    },

    // Input variants
    input: {
      padding: '0.75rem',
      borderRadius: '0.5rem',
      borderWidth: '1px',
      minHeight: '2.75rem',
      fontSize: '1rem',
      lineHeight: '1.5',
    },

    // Card variants
    card: {
      padding: '1.5rem',
      borderRadius: '0.75rem',
      borderWidth: '1px',
      shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    },

    // Modal variants
    modal: {
      borderRadius: '1rem',
      padding: '2rem',
      maxWidth: '32rem',
      backdropBlur: '8px',
    },
  },

  // Financial-specific design patterns
  financial: {
    // Currency display
    currency: {
      fontSize: {
        small: '0.875rem',
        medium: '1.25rem',
        large: '2rem',
        xl: '2.5rem',
      },
      fontWeight: '600',
      letterSpacing: '-0.025em',
    },

    // Status indicators
    status: {
      positive: {
        color: '#22c55e',
        backgroundColor: '#f0fdf4',
        borderColor: '#bbf7d0',
      },
      negative: {
        color: '#ef4444',
        backgroundColor: '#fef2f2',
        borderColor: '#fecaca',
      },
      neutral: {
        color: '#6b7280',
        backgroundColor: '#f9fafb',
        borderColor: '#e5e7eb',
      },
    },

    // Chart colors
    charts: {
      primary: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'],
      categorical: [
        '#3b82f6', '#22c55e', '#f59e0b', '#ef4444',
        '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'
      ],
      sequential: [
        '#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd',
        '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8'
      ],
    },
  },

  // Accessibility
  accessibility: {
    // Minimum touch target sizes
    touchTarget: {
      min: '44px',
      recommended: '48px',
    },

    // Focus indicators
    focus: {
      outline: '2px solid #3b82f6',
      outlineOffset: '2px',
      borderRadius: '0.25rem',
    },

    // Color contrast ratios
    contrast: {
      normal: '4.5:1',
      large: '3:1',
      enhanced: '7:1',
    },

    // Animation preferences
    reducedMotion: {
      duration: '0.01ms',
      easing: 'linear',
    },
  },
};

// CSS custom properties for runtime theming
export const cssVariables = {
  ':root': {
    // Color variables
    '--color-primary-50': designTokens.colors.primary[50],
    '--color-primary-500': designTokens.colors.primary[500],
    '--color-primary-600': designTokens.colors.primary[600],
    '--color-primary-700': designTokens.colors.primary[700],

    '--color-success': designTokens.colors.success[500],
    '--color-warning': designTokens.colors.warning[500],
    '--color-error': designTokens.colors.error[500],
    '--color-info': designTokens.colors.info[500],

    '--color-gray-50': designTokens.colors.gray[50],
    '--color-gray-100': designTokens.colors.gray[100],
    '--color-gray-500': designTokens.colors.gray[500],
    '--color-gray-700': designTokens.colors.gray[700],
    '--color-gray-900': designTokens.colors.gray[900],

    // Typography variables
    '--font-family-sans': designTokens.typography.fontFamily.sans.join(', '),
    '--font-size-base': designTokens.typography.fontSize.base[0],
    '--line-height-base': designTokens.typography.fontSize.base[1].lineHeight,

    // Spacing variables
    '--spacing-2': designTokens.spacing[2],
    '--spacing-4': designTokens.spacing[4],
    '--spacing-6': designTokens.spacing[6],
    '--spacing-8': designTokens.spacing[8],

    // Border radius variables
    '--border-radius-md': designTokens.borderRadius.md,
    '--border-radius-lg': designTokens.borderRadius.lg,
    '--border-radius-xl': designTokens.borderRadius.xl,

    // Shadow variables
    '--shadow-sm': designTokens.boxShadow.sm,
    '--shadow-md': designTokens.boxShadow.md,
    '--shadow-lg': designTokens.boxShadow.lg,

    // Animation variables
    '--duration-150': designTokens.duration[150],
    '--duration-200': designTokens.duration[200],
    '--duration-300': designTokens.duration[300],
    '--easing-out': designTokens.easing.out,
    '--easing-in-out': designTokens.easing.inOut,
  },

  // Dark theme variables
  '[data-theme="dark"]': {
    '--color-gray-50': designTokens.colors.gray[900],
    '--color-gray-100': designTokens.colors.gray[800],
    '--color-gray-500': designTokens.colors.gray[400],
    '--color-gray-700': designTokens.colors.gray[300],
    '--color-gray-900': designTokens.colors.gray[50],
  },

  // Reduced motion preferences
  '@media (prefers-reduced-motion: reduce)': {
    '--duration-150': designTokens.accessibility.reducedMotion.duration,
    '--duration-200': designTokens.accessibility.reducedMotion.duration,
    '--duration-300': designTokens.accessibility.reducedMotion.duration,
    '--easing-out': designTokens.accessibility.reducedMotion.easing,
    '--easing-in-out': designTokens.accessibility.reducedMotion.easing,
  },
};

// Type definitions for design tokens
export type ColorScale = typeof designTokens.colors.primary;
export type FontSize = keyof typeof designTokens.typography.fontSize;
export type Spacing = keyof typeof designTokens.spacing;
export type BorderRadius = keyof typeof designTokens.borderRadius;
export type Duration = keyof typeof designTokens.duration;
export type Easing = keyof typeof designTokens.easing;