// Focus management and keyboard navigation utilities
import React from 'react';
import { designTokens } from '../design/tokens';

// Focus trap utility
export class FocusTrap {
  private element: HTMLElement;
  private previousActiveElement: Element | null = null;
  private focusableElements: HTMLElement[] = [];

  constructor(element: HTMLElement) {
    this.element = element;
  }

  // Focusable element selectors
  private static FOCUSABLE_SELECTORS = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
    'summary',
    'iframe',
    'object',
    'embed',
    'area[href]',
    'audio[controls]',
    'video[controls]',
    '[draggable="true"]',
  ].join(', ');

  // Get all focusable elements within the trap
  private getFocusableElements(): HTMLElement[] {
    const elements = Array.from(
      this.element.querySelectorAll(this.constructor.FOCUSABLE_SELECTORS)
    ) as HTMLElement[];

    return elements.filter(element => {
      return this.isVisible(element) && !this.isDisabled(element);
    });
  }

  // Check if element is visible
  private isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      element.offsetWidth > 0 &&
      element.offsetHeight > 0
    );
  }

  // Check if element is disabled
  private isDisabled(element: HTMLElement): boolean {
    return element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true';
  }

  // Handle keydown events
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return;

    this.focusableElements = this.getFocusableElements();

    if (this.focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const currentIndex = this.focusableElements.indexOf(
      document.activeElement as HTMLElement
    );

    if (event.shiftKey) {
      // Shift + Tab (backward)
      if (currentIndex <= 0) {
        event.preventDefault();
        this.focusableElements[this.focusableElements.length - 1].focus();
      }
    } else {
      // Tab (forward)
      if (currentIndex >= this.focusableElements.length - 1) {
        event.preventDefault();
        this.focusableElements[0].focus();
      }
    }
  };

  // Activate the focus trap
  activate(): void {
    this.previousActiveElement = document.activeElement;
    this.focusableElements = this.getFocusableElements();

    // Focus the first focusable element
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
    }

    // Add event listener
    document.addEventListener('keydown', this.handleKeyDown);
  }

  // Deactivate the focus trap
  deactivate(): void {
    document.removeEventListener('keydown', this.handleKeyDown);

    // Restore focus to previously active element
    if (this.previousActiveElement && 'focus' in this.previousActiveElement) {
      (this.previousActiveElement as HTMLElement).focus();
    }
  }
}

// React hook for focus trap
export function useFocusTrap() {
  const [isActive, setIsActive] = React.useState(false);
  const trapRef = React.useRef<FocusTrap | null>(null);

  const activate = React.useCallback((element: HTMLElement) => {
    if (trapRef.current) {
      trapRef.current.deactivate();
    }

    trapRef.current = new FocusTrap(element);
    trapRef.current.activate();
    setIsActive(true);
  }, []);

  const deactivate = React.useCallback(() => {
    if (trapRef.current) {
      trapRef.current.deactivate();
      trapRef.current = null;
      setIsActive(false);
    }
  }, []);

  React.useEffect(() => {
    return () => {
      if (trapRef.current) {
        trapRef.current.deactivate();
      }
    };
  }, []);

  return { activate, deactivate, isActive };
}

// Focus management utilities
export const focusUtils = {
  // Focus first focusable element in container
  focusFirst: (container: HTMLElement): boolean => {
    const focusable = container.querySelector(
      FocusTrap.FOCUSABLE_SELECTORS
    ) as HTMLElement;

    if (focusable) {
      focusable.focus();
      return true;
    }
    return false;
  },

  // Focus last focusable element in container
  focusLast: (container: HTMLElement): boolean => {
    const focusable = Array.from(
      container.querySelectorAll(FocusTrap.FOCUSABLE_SELECTORS)
    ).pop() as HTMLElement;

    if (focusable) {
      focusable.focus();
      return true;
    }
    return false;
  },

  // Move focus to next/previous element
  moveFocus: (direction: 'next' | 'previous', container?: HTMLElement): boolean => {
    const activeElement = document.activeElement as HTMLElement;
    const root = container || document.body;
    const focusableElements = Array.from(
      root.querySelectorAll(FocusTrap.FOCUSABLE_SELECTORS)
    ) as HTMLElement[];

    const currentIndex = focusableElements.indexOf(activeElement);
    if (currentIndex === -1) return false;

    const nextIndex = direction === 'next'
      ? (currentIndex + 1) % focusableElements.length
      : (currentIndex - 1 + focusableElements.length) % focusableElements.length;

    focusableElements[nextIndex].focus();
    return true;
  },

  // Check if element is focusable
  isFocusable: (element: HTMLElement): boolean => {
    return element.matches(FocusTrap.FOCUSABLE_SELECTORS);
  },

  // Save and restore focus
  saveFocus: (): (() => void) => {
    const activeElement = document.activeElement as HTMLElement;
    return () => {
      if (activeElement && activeElement.focus) {
        activeElement.focus();
      }
    };
  },
};

