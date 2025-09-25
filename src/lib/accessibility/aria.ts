// ARIA utilities and screen reader support
import React from 'react';

// ARIA attribute builders
export const ariaUtils = {
  // Describe an element with another element
  describedBy: (id: string) => ({
    'aria-describedby': id,
  }),

  // Label an element with another element
  labelledBy: (id: string) => ({
    'aria-labelledby': id,
  }),

  // Provide accessible label
  label: (label: string) => ({
    'aria-label': label,
  }),

  // Control expanded state
  expanded: (isExpanded: boolean) => ({
    'aria-expanded': isExpanded.toString(),
  }),

  // Control selected state
  selected: (isSelected: boolean) => ({
    'aria-selected': isSelected.toString(),
  }),

  // Control checked state
  checked: (isChecked: boolean | 'mixed') => ({
    'aria-checked': isChecked.toString(),
  }),

  // Control disabled state
  disabled: (isDisabled: boolean) => ({
    'aria-disabled': isDisabled.toString(),
  }),

  // Control hidden state
  hidden: (isHidden: boolean) => ({
    'aria-hidden': isHidden.toString(),
  }),

  // Control pressed state
  pressed: (isPressed: boolean) => ({
    'aria-pressed': isPressed.toString(),
  }),

  // Control busy/loading state
  busy: (isBusy: boolean) => ({
    'aria-busy': isBusy.toString(),
  }),

  // Control live regions
  live: (politeness: 'off' | 'polite' | 'assertive') => ({
    'aria-live': politeness,
  }),

  // Control atomic announcements
  atomic: (isAtomic: boolean) => ({
    'aria-atomic': isAtomic.toString(),
  }),

  // Control relevant announcements
  relevant: (changes: 'additions' | 'removals' | 'text' | 'all') => ({
    'aria-relevant': changes,
  }),

  // Set current item in set
  current: (current: 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false') => ({
    'aria-current': current,
  }),

  // Set position in set
  posInSet: (position: number) => ({
    'aria-posinset': position.toString(),
  }),

  // Set size of set
  setSize: (size: number) => ({
    'aria-setsize': size.toString(),
  }),

  // Set level in hierarchy
  level: (level: number) => ({
    'aria-level': level.toString(),
  }),

  // Set value for ranges
  valueNow: (value: number) => ({
    'aria-valuenow': value.toString(),
  }),

  valueMin: (min: number) => ({
    'aria-valuemin': min.toString(),
  }),

  valueMax: (max: number) => ({
    'aria-valuemax': max.toString(),
  }),

  valueText: (text: string) => ({
    'aria-valuetext': text,
  }),

  // Modal dialog attributes
  modal: (isModal: boolean) => ({
    'aria-modal': isModal.toString(),
  }),

  // Control has popup
  hasPopup: (type: 'true' | 'false' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog') => ({
    'aria-haspopup': type,
  }),

  // Control owns
  owns: (ids: string | string[]) => ({
    'aria-owns': Array.isArray(ids) ? ids.join(' ') : ids,
  }),

  // Control controls
  controls: (ids: string | string[]) => ({
    'aria-controls': Array.isArray(ids) ? ids.join(' ') : ids,
  }),

  // Control flow to
  flowTo: (ids: string | string[]) => ({
    'aria-flowto': Array.isArray(ids) ? ids.join(' ') : ids,
  }),

  // Active descendant
  activeDescendant: (id: string) => ({
    'aria-activedescendant': id,
  }),

  // Error message
  errorMessage: (id: string) => ({
    'aria-errormessage': id,
  }),

  // Invalid state
  invalid: (isInvalid: boolean | 'grammar' | 'spelling') => ({
    'aria-invalid': isInvalid.toString(),
  }),

  // Required field
  required: (isRequired: boolean) => ({
    'aria-required': isRequired.toString(),
  }),

  // Readonly field
  readonly: (isReadonly: boolean) => ({
    'aria-readonly': isReadonly.toString(),
  }),

  // Multiline field
  multiline: (isMultiline: boolean) => ({
    'aria-multiline': isMultiline.toString(),
  }),

  // Autocomplete
  autocomplete: (value: 'inline' | 'list' | 'both' | 'none') => ({
    'aria-autocomplete': value,
  }),

  // Sort direction
  sort: (direction: 'ascending' | 'descending' | 'none' | 'other') => ({
    'aria-sort': direction,
  }),

  // Orientation
  orientation: (orientation: 'horizontal' | 'vertical') => ({
    'aria-orientation': orientation,
  }),

  // Keyboard shortcuts
  keyShortcuts: (shortcuts: string) => ({
    'aria-keyshortcuts': shortcuts,
  }),

  // Role description
  roleDescription: (description: string) => ({
    'aria-roledescription': description,
  }),
};

