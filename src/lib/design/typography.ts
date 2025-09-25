// Typography system with consistent hierarchy and spacing

import { designTokens } from './tokens';

// Typography hierarchy presets
export const typography = {
  // Display text (hero sections, landing pages)
  display: {
    '2xl': {
      fontSize: designTokens.typography.fontSize['6xl'][0],
      lineHeight: designTokens.typography.fontSize['6xl'][1].lineHeight,
      fontWeight: designTokens.typography.fontWeight.extrabold,
      letterSpacing: designTokens.typography.letterSpacing.tight,
      marginBottom: designTokens.spacing[6],
    },
    xl: {
      fontSize: designTokens.typography.fontSize['5xl'][0],
      lineHeight: designTokens.typography.fontSize['5xl'][1].lineHeight,
      fontWeight: designTokens.typography.fontWeight.bold,
      letterSpacing: designTokens.typography.letterSpacing.tight,
      marginBottom: designTokens.spacing[5],
    },
    lg: {
      fontSize: designTokens.typography.fontSize['4xl'][0],
      lineHeight: designTokens.typography.fontSize['4xl'][1].lineHeight,
      fontWeight: designTokens.typography.fontWeight.bold,
      letterSpacing: designTokens.typography.letterSpacing.tight,
      marginBottom: designTokens.spacing[4],
    },
  },

  // Headings (page titles, section headers)
  heading: {
    h1: {
      fontSize: designTokens.typography.fontSize['3xl'][0],
      lineHeight: designTokens.typography.fontSize['3xl'][1].lineHeight,
      fontWeight: designTokens.typography.fontWeight.bold,
      letterSpacing: designTokens.typography.letterSpacing.tight,
      marginBottom: designTokens.spacing[4],
      color: designTokens.colors.gray[900],
    },
    h2: {
      fontSize: designTokens.typography.fontSize['2xl'][0],
      lineHeight: designTokens.typography.fontSize['2xl'][1].lineHeight,
      fontWeight: designTokens.typography.fontWeight.semibold,
      letterSpacing: designTokens.typography.letterSpacing.tight,
      marginBottom: designTokens.spacing[3],
      color: designTokens.colors.gray[900],
    },
    h3: {
      fontSize: designTokens.typography.fontSize.xl[0],
      lineHeight: designTokens.typography.fontSize.xl[1].lineHeight,
      fontWeight: designTokens.typography.fontWeight.semibold,
      letterSpacing: designTokens.typography.letterSpacing.normal,
      marginBottom: designTokens.spacing[3],
      color: designTokens.colors.gray[800],
    },
    h4: {
      fontSize: designTokens.typography.fontSize.lg[0],
      lineHeight: designTokens.typography.fontSize.lg[1].lineHeight,
      fontWeight: designTokens.typography.fontWeight.semibold,
      letterSpacing: designTokens.typography.letterSpacing.normal,
      marginBottom: designTokens.spacing[2],
      color: designTokens.colors.gray[800],
    },
    h5: {
      fontSize: designTokens.typography.fontSize.base[0],
      lineHeight: designTokens.typography.fontSize.base[1].lineHeight,
      fontWeight: designTokens.typography.fontWeight.semibold,
      letterSpacing: designTokens.typography.letterSpacing.normal,
      marginBottom: designTokens.spacing[2],
      color: designTokens.colors.gray[700],
    },
    h6: {
      fontSize: designTokens.typography.fontSize.sm[0],
      lineHeight: designTokens.typography.fontSize.sm[1].lineHeight,
      fontWeight: designTokens.typography.fontWeight.semibold,
      letterSpacing: designTokens.typography.letterSpacing.wide,
      marginBottom: designTokens.spacing[2],
      color: designTokens.colors.gray[700],
      textTransform: 'uppercase' as const,
    },
  },

  // Body text (paragraphs, content)
  body: {
    xl: {
      fontSize: designTokens.typography.fontSize.xl[0],
      lineHeight: designTokens.typography.fontSize.xl[1].lineHeight,
      fontWeight: designTokens.typography.fontWeight.normal,
      letterSpacing: designTokens.typography.letterSpacing.normal,
      marginBottom: designTokens.spacing[4],
      color: designTokens.colors.gray[700],
    },
    lg: {
      fontSize: designTokens.typography.fontSize.lg[0],
      lineHeight: designTokens.typography.fontSize.lg[1].lineHeight,
      fontWeight: designTokens.typography.fontWeight.normal,
      letterSpacing: designTokens.typography.letterSpacing.normal,
      marginBottom: designTokens.spacing[4],
      color: designTokens.colors.gray[700],
    },
    base: {
      fontSize: designTokens.typography.fontSize.base[0],
      lineHeight: designTokens.typography.fontSize.base[1].lineHeight,
      fontWeight: designTokens.typography.fontWeight.normal,
      letterSpacing: designTokens.typography.letterSpacing.normal,
      marginBottom: designTokens.spacing[4],
      color: designTokens.colors.gray[600],
    },
    sm: {
      fontSize: designTokens.typography.fontSize.sm[0],
      lineHeight: designTokens.typography.fontSize.sm[1].lineHeight,
      fontWeight: designTokens.typography.fontWeight.normal,
      letterSpacing: designTokens.typography.letterSpacing.normal,
      marginBottom: designTokens.spacing[3],
      color: designTokens.colors.gray[600],
    },
  },

  // Labels and captions
  label: {
    lg: {
      fontSize: designTokens.typography.fontSize.base[0],
      lineHeight: designTokens.typography.fontSize.base[1].lineHeight,
      fontWeight: designTokens.typography.fontWeight.medium,
      letterSpacing: designTokens.typography.letterSpacing.normal,
      marginBottom: designTokens.spacing[2],
      color: designTokens.colors.gray[700],
    },
    base: {
      fontSize: designTokens.typography.fontSize.sm[0],
      lineHeight: designTokens.typography.fontSize.sm[1].lineHeight,
      fontWeight: designTokens.typography.fontWeight.medium,
      letterSpacing: designTokens.typography.letterSpacing.normal,
      marginBottom: designTokens.spacing[1],
      color: designTokens.colors.gray[700],
    },
    sm: {
      fontSize: designTokens.typography.fontSize.xs[0],
      lineHeight: designTokens.typography.fontSize.xs[1].lineHeight,
      fontWeight: designTokens.typography.fontWeight.medium,
      letterSpacing: designTokens.typography.letterSpacing.wide,
      marginBottom: designTokens.spacing[1],
      color: designTokens.colors.gray[600],
      textTransform: 'uppercase' as const,
    },
  },

  // Caption and helper text
  caption: {
    lg: {
      fontSize: designTokens.typography.fontSize.sm[0],
      lineHeight: designTokens.typography.fontSize.sm[1].lineHeight,
      fontWeight: designTokens.typography.fontWeight.normal,
      letterSpacing: designTokens.typography.letterSpacing.normal,
      color: designTokens.colors.gray[500],
    },
    base: {
      fontSize: designTokens.typography.fontSize.xs[0],
      lineHeight: designTokens.typography.fontSize.xs[1].lineHeight,
      fontWeight: designTokens.typography.fontWeight.normal,
      letterSpacing: designTokens.typography.letterSpacing.normal,
      color: designTokens.colors.gray[500],
    },
  },

  // Financial-specific typography
  financial: {
    // Currency display
    currency: {
      xl: {
        fontSize: designTokens.financial.currency.fontSize.xl,
        fontWeight: designTokens.financial.currency.fontWeight,
        letterSpacing: designTokens.financial.currency.letterSpacing,
        lineHeight: '1.1',
        fontFamily: designTokens.typography.fontFamily.mono.join(', '),
      },
      lg: {
        fontSize: designTokens.financial.currency.fontSize.large,
        fontWeight: designTokens.financial.currency.fontWeight,
        letterSpacing: designTokens.financial.currency.letterSpacing,
        lineHeight: '1.2',
        fontFamily: designTokens.typography.fontFamily.mono.join(', '),
      },
      base: {
        fontSize: designTokens.financial.currency.fontSize.medium,
        fontWeight: designTokens.financial.currency.fontWeight,
        letterSpacing: designTokens.financial.currency.letterSpacing,
        lineHeight: '1.3',
        fontFamily: designTokens.typography.fontFamily.mono.join(', '),
      },
      sm: {
        fontSize: designTokens.financial.currency.fontSize.small,
        fontWeight: designTokens.financial.currency.fontWeight,
        letterSpacing: designTokens.financial.currency.letterSpacing,
        lineHeight: '1.4',
        fontFamily: designTokens.typography.fontFamily.mono.join(', '),
      },
    },

    // Number display (percentages, ratios)
    number: {
      fontSize: designTokens.typography.fontSize.lg[0],
      fontWeight: designTokens.typography.fontWeight.semibold,
      letterSpacing: designTokens.typography.letterSpacing.tight,
      lineHeight: '1.2',
      fontFamily: designTokens.typography.fontFamily.mono.join(', '),
    },

    // Status text (positive/negative indicators)
    status: {
      fontSize: designTokens.typography.fontSize.sm[0],
      fontWeight: designTokens.typography.fontWeight.medium,
      letterSpacing: designTokens.typography.letterSpacing.normal,
      lineHeight: designTokens.typography.fontSize.sm[1].lineHeight,
    },
  },

  // Interactive elements
  interactive: {
    // Button text
    button: {
      lg: {
        fontSize: designTokens.typography.fontSize.base[0],
        fontWeight: designTokens.typography.fontWeight.medium,
        letterSpacing: designTokens.typography.letterSpacing.normal,
        lineHeight: '1.2',
      },
      base: {
        fontSize: designTokens.typography.fontSize.sm[0],
        fontWeight: designTokens.typography.fontWeight.medium,
        letterSpacing: designTokens.typography.letterSpacing.normal,
        lineHeight: '1.2',
      },
      sm: {
        fontSize: designTokens.typography.fontSize.xs[0],
        fontWeight: designTokens.typography.fontWeight.medium,
        letterSpacing: designTokens.typography.letterSpacing.wide,
        lineHeight: '1.2',
      },
    },

    // Link text
    link: {
      fontSize: 'inherit',
      fontWeight: designTokens.typography.fontWeight.medium,
      letterSpacing: 'inherit',
      lineHeight: 'inherit',
      color: designTokens.colors.primary[600],
      textDecoration: 'none',
      transition: 'color 0.2s ease-out',
      '&:hover': {
        color: designTokens.colors.primary[700],
        textDecoration: 'underline',
      },
      '&:focus': {
        outline: 'none',
        textDecoration: 'underline',
        textDecorationColor: designTokens.colors.primary[600],
      },
    },

    // Input text
    input: {
      fontSize: designTokens.typography.fontSize.base[0],
      fontWeight: designTokens.typography.fontWeight.normal,
      letterSpacing: designTokens.typography.letterSpacing.normal,
      lineHeight: designTokens.typography.fontSize.base[1].lineHeight,
      color: designTokens.colors.gray[900],
      '&::placeholder': {
        color: designTokens.colors.gray[400],
      },
    },
  },

  // Code and monospace
  code: {
    inline: {
      fontSize: '0.875em',
      fontFamily: designTokens.typography.fontFamily.mono.join(', '),
      fontWeight: designTokens.typography.fontWeight.medium,
      backgroundColor: designTokens.colors.gray[100],
      color: designTokens.colors.gray[800],
      padding: '0.125rem 0.25rem',
      borderRadius: designTokens.borderRadius.sm,
    },
    block: {
      fontSize: designTokens.typography.fontSize.sm[0],
      fontFamily: designTokens.typography.fontFamily.mono.join(', '),
      fontWeight: designTokens.typography.fontWeight.normal,
      lineHeight: '1.6',
      backgroundColor: designTokens.colors.gray[900],
      color: designTokens.colors.gray[100],
      padding: designTokens.spacing[4],
      borderRadius: designTokens.borderRadius.lg,
      overflow: 'auto',
    },
  },
};

