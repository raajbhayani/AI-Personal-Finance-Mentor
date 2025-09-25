// Animation utilities and presets for smooth micro-interactions

import { designTokens } from './tokens';

// Animation presets
export const animations = {
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: {
      duration: 0.2,
      ease: designTokens.easing.out,
    },
  },

  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: {
      duration: 0.3,
      ease: designTokens.easing.out,
    },
  },

  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: {
      duration: 0.3,
      ease: designTokens.easing.out,
    },
  },

  // Scale animations
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: {
      duration: 0.2,
      ease: designTokens.easing.out,
    },
  },

  scaleInBounce: {
    initial: { opacity: 0, scale: 0.3 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.3 },
    transition: {
      duration: 0.4,
      ease: designTokens.easing.bounce,
    },
  },

  // Slide animations
  slideInLeft: {
    initial: { opacity: 0, x: -100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
    transition: {
      duration: 0.3,
      ease: designTokens.easing.out,
    },
  },

  slideInRight: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 100 },
    transition: {
      duration: 0.3,
      ease: designTokens.easing.out,
    },
  },

  // Modal/overlay animations
  modalBackdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: {
      duration: 0.2,
      ease: designTokens.easing.inOut,
    },
  },

  modalContent: {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 },
    transition: {
      duration: 0.3,
      ease: designTokens.easing.out,
    },
  },

  // Navigation animations
  mobileMenu: {
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: 'auto' },
    exit: { opacity: 0, height: 0 },
    transition: {
      duration: 0.3,
      ease: designTokens.easing.inOut,
    },
  },

  tabContent: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: {
      duration: 0.2,
      ease: designTokens.easing.out,
    },
  },

  // List animations
  listItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: {
      duration: 0.2,
      ease: designTokens.easing.out,
    },
  },

  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },

  // Loading animations
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      opacity: [0.7, 1, 0.7],
    },
    transition: {
      duration: 2,
      ease: designTokens.easing.inOut,
      repeat: Infinity,
    },
  },

  spin: {
    animate: {
      rotate: 360,
    },
    transition: {
      duration: 1,
      ease: designTokens.easing.linear,
      repeat: Infinity,
    },
  },

  bounce: {
    animate: {
      y: [0, -10, 0],
    },
    transition: {
      duration: 0.6,
      ease: designTokens.easing.out,
      repeat: Infinity,
    },
  },

  // Touch feedback animations
  tapScale: {
    whileTap: { scale: 0.95 },
    transition: {
      duration: 0.1,
      ease: designTokens.easing.inOut,
    },
  },

  pressDown: {
    whileTap: { scale: 0.98, y: 1 },
    transition: {
      duration: 0.1,
      ease: designTokens.easing.inOut,
    },
  },

  // Notification animations
  slideInFromTop: {
    initial: { opacity: 0, y: -100, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -100, scale: 0.95 },
    transition: {
      duration: 0.4,
      ease: designTokens.easing.bounce,
    },
  },

  slideInFromRight: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 100 },
    transition: {
      duration: 0.3,
      ease: designTokens.easing.out,
    },
  },

  // Financial-specific animations
  countUp: {
    initial: { scale: 0.8 },
    animate: { scale: 1 },
    transition: {
      duration: 0.5,
      ease: designTokens.easing.bounce,
    },
  },

  chartReveal: {
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: {
      duration: 1.5,
      ease: designTokens.easing.out,
    },
  },

  progressBar: {
    initial: { width: 0 },
    animate: { width: '100%' },
    transition: {
      duration: 1,
      ease: designTokens.easing.out,
    },
  },
};