// Keyboard navigation patterns
export const keyboardPatterns = {
  // Arrow key navigation for lists/grids
  arrowNavigation: {
    horizontal: (event: KeyboardEvent, items: HTMLElement[]) => {
      const currentIndex = items.indexOf(document.activeElement as HTMLElement);
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      switch (event.key) {
        case 'ArrowLeft':
          nextIndex = Math.max(0, currentIndex - 1);
          break;
        case 'ArrowRight':
          nextIndex = Math.min(items.length - 1, currentIndex + 1);
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = items.length - 1;
          break;
        default:
          return;
      }

      event.preventDefault();
      items[nextIndex].focus();
    },

    vertical: (event: KeyboardEvent, items: HTMLElement[]) => {
      const currentIndex = items.indexOf(document.activeElement as HTMLElement);
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      switch (event.key) {
        case 'ArrowUp':
          nextIndex = Math.max(0, currentIndex - 1);
          break;
        case 'ArrowDown':
          nextIndex = Math.min(items.length - 1, currentIndex + 1);
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = items.length - 1;
          break;
        default:
          return;
      }

      event.preventDefault();
      items[nextIndex].focus();
    },

    grid: (event: KeyboardEvent, items: HTMLElement[], columns: number) => {
      const currentIndex = items.indexOf(document.activeElement as HTMLElement);
      if (currentIndex === -1) return;

      const rows = Math.ceil(items.length / columns);
      const currentRow = Math.floor(currentIndex / columns);
      const currentCol = currentIndex % columns;

      let nextIndex = currentIndex;

      switch (event.key) {
        case 'ArrowLeft':
          nextIndex = Math.max(currentRow * columns, currentIndex - 1);
          break;
        case 'ArrowRight':
          nextIndex = Math.min((currentRow + 1) * columns - 1, currentIndex + 1);
          nextIndex = Math.min(items.length - 1, nextIndex);
          break;
        case 'ArrowUp':
          if (currentRow > 0) {
            nextIndex = (currentRow - 1) * columns + currentCol;
          }
          break;
        case 'ArrowDown':
          if (currentRow < rows - 1) {
            nextIndex = Math.min(items.length - 1, (currentRow + 1) * columns + currentCol);
          }
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = items.length - 1;
          break;
        default:
          return;
      }

      event.preventDefault();
      items[nextIndex].focus();
    },
  },

  // Escape key handling
  escape: (callback: () => void) => {
    return (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        callback();
      }
    };
  },

  // Enter/Space key activation
  activation: (callback: () => void) => {
    return (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        callback();
      }
    };
  },
};

// Focus styles generator
export const focusStyles = {
  // Default focus ring
  ring: {
    outline: 'none',
    boxShadow: `0 0 0 2px ${designTokens.colors.primary[500]}`,
    borderRadius: designTokens.borderRadius.md,
  },

  // Inset focus ring
  ringInset: {
    outline: 'none',
    boxShadow: `inset 0 0 0 2px ${designTokens.colors.primary[500]}`,
  },

  // Custom color focus ring
  ringColor: (color: string) => ({
    outline: 'none',
    boxShadow: `0 0 0 2px ${color}`,
    borderRadius: designTokens.borderRadius.md,
  }),

  // Focus with offset
  ringOffset: (offset = '2px') => ({
    outline: 'none',
    boxShadow: `0 0 0 ${offset} ${designTokens.colors.gray[50]}, 0 0 0 calc(${offset} + 2px) ${designTokens.colors.primary[500]}`,
    borderRadius: designTokens.borderRadius.md,
  }),

  // High contrast focus
  highContrast: {
    outline: 'none',
    '@media (prefers-contrast: high)': {
      outline: '2px solid CanvasText',
      outlineOffset: '2px',
    },
  },

  // Focus visible only (no mouse focus)
  focusVisible: {
    outline: 'none',
    '&:focus-visible': {
      boxShadow: `0 0 0 2px ${designTokens.colors.primary[500]}`,
      borderRadius: designTokens.borderRadius.md,
    },
  },
};

// React hook for focus management
export function useFocusManagement() {
  const [focusedElement, setFocusedElement] = React.useState<HTMLElement | null>(null);

  const handleFocusIn = React.useCallback((event: FocusEvent) => {
    setFocusedElement(event.target as HTMLElement);
  }, []);

  const handleFocusOut = React.useCallback(() => {
    setFocusedElement(null);
  }, []);

  React.useEffect(() => {
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [handleFocusIn, handleFocusOut]);

  return {
    focusedElement,
    isFocused: (element: HTMLElement) => element === focusedElement,
  };
}

// Skip link component utility
export const skipLinkStyles = {
  position: 'absolute' as const,
  top: '-40px',
  left: '6px',
  zIndex: designTokens.zIndex.modal,
  padding: designTokens.spacing[2],
  backgroundColor: designTokens.colors.gray[900],
  color: designTokens.colors.gray[50],
  textDecoration: 'none',
  borderRadius: designTokens.borderRadius.md,
  fontSize: designTokens.typography.fontSize.sm[0],
  fontWeight: designTokens.typography.fontWeight.medium,
  transition: 'top 0.3s ease-out',

  '&:focus': {
    top: '6px',
    outline: 'none',
    boxShadow: `0 0 0 2px ${designTokens.colors.primary[500]}`,
  },
};

// Roving tabindex manager
export class RovingTabindexManager {
  private items: HTMLElement[] = [];
  private currentIndex = 0;

  constructor(items: HTMLElement[]) {
    this.items = items;
    this.updateTabindices();
  }

  private updateTabindices(): void {
    this.items.forEach((item, index) => {
      item.tabIndex = index === this.currentIndex ? 0 : -1;
    });
  }

  setCurrentIndex(index: number): void {
    if (index >= 0 && index < this.items.length) {
      this.currentIndex = index;
      this.updateTabindices();
    }
  }

  focus(): void {
    if (this.items[this.currentIndex]) {
      this.items[this.currentIndex].focus();
    }
  }

  moveNext(): void {
    this.setCurrentIndex((this.currentIndex + 1) % this.items.length);
    this.focus();
  }

  movePrevious(): void {
    this.setCurrentIndex(
      (this.currentIndex - 1 + this.items.length) % this.items.length
    );
    this.focus();
  }

  moveFirst(): void {
    this.setCurrentIndex(0);
    this.focus();
  }

  moveLast(): void {
    this.setCurrentIndex(this.items.length - 1);
    this.focus();
  }
}