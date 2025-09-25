// Touch feedback and haptic utilities for mobile experience
import React from 'react';

export interface TouchFeedbackOptions {
  type?: 'light' | 'medium' | 'heavy' | 'selection' | 'impact' | 'notification';
  duration?: number;
  intensity?: number;
  fallback?: boolean;
}

// Haptic feedback manager
export class HapticManager {
  private static instance: HapticManager;
  private isSupported: boolean = false;

  constructor() {
    this.checkSupport();
  }

  static getInstance(): HapticManager {
    if (!HapticManager.instance) {
      HapticManager.instance = new HapticManager();
    }
    return HapticManager.instance;
  }

  private checkSupport(): void {
    if (typeof window === 'undefined') {
      this.isSupported = false;
      return;
    }

    // Check for vibration API support
    this.isSupported = !!(
      navigator.vibrate ||
      (navigator as any).webkitVibrate ||
      (navigator as any).mozVibrate ||
      (navigator as any).msVibrate
    );
  }

  // Trigger haptic feedback
  trigger(options: TouchFeedbackOptions = {}): void {
    if (!this.isSupported) {
      if (options.fallback) {
        this.visualFeedback();
      }
      return;
    }

    const {
      type = 'light',
      duration,
      intensity = 1,
    } = options;

    // Vibration patterns for different feedback types
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [50],
      selection: [5],
      impact: [30, 10, 30],
      notification: [100, 50, 100],
    };

    const pattern = patterns[type].map(d => d * intensity);