// CSS animation classes for non-React usage
export const cssAnimations = {
  // Keyframes
  keyframes: {
    fadeIn: {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },

    slideInUp: {
      '0%': { opacity: '0', transform: 'translateY(20px)' },
      '100%': { opacity: '1', transform: 'translateY(0)' },
    },

    slideInDown: {
      '0%': { opacity: '0', transform: 'translateY(-20px)' },
      '100%': { opacity: '1', transform: 'translateY(0)' },
    },

    scaleIn: {
      '0%': { opacity: '0', transform: 'scale(0.9)' },
      '100%': { opacity: '1', transform: 'scale(1)' },
    },

    pulse: {
      '0%, 100%': { opacity: '0.7' },
      '50%': { opacity: '1' },
    },

    spin: {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },

    bounce: {
      '0%, 100%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-10px)' },
    },

    shake: {
      '0%, 100%': { transform: 'translateX(0)' },
      '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
      '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' },
    },

    shimmer: {
      '0%': { backgroundPosition: '-200% 0' },
      '100%': { backgroundPosition: '200% 0' },
    },
  },

  // Animation classes
  classes: {
    'animate-fade-in': {
      animation: 'fadeIn 0.2s ease-out',
    },

    'animate-slide-in-up': {
      animation: 'slideInUp 0.3s ease-out',
    },

    'animate-slide-in-down': {
      animation: 'slideInDown 0.3s ease-out',
    },

    'animate-scale-in': {
      animation: 'scaleIn 0.2s ease-out',
    },

    'animate-pulse': {
      animation: 'pulse 2s ease-in-out infinite',
    },

    'animate-spin': {
      animation: 'spin 1s linear infinite',
    },

    'animate-bounce': {
      animation: 'bounce 0.6s ease-out infinite',
    },

    'animate-shake': {
      animation: 'shake 0.5s ease-in-out',
    },

    'animate-shimmer': {
      animation: 'shimmer 2s linear infinite',
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
      backgroundSize: '200% 100%',
    },

    // Hover effects
    'hover-lift': {
      transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: designTokens.boxShadow.lg,
      },
    },

    'hover-scale': {
      transition: 'transform 0.2s ease-out',
      '&:hover': {
        transform: 'scale(1.02)',
      },
    },

    'hover-glow': {
      transition: 'box-shadow 0.2s ease-out',
      '&:hover': {
        boxShadow: `0 0 20px ${designTokens.colors.primary[500]}33`,
      },
    },

    // Focus effects
    'focus-ring': {
      '&:focus': {
        outline: 'none',
        boxShadow: `0 0 0 2px ${designTokens.colors.primary[500]}`,
      },
    },

    'focus-ring-inset': {
      '&:focus': {
        outline: 'none',
        boxShadow: `inset 0 0 0 2px ${designTokens.colors.primary[500]}`,
      },
    },

    // Loading states
    'loading-skeleton': {
      background: `linear-gradient(90deg, ${designTokens.colors.gray[200]}, ${designTokens.colors.gray[300]}, ${designTokens.colors.gray[200]})`,
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s linear infinite',
    },

    'loading-dots': {
      '&::after': {
        content: '""',
        animation: 'dots 1.5s linear infinite',
      },
    },
  },
};

// Animation utility functions
export const animationUtils = {
  // Create staggered animation delays
  getStaggerDelay: (index: number, baseDelay = 0.1): number => {
    return index * baseDelay;
  },

  // Get reduced motion animation
  getReducedMotionAnimation: (animation: any): any => {
    return {
      ...animation,
      transition: {
        ...animation.transition,
        duration: 0.01,
        ease: 'linear',
      },
    };
  },

  // Create entrance animation with delay
  createEntranceAnimation: (
    type: keyof typeof animations,
    delay = 0
  ): any => {
    const baseAnimation = animations[type];
    return {
      ...baseAnimation,
      transition: {
        ...baseAnimation.transition,
        delay,
      },
    };
  },

  // Create exit animation
  createExitAnimation: (
    type: keyof typeof animations,
    duration = 0.2
  ): any => {
    const baseAnimation = animations[type];
    return {
      ...baseAnimation.exit,
      transition: {
        ...baseAnimation.transition,
        duration,
      },
    };
  },
};

// React hook for animation preferences
export const useAnimationPreferences = () => {
  if (typeof window === 'undefined') {
    return { prefersReducedMotion: false };
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return {
    prefersReducedMotion,
    getAnimation: (animationKey: keyof typeof animations) => {
      const animation = animations[animationKey];
      return prefersReducedMotion
        ? animationUtils.getReducedMotionAnimation(animation)
        : animation;
    },
  };
};

// Animation component wrapper
export const AnimationConfig = {
  // Global animation settings
  global: {
    transition: {
      duration: 0.2,
      ease: designTokens.easing.out,
    },
  },

  // Animation variants for different components
  variants: {
    page: animations.fadeInUp,
    modal: animations.modalContent,
    dropdown: animations.scaleIn,
    toast: animations.slideInFromTop,
    sidebar: animations.slideInLeft,
    tab: animations.tabContent,
    card: animations.fadeIn,
    button: animations.tapScale,
  },
};