// Common ARIA patterns
export const ariaPatterns = {
  // Button
  button: (label: string, options: { pressed?: boolean; disabled?: boolean } = {}) => ({
    role: 'button',
    tabIndex: options.disabled ? -1 : 0,
    ...ariaUtils.label(label),
    ...(options.pressed !== undefined && ariaUtils.pressed(options.pressed)),
    ...(options.disabled && ariaUtils.disabled(options.disabled)),
  }),

  // Link
  link: (label: string, options: { disabled?: boolean } = {}) => ({
    role: 'link',
    tabIndex: options.disabled ? -1 : 0,
    ...ariaUtils.label(label),
    ...(options.disabled && ariaUtils.disabled(options.disabled)),
  }),

  // Checkbox
  checkbox: (label: string, checked: boolean | 'mixed', options: { disabled?: boolean } = {}) => ({
    role: 'checkbox',
    tabIndex: options.disabled ? -1 : 0,
    ...ariaUtils.label(label),
    ...ariaUtils.checked(checked),
    ...(options.disabled && ariaUtils.disabled(options.disabled)),
  }),

  // Radio button
  radio: (label: string, checked: boolean, options: { disabled?: boolean } = {}) => ({
    role: 'radio',
    tabIndex: checked && !options.disabled ? 0 : -1,
    ...ariaUtils.label(label),
    ...ariaUtils.checked(checked),
    ...(options.disabled && ariaUtils.disabled(options.disabled)),
  }),

  // Textbox
  textbox: (label: string, options: {
    multiline?: boolean;
    readonly?: boolean;
    required?: boolean;
    invalid?: boolean;
    describedBy?: string;
    errorMessage?: string;
  } = {}) => ({
    role: options.multiline ? 'textbox' : undefined,
    ...ariaUtils.label(label),
    ...(options.multiline && ariaUtils.multiline(options.multiline)),
    ...(options.readonly && ariaUtils.readonly(options.readonly)),
    ...(options.required && ariaUtils.required(options.required)),
    ...(options.invalid && ariaUtils.invalid(options.invalid)),
    ...(options.describedBy && ariaUtils.describedBy(options.describedBy)),
    ...(options.errorMessage && ariaUtils.errorMessage(options.errorMessage)),
  }),

  // Combobox
  combobox: (label: string, options: {
    expanded?: boolean;
    hasPopup?: 'listbox' | 'tree' | 'grid' | 'dialog';
    controls?: string;
    activeDescendant?: string;
    autocomplete?: 'inline' | 'list' | 'both' | 'none';
  } = {}) => ({
    role: 'combobox',
    ...ariaUtils.label(label),
    ...(options.expanded !== undefined && ariaUtils.expanded(options.expanded)),
    ...(options.hasPopup && ariaUtils.hasPopup(options.hasPopup)),
    ...(options.controls && ariaUtils.controls(options.controls)),
    ...(options.activeDescendant && ariaUtils.activeDescendant(options.activeDescendant)),
    ...(options.autocomplete && ariaUtils.autocomplete(options.autocomplete)),
  }),

  // Listbox
  listbox: (label: string, options: {
    multiselectable?: boolean;
    orientation?: 'horizontal' | 'vertical';
    activedescendant?: string;
  } = {}) => ({
    role: 'listbox',
    ...ariaUtils.label(label),
    ...(options.multiselectable && { 'aria-multiselectable': options.multiselectable.toString() }),
    ...(options.orientation && ariaUtils.orientation(options.orientation)),
    ...(options.activedescendant && ariaUtils.activeDescendant(options.activedescendant)),
  }),

  // Option
  option: (label: string, selected: boolean, options: {
    disabled?: boolean;
    posInSet?: number;
    setSize?: number;
  } = {}) => ({
    role: 'option',
    ...ariaUtils.label(label),
    ...ariaUtils.selected(selected),
    ...(options.disabled && ariaUtils.disabled(options.disabled)),
    ...(options.posInSet && ariaUtils.posInSet(options.posInSet)),
    ...(options.setSize && ariaUtils.setSize(options.setSize)),
  }),

  // Menu
  menu: (label: string, options: { orientation?: 'horizontal' | 'vertical' } = {}) => ({
    role: 'menu',
    ...ariaUtils.label(label),
    ...(options.orientation && ariaUtils.orientation(options.orientation)),
  }),

  // Menu item
  menuitem: (label: string, options: { disabled?: boolean } = {}) => ({
    role: 'menuitem',
    tabIndex: -1,
    ...ariaUtils.label(label),
    ...(options.disabled && ariaUtils.disabled(options.disabled)),
  }),

  // Menu item checkbox
  menuitemcheckbox: (label: string, checked: boolean | 'mixed', options: { disabled?: boolean } = {}) => ({
    role: 'menuitemcheckbox',
    tabIndex: -1,
    ...ariaUtils.label(label),
    ...ariaUtils.checked(checked),
    ...(options.disabled && ariaUtils.disabled(options.disabled)),
  }),

  // Menu item radio
  menuitemradio: (label: string, checked: boolean, options: { disabled?: boolean } = {}) => ({
    role: 'menuitemradio',
    tabIndex: -1,
    ...ariaUtils.label(label),
    ...ariaUtils.checked(checked),
    ...(options.disabled && ariaUtils.disabled(options.disabled)),
  }),

  // Tab
  tab: (label: string, selected: boolean, controls: string, options: { disabled?: boolean } = {}) => ({
    role: 'tab',
    tabIndex: selected && !options.disabled ? 0 : -1,
    ...ariaUtils.label(label),
    ...ariaUtils.selected(selected),
    ...ariaUtils.controls(controls),
    ...(options.disabled && ariaUtils.disabled(options.disabled)),
  }),

  // Tab panel
  tabpanel: (labelledBy: string, options: { hidden?: boolean } = {}) => ({
    role: 'tabpanel',
    tabIndex: 0,
    ...ariaUtils.labelledBy(labelledBy),
    ...(options.hidden && ariaUtils.hidden(options.hidden)),
  }),

  // Dialog
  dialog: (label: string, modal = true, options: { describedBy?: string } = {}) => ({
    role: 'dialog',
    ...ariaUtils.label(label),
    ...ariaUtils.modal(modal),
    ...(options.describedBy && ariaUtils.describedBy(options.describedBy)),
  }),

  // Alert dialog
  alertdialog: (label: string, describedBy?: string) => ({
    role: 'alertdialog',
    ...ariaUtils.label(label),
    ...ariaUtils.modal(true),
    ...(describedBy && ariaUtils.describedBy(describedBy)),
  }),

  // Alert
  alert: (message: string) => ({
    role: 'alert',
    ...ariaUtils.label(message),
    ...ariaUtils.live('assertive'),
    ...ariaUtils.atomic(true),
  }),

  // Status
  status: (message: string) => ({
    role: 'status',
    ...ariaUtils.label(message),
    ...ariaUtils.live('polite'),
    ...ariaUtils.atomic(true),
  }),

  // Progress bar
  progressbar: (label: string, value: number, min = 0, max = 100, options: { valueText?: string } = {}) => ({
    role: 'progressbar',
    ...ariaUtils.label(label),
    ...ariaUtils.valueNow(value),
    ...ariaUtils.valueMin(min),
    ...ariaUtils.valueMax(max),
    ...(options.valueText && ariaUtils.valueText(options.valueText)),
  }),

  // Slider
  slider: (label: string, value: number, min = 0, max = 100, options: {
    valueText?: string;
    orientation?: 'horizontal' | 'vertical';
  } = {}) => ({
    role: 'slider',
    tabIndex: 0,
    ...ariaUtils.label(label),
    ...ariaUtils.valueNow(value),
    ...ariaUtils.valueMin(min),
    ...ariaUtils.valueMax(max),
    ...(options.valueText && ariaUtils.valueText(options.valueText)),
    ...(options.orientation && ariaUtils.orientation(options.orientation)),
  }),

  // Switch
  switch: (label: string, checked: boolean, options: { disabled?: boolean } = {}) => ({
    role: 'switch',
    tabIndex: options.disabled ? -1 : 0,
    ...ariaUtils.label(label),
    ...ariaUtils.checked(checked),
    ...(options.disabled && ariaUtils.disabled(options.disabled)),
  }),

  // Grid
  grid: (label: string, options: {
    multiselectable?: boolean;
    readonly?: boolean;
  } = {}) => ({
    role: 'grid',
    ...ariaUtils.label(label),
    ...(options.multiselectable && { 'aria-multiselectable': options.multiselectable.toString() }),
    ...(options.readonly && ariaUtils.readonly(options.readonly)),
  }),

  // Grid cell
  gridcell: (options: {
    selected?: boolean;
    readonly?: boolean;
    required?: boolean;
    colIndex?: number;
    rowIndex?: number;
  } = {}) => ({
    role: 'gridcell',
    ...(options.selected && ariaUtils.selected(options.selected)),
    ...(options.readonly && ariaUtils.readonly(options.readonly)),
    ...(options.required && ariaUtils.required(options.required)),
    ...(options.colIndex && { 'aria-colindex': options.colIndex.toString() }),
    ...(options.rowIndex && { 'aria-rowindex': options.rowIndex.toString() }),
  }),

  // Column header
  columnheader: (label: string, options: {
    sort?: 'ascending' | 'descending' | 'none' | 'other';
    colIndex?: number;
  } = {}) => ({
    role: 'columnheader',
    ...ariaUtils.label(label),
    ...(options.sort && ariaUtils.sort(options.sort)),
    ...(options.colIndex && { 'aria-colindex': options.colIndex.toString() }),
  }),

  // Row header
  rowheader: (label: string, options: { rowIndex?: number } = {}) => ({
    role: 'rowheader',
    ...ariaUtils.label(label),
    ...(options.rowIndex && { 'aria-rowindex': options.rowIndex.toString() }),
  }),

  // Tooltip
  tooltip: (content: string) => ({
    role: 'tooltip',
    ...ariaUtils.label(content),
  }),

  // Tree
  tree: (label: string, options: {
    multiselectable?: boolean;
    orientation?: 'horizontal' | 'vertical';
  } = {}) => ({
    role: 'tree',
    ...ariaUtils.label(label),
    ...(options.multiselectable && { 'aria-multiselectable': options.multiselectable.toString() }),
    ...(options.orientation && ariaUtils.orientation(options.orientation)),
  }),

  // Tree item
  treeitem: (label: string, options: {
    expanded?: boolean;
    selected?: boolean;
    level?: number;
    posInSet?: number;
    setSize?: number;
  } = {}) => ({
    role: 'treeitem',
    tabIndex: -1,
    ...ariaUtils.label(label),
    ...(options.expanded !== undefined && ariaUtils.expanded(options.expanded)),
    ...(options.selected && ariaUtils.selected(options.selected)),
    ...(options.level && ariaUtils.level(options.level)),
    ...(options.posInSet && ariaUtils.posInSet(options.posInSet)),
    ...(options.setSize && ariaUtils.setSize(options.setSize)),
  }),
};

