import { logger } from '../logging/structuredLogger';

export interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isInstalling: boolean;
  isWaiting: boolean;
  isActive: boolean;
  hasUpdate: boolean;
  registration: ServiceWorkerRegistration | null;
}

export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private state: ServiceWorkerState = {
    isSupported: false,
    isRegistered: false,
    isInstalling: false,
    isWaiting: false,
    isActive: false,
    hasUpdate: false,
    registration: null,
  };

  private listeners: Map<string, Array<(state: ServiceWorkerState) => void>> = new Map();
  private installPrompt: PWAInstallPrompt | null = null;

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  async initialize(): Promise<void> {
    if (typeof window === 'undefined') {
      logger.warn('Service Worker not available in server environment');
      return;
    }

    this.state.isSupported = 'serviceWorker' in navigator;

    if (!this.state.isSupported) {
      logger.warn('Service Worker not supported in this browser');
      this.notifyListeners();
      return;
    }

    try {
      await this.registerServiceWorker();
      this.setupInstallPrompt();
      this.setupUpdateChecker();
      logger.info('Service Worker Manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Service Worker Manager', error as Error);
      throw error;
    }
  }

  private async registerServiceWorker(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });

      this.state.registration = registration;
      this.state.isRegistered = true;

      // Listen for service worker state changes
      this.setupServiceWorkerListeners(registration);

      // Check if there's an update waiting
      if (registration.waiting) {
        this.state.isWaiting = true;
        this.state.hasUpdate = true;
      }

      // Check if service worker is active
      if (registration.active) {
        this.state.isActive = true;
      }

      this.notifyListeners();

      logger.info('Service Worker registered successfully', {
        metadata: {
          scope: registration.scope,
          updateViaCache: 'none',
        },
      });
    } catch (error) {
      logger.error('Service Worker registration failed', error as Error);
      throw error;
    }
  }

  private setupServiceWorkerListeners(registration: ServiceWorkerRegistration): void {
    // Listen for installing service worker
    if (registration.installing) {
      this.state.isInstalling = true;
      this.trackServiceWorkerState(registration.installing);
    }

    // Listen for waiting service worker
    if (registration.waiting) {
      this.state.isWaiting = true;
      this.state.hasUpdate = true;
    }

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      logger.info('Service Worker update found');
      const newWorker = registration.installing;

      if (newWorker) {
        this.state.isInstalling = true;
        this.trackServiceWorkerState(newWorker);
        this.notifyListeners();
      }
    });

    // Listen for controller change (new service worker activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      logger.info('Service Worker controller changed');
      this.state.hasUpdate = false;
      this.state.isWaiting = false;
      this.state.isActive = true;
      this.notifyListeners();

      // Reload the page to ensure new service worker takes control
      window.location.reload();
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event);
    });
  }

  private trackServiceWorkerState(worker: ServiceWorker): void {
    worker.addEventListener('statechange', () => {
      logger.info('Service Worker state changed', {
        metadata: { state: worker.state },
      });

      switch (worker.state) {
        case 'installing':
          this.state.isInstalling = true;
          break;
        case 'installed':
          this.state.isInstalling = false;
          if (navigator.serviceWorker.controller) {
            // New service worker available
            this.state.isWaiting = true;
            this.state.hasUpdate = true;
          } else {
            // First time installation
            this.state.isActive = true;
          }
          break;
        case 'activating':
          this.state.isWaiting = false;
          break;
        case 'activated':
          this.state.isActive = true;
          this.state.hasUpdate = false;
          break;
        case 'redundant':
          this.state.isInstalling = false;
          this.state.isWaiting = false;
          break;
      }

      this.notifyListeners();
    });
  }

  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();

      this.installPrompt = {
        prompt: async () => {
          await (event as any).prompt();
        },
        userChoice: (event as any).userChoice,
      };

      logger.info('PWA install prompt available');
      this.notifyListeners();
    });

    // Handle app installation
    window.addEventListener('appinstalled', () => {
      logger.info('PWA installed successfully');
      this.installPrompt = null;
      this.notifyListeners();
    });
  }

  private setupUpdateChecker(): void {
    // Check for updates every 30 minutes
    setInterval(async () => {
      await this.checkForUpdates();
    }, 30 * 60 * 1000);

    // Check for updates on page visibility change
    document.addEventListener('visibilitychange', async () => {
      if (!document.hidden) {
        await this.checkForUpdates();
      }
    });
  }

  private handleServiceWorkerMessage(event: MessageEvent): void {
    logger.info('Message received from Service Worker', {
      metadata: { message: event.data },
    });

    // Handle specific message types
    if (event.data?.type === 'CACHE_UPDATED') {
      this.notifyListeners();
    }
  }

  async checkForUpdates(): Promise<void> {
    if (!this.state.registration) {
      return;
    }

    try {
      await this.state.registration.update();
      logger.debug('Service Worker update check completed');
    } catch (error) {
      logger.error('Service Worker update check failed', error as Error);
    }
  }

  async activateUpdate(): Promise<void> {
    if (!this.state.registration?.waiting) {
      logger.warn('No waiting Service Worker to activate');
      return;
    }

    try {
      // Send message to waiting service worker to skip waiting
      this.state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

      logger.info('Service Worker update activation requested');
    } catch (error) {
      logger.error('Failed to activate Service Worker update', error as Error);
      throw error;
    }
  }

  async installPWA(): Promise<'accepted' | 'dismissed' | 'not-available'> {
    if (!this.installPrompt) {
      logger.warn('PWA install prompt not available');
      return 'not-available';
    }

    try {
      await this.installPrompt.prompt();
      const choice = await this.installPrompt.userChoice;

      logger.info('PWA install prompt result', {
        metadata: {
          outcome: choice.outcome,
          platform: choice.platform,
        },
      });

      this.installPrompt = null;
      this.notifyListeners();

      return choice.outcome;
    } catch (error) {
      logger.error('PWA installation failed', error as Error);
      throw error;
    }
  }

  isPWAInstalled(): boolean {
    // Check if running as PWA
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  canInstallPWA(): boolean {
    return this.installPrompt !== null && !this.isPWAInstalled();
  }

  async clearCache(): Promise<void> {
    if (!this.state.registration?.active) {
      throw new Error('No active Service Worker');
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          logger.info('Service Worker cache cleared');
          resolve();
        } else {
          logger.error('Failed to clear Service Worker cache', new Error(event.data.error));
          reject(new Error(event.data.error));
        }
      };

      this.state.registration.active.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );
    });
  }

  async getVersion(): Promise<string> {
    if (!this.state.registration?.active) {
      throw new Error('No active Service Worker');
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.version);
      };

      messageChannel.port1.onerror = (error) => {
        reject(error);
      };

      this.state.registration.active.postMessage(
        { type: 'GET_VERSION' },
        [messageChannel.port2]
      );
    });
  }

  // Event listener management
  addEventListener(event: string, listener: (state: ServiceWorkerState) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  removeEventListener(event: string, listener: (state: ServiceWorkerState) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private notifyListeners(): void {
    const stateChangeListeners = this.listeners.get('statechange') || [];
    stateChangeListeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        logger.error('Service Worker state listener error', error as Error);
      }
    });
  }

  getState(): ServiceWorkerState {
    return { ...this.state };
  }

  // Background sync methods
  async requestBackgroundSync(tag: string): Promise<void> {
    if (!this.state.registration) {
      throw new Error('Service Worker not registered');
    }

    try {
      await this.state.registration.sync.register(tag);
      logger.info('Background sync requested', { metadata: { tag } });
    } catch (error) {
      logger.error('Background sync request failed', error as Error, {
        metadata: { tag },
      });
      throw error;
    }
  }

  // Push notification methods
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    const permission = await Notification.requestPermission();
    logger.info('Notification permission requested', {
      metadata: { permission },
    });

    return permission;
  }

  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!this.state.registration) {
      throw new Error('Service Worker not registered');
    }

    try {
      const subscription = await this.state.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      logger.info('Push notification subscription created');
      return subscription;
    } catch (error) {
      logger.error('Push notification subscription failed', error as Error);
      throw error;
    }
  }

  async unsubscribeFromPushNotifications(): Promise<boolean> {
    if (!this.state.registration) {
      return false;
    }

    try {
      const subscription = await this.state.registration.pushManager.getSubscription();
      if (subscription) {
        const result = await subscription.unsubscribe();
        logger.info('Push notification unsubscribed');
        return result;
      }
      return true;
    } catch (error) {
      logger.error('Push notification unsubscribe failed', error as Error);
      return false;
    }
  }
}

export const serviceWorkerManager = ServiceWorkerManager.getInstance();

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  serviceWorkerManager.initialize().catch((error) => {
    logger.error('Service Worker Manager auto-initialization failed', error);
  });
}

export default serviceWorkerManager;