    if (duration) {
      this.vibrate([duration]);
    } else {
      this.vibrate(pattern);
    }
  }

  // Cross-browser vibration
  private vibrate(pattern: number | number[]): void {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    } else if ((navigator as any).webkitVibrate) {
      (navigator as any).webkitVibrate(pattern);
    } else if ((navigator as any).mozVibrate) {
      (navigator as any).mozVibrate(pattern);
    } else if ((navigator as any).msVibrate) {
      (navigator as any).msVibrate(pattern);
    }
  }

  // Visual feedback as fallback
  private visualFeedback(): void {
    // Create a brief visual flash
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.1);
      pointer-events: none;
      z-index: 9999;
      animation: touchFlash 150ms ease-out;
    `;

    // Add flash animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes touchFlash {
        0% { opacity: 0; }
        50% { opacity: 1; }
        100% { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(flash);

    // Clean up
    setTimeout(() => {
      document.body.removeChild(flash);
      document.head.removeChild(style);
    }, 150);
  }

  // Check if haptics are supported
  isHapticsSupported(): boolean {
    return this.isSupported;
  }

  // Disable haptics (for user preference)
  disable(): void {
    this.isSupported = false;
  }

  // Enable haptics
  enable(): void {
    this.checkSupport();
  }
}

// Global haptic instance
export const haptics = HapticManager.getInstance();

// Touch feedback presets
export const touchFeedback = {
  // UI interactions
  tap: () => haptics.trigger({ type: 'light' }),
  press: () => haptics.trigger({ type: 'medium' }),
  longPress: () => haptics.trigger({ type: 'heavy' }),

  // Selection feedback
  select: () => haptics.trigger({ type: 'selection' }),
  toggle: () => haptics.trigger({ type: 'selection' }),

  // Success/error feedback
  success: () => haptics.trigger({ type: 'notification' }),
  error: () => haptics.trigger({ type: 'impact' }),
  warning: () => haptics.trigger({ type: 'medium' }),

  // Navigation feedback
  swipe: () => haptics.trigger({ type: 'light' }),
  scroll: () => haptics.trigger({ type: 'light', intensity: 0.5 }),

  // Custom feedback
  custom: (options: TouchFeedbackOptions) => haptics.trigger(options),
};

// Touch gesture detector
export class TouchGestureDetector {
  private element: HTMLElement;
  private startX = 0;
  private startY = 0;
  private startTime = 0;
  private isPressed = false;
  private pressTimer: NodeJS.Timeout | null = null;

  private callbacks = {
    tap: [] as Array<(event: TouchEvent) => void>,
    longPress: [] as Array<(event: TouchEvent) => void>,
    swipeLeft: [] as Array<(event: TouchEvent) => void>,
    swipeRight: [] as Array<(event: TouchEvent) => void>,
    swipeUp: [] as Array<(event: TouchEvent) => void>,
    swipeDown: [] as Array<(event: TouchEvent) => void>,
  };

  constructor(element: HTMLElement) {
    this.element = element;
    this.init();
  }

  private init(): void {
    this.element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchCancel, { passive: false });
  }

  private handleTouchStart = (event: TouchEvent): void => {
    const touch = event.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.startTime = Date.now();
    this.isPressed = true;

    // Start long press timer
    this.pressTimer = setTimeout(() => {
      if (this.isPressed) {
        this.triggerCallback('longPress', event);
        touchFeedback.longPress();
      }
    }, 500);

    // Light haptic feedback on touch start
    touchFeedback.tap();
  };

  private handleTouchEnd = (event: TouchEvent): void => {
    if (!this.isPressed) return;

    this.isPressed = false;
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }

    const touch = event.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const deltaX = endX - this.startX;
    const deltaY = endY - this.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = Date.now() - this.startTime;

    // Check for swipe gestures
    if (distance > 50 && duration < 300) {
      const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;

      if (Math.abs(angle) < 45) {
        this.triggerCallback('swipeRight', event);
        touchFeedback.swipe();
      } else if (Math.abs(angle) > 135) {
        this.triggerCallback('swipeLeft', event);
        touchFeedback.swipe();
      } else if (angle < -45 && angle > -135) {
        this.triggerCallback('swipeUp', event);
        touchFeedback.swipe();
      } else if (angle > 45 && angle < 135) {
        this.triggerCallback('swipeDown', event);
        touchFeedback.swipe();
      }
    } else if (distance < 10 && duration < 200) {
      // Tap gesture
      this.triggerCallback('tap', event);
    }
  };

  private handleTouchMove = (event: TouchEvent): void => {
    const touch = event.touches[0];
    const deltaX = touch.clientX - this.startX;
    const deltaY = touch.clientY - this.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Cancel long press if moved too much
    if (distance > 10 && this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
  };

  private handleTouchCancel = (): void => {
    this.isPressed = false;
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
  };

  private triggerCallback(type: keyof typeof this.callbacks, event: TouchEvent): void {
    this.callbacks[type].forEach(callback => callback(event));
  }

  // Public API
  onTap(callback: (event: TouchEvent) => void): void {
    this.callbacks.tap.push(callback);
  }

  onLongPress(callback: (event: TouchEvent) => void): void {
    this.callbacks.longPress.push(callback);
  }

  onSwipeLeft(callback: (event: TouchEvent) => void): void {
    this.callbacks.swipeLeft.push(callback);
  }

  onSwipeRight(callback: (event: TouchEvent) => void): void {
    this.callbacks.swipeRight.push(callback);
  }

  onSwipeUp(callback: (event: TouchEvent) => void): void {
    this.callbacks.swipeUp.push(callback);
  }

  onSwipeDown(callback: (event: TouchEvent) => void): void {
    this.callbacks.swipeDown.push(callback);
  }

  destroy(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchcancel', this.handleTouchCancel);

    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
    }
  }
}

// React hook for touch gestures
export function useTouchGestures(elementRef: React.RefObject<HTMLElement>) {
  const [detector, setDetector] = React.useState<TouchGestureDetector | null>(null);

  React.useEffect(() => {
    if (elementRef.current) {
      const gestureDetector = new TouchGestureDetector(elementRef.current);
      setDetector(gestureDetector);

      return () => {
        gestureDetector.destroy();
      };
    }
  }, [elementRef]);

  return detector;
}

// Touch ripple effect
export function createRippleEffect(element: HTMLElement, event: MouseEvent | TouchEvent): void {
  const ripple = document.createElement('span');
  const rect = element.getBoundingClientRect();

  let x: number, y: number;

  if (event instanceof TouchEvent) {
    const touch = event.touches[0] || event.changedTouches[0];
    x = touch.clientX - rect.left;
    y = touch.clientY - rect.top;
  } else {
    x = event.clientX - rect.left;
    y = event.clientY - rect.top;
  }

  const size = Math.max(rect.width, rect.height);

  ripple.style.cssText = `
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    pointer-events: none;
    left: ${x - size / 2}px;
    top: ${y - size / 2}px;
    width: ${size}px;
    height: ${size}px;
    transform: scale(0);
    animation: ripple 600ms linear;
  `;

  // Add ripple animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  `;

  document.head.appendChild(style);
  element.appendChild(ripple);

  // Clean up
  setTimeout(() => {
    element.removeChild(ripple);
    document.head.removeChild(style);
  }, 600);
}