// Live region announcer
export class LiveRegionAnnouncer {
  private politeRegion: HTMLElement;
  private assertiveRegion: HTMLElement;

  constructor() {
    this.politeRegion = this.createLiveRegion('polite');
    this.assertiveRegion = this.createLiveRegion('assertive');
  }

  private createLiveRegion(politeness: 'polite' | 'assertive'): HTMLElement {
    const region = document.createElement('div');
    region.setAttribute('aria-live', politeness);
    region.setAttribute('aria-atomic', 'true');
    region.style.position = 'absolute';
    region.style.left = '-10000px';
    region.style.width = '1px';
    region.style.height = '1px';
    region.style.overflow = 'hidden';
    document.body.appendChild(region);
    return region;
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const region = priority === 'assertive' ? this.assertiveRegion : this.politeRegion;

    // Clear the region first
    region.textContent = '';

    // Add the message after a brief delay to ensure it's announced
    setTimeout(() => {
      region.textContent = message;
    }, 100);
  }

  destroy(): void {
    if (this.politeRegion.parentNode) {
      this.politeRegion.parentNode.removeChild(this.politeRegion);
    }
    if (this.assertiveRegion.parentNode) {
      this.assertiveRegion.parentNode.removeChild(this.assertiveRegion);
    }
  }
}