// Typography utility classes for CSS
export const typographyClasses = {
  // Display classes
  'text-display-2xl': typography.display['2xl'],
  'text-display-xl': typography.display.xl,
  'text-display-lg': typography.display.lg,

  // Heading classes
  'text-h1': typography.heading.h1,
  'text-h2': typography.heading.h2,
  'text-h3': typography.heading.h3,
  'text-h4': typography.heading.h4,
  'text-h5': typography.heading.h5,
  'text-h6': typography.heading.h6,

  // Body classes
  'text-body-xl': typography.body.xl,
  'text-body-lg': typography.body.lg,
  'text-body-base': typography.body.base,
  'text-body-sm': typography.body.sm,

  // Label classes
  'text-label-lg': typography.label.lg,
  'text-label-base': typography.label.base,
  'text-label-sm': typography.label.sm,

  // Caption classes
  'text-caption-lg': typography.caption.lg,
  'text-caption-base': typography.caption.base,

  // Financial classes
  'text-currency-xl': typography.financial.currency.xl,
  'text-currency-lg': typography.financial.currency.lg,
  'text-currency-base': typography.financial.currency.base,
  'text-currency-sm': typography.financial.currency.sm,
  'text-number': typography.financial.number,
  'text-status': typography.financial.status,

  // Interactive classes
  'text-button-lg': typography.interactive.button.lg,
  'text-button-base': typography.interactive.button.base,
  'text-button-sm': typography.interactive.button.sm,
  'text-link': typography.interactive.link,
  'text-input': typography.interactive.input,

  // Code classes
  'text-code-inline': typography.code.inline,
  'text-code-block': typography.code.block,
};