// React hook for ripple effect
export function useRippleEffect() {
  const addRipple = React.useCallback((event: React.MouseEvent | React.TouchEvent) => {
    const target = event.currentTarget as HTMLElement;
    createRippleEffect(target, event.nativeEvent);
  }, []);

  return addRipple;
}

// Touch preferences manager
export class TouchPreferences {
  private static readonly STORAGE_KEY = 'touch_preferences';

  private preferences = {
    hapticsEnabled: true,
    rippleEnabled: true,
    gesturesEnabled: true,
    sensitivity: 'medium' as 'low' | 'medium' | 'high',
  };

  constructor() {
    this.load();
  }

  private load(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(TouchPreferences.STORAGE_KEY);
      if (stored) {
        this.preferences = { ...this.preferences, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load touch preferences:', error);
    }

    // Apply preferences
    if (!this.preferences.hapticsEnabled) {
      haptics.disable();
    }
  }

  private save(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(TouchPreferences.STORAGE_KEY, JSON.stringify(this.preferences));
    } catch (error) {
      console.warn('Failed to save touch preferences:', error);
    }
  }

  // Getters
  get hapticsEnabled(): boolean {
    return this.preferences.hapticsEnabled;
  }

  get rippleEnabled(): boolean {
    return this.preferences.rippleEnabled;
  }

  get gesturesEnabled(): boolean {
    return this.preferences.gesturesEnabled;
  }

  get sensitivity(): 'low' | 'medium' | 'high' {
    return this.preferences.sensitivity;
  }

  // Setters
  setHapticsEnabled(enabled: boolean): void {
    this.preferences.hapticsEnabled = enabled;
    if (enabled) {
      haptics.enable();
    } else {
      haptics.disable();
    }
    this.save();
  }

  setRippleEnabled(enabled: boolean): void {
    this.preferences.rippleEnabled = enabled;
    this.save();
  }

  setGesturesEnabled(enabled: boolean): void {
    this.preferences.gesturesEnabled = enabled;
    this.save();
  }

  setSensitivity(sensitivity: 'low' | 'medium' | 'high'): void {
    this.preferences.sensitivity = sensitivity;
    this.save();
  }

  // Get all preferences
  getAll() {
    return { ...this.preferences };
  }
}

// Global touch preferences instance
export const touchPreferences = new TouchPreferences();

// React hook for touch preferences
export function useTouchPreferences() {
  const [preferences, setPreferences] = React.useState(touchPreferences.getAll());

  const updatePreferences = React.useCallback(() => {
    setPreferences(touchPreferences.getAll());
  }, []);

  return {
    preferences,
    setHapticsEnabled: (enabled: boolean) => {
      touchPreferences.setHapticsEnabled(enabled);
      updatePreferences();
    },
    setRippleEnabled: (enabled: boolean) => {
      touchPreferences.setRippleEnabled(enabled);
      updatePreferences();
    },
    setGesturesEnabled: (enabled: boolean) => {
      touchPreferences.setGesturesEnabled(enabled);
      updatePreferences();
    },
    setSensitivity: (sensitivity: 'low' | 'medium' | 'high') => {
      touchPreferences.setSensitivity(sensitivity);
      updatePreferences();
    },
  };
}