// Global live region instance
let globalAnnouncer: LiveRegionAnnouncer | null = null;

export const announce = (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
  if (typeof window === 'undefined') return;

  if (!globalAnnouncer) {
    globalAnnouncer = new LiveRegionAnnouncer();
  }

  globalAnnouncer.announce(message, priority);
};

// React hook for live announcements
export function useLiveAnnouncer() {
  React.useEffect(() => {
    return () => {
      if (globalAnnouncer) {
        globalAnnouncer.destroy();
        globalAnnouncer = null;
      }
    };
  }, []);

  return { announce };
}

// Screen reader utilities
export const screenReader = {
  // Check if screen reader is active
  isActive: (): boolean => {
    if (typeof window === 'undefined') return false;

    // Check for common screen reader indicators
    return !!(
      window.navigator.userAgent.includes('NVDA') ||
      window.navigator.userAgent.includes('JAWS') ||
      window.speechSynthesis ||
      (window as any).speechSynthesis
    );
  },

  // Create screen reader only text
  onlyText: (text: string) => ({
    position: 'absolute' as const,
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden' as const,
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap' as const,
    border: '0',
  }),

  // Format currency for screen readers
  formatCurrency: (amount: number, currency = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  },

  // Format percentage for screen readers
  formatPercentage: (value: number, decimals = 1): string => {
    return `${value.toFixed(decimals)} percent`;
  },

  // Format date for screen readers
  formatDate: (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },

  // Format time for screen readers
  formatTime: (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  },
};