// Responsive typography utilities
export const responsiveTypography = {
  // Responsive heading scales
  'responsive-h1': {
    fontSize: designTokens.typography.fontSize.xl[0],
    lineHeight: designTokens.typography.fontSize.xl[1].lineHeight,
    [`@media (min-width: ${designTokens.breakpoints.sm})`]: {
      fontSize: designTokens.typography.fontSize['2xl'][0],
      lineHeight: designTokens.typography.fontSize['2xl'][1].lineHeight,
    },
    [`@media (min-width: ${designTokens.breakpoints.lg})`]: {
      fontSize: designTokens.typography.fontSize['3xl'][0],
      lineHeight: designTokens.typography.fontSize['3xl'][1].lineHeight,
    },
  },

  'responsive-h2': {
    fontSize: designTokens.typography.fontSize.lg[0],
    lineHeight: designTokens.typography.fontSize.lg[1].lineHeight,
    [`@media (min-width: ${designTokens.breakpoints.sm})`]: {
      fontSize: designTokens.typography.fontSize.xl[0],
      lineHeight: designTokens.typography.fontSize.xl[1].lineHeight,
    },
    [`@media (min-width: ${designTokens.breakpoints.lg})`]: {
      fontSize: designTokens.typography.fontSize['2xl'][0],
      lineHeight: designTokens.typography.fontSize['2xl'][1].lineHeight,
    },
  },

  // Responsive display text
  'responsive-display': {
    fontSize: designTokens.typography.fontSize['2xl'][0],
    lineHeight: designTokens.typography.fontSize['2xl'][1].lineHeight,
    [`@media (min-width: ${designTokens.breakpoints.sm})`]: {
      fontSize: designTokens.typography.fontSize['4xl'][0],
      lineHeight: designTokens.typography.fontSize['4xl'][1].lineHeight,
    },
    [`@media (min-width: ${designTokens.breakpoints.lg})`]: {
      fontSize: designTokens.typography.fontSize['6xl'][0],
      lineHeight: designTokens.typography.fontSize['6xl'][1].lineHeight,
    },
  },
};

// Typography React components props interface
export interface TypographyProps {
  variant?: keyof typeof typography.heading | keyof typeof typography.body | keyof typeof typography.label;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  weight?: keyof typeof designTokens.typography.fontWeight;
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  spacing?: keyof typeof designTokens.spacing;
  responsive?: boolean;
  className?: string;
  children: React.ReactNode;
}

// Accessibility helpers for typography
export const typographyA11y = {
  // Screen reader only text
  srOnly: {
    position: 'absolute' as const,
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden' as const,
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap' as const,
    border: '0',
  },

  // Skip link styles
  skipLink: {
    position: 'absolute' as const,
    top: '-40px',
    left: '6px',
    zIndex: designTokens.zIndex.modal,
    padding: '8px',
    backgroundColor: designTokens.colors.gray[900],
    color: designTokens.colors.gray[50],
    textDecoration: 'none',
    borderRadius: designTokens.borderRadius.md,
    transition: 'top 0.3s',
    '&:focus': {
      top: '6px',
    },
  },

  // High contrast mode support
  highContrast: {
    '@media (prefers-contrast: high)': {
      color: 'CanvasText',
      backgroundColor: 'Canvas',
      borderColor: 'CanvasText',
    },
  },

  // Reading preferences
  readingPreferences: {
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
      animation: 'none',
    },
  },
};