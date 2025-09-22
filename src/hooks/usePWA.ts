import { useState, useEffect, useCallback } from 'react';
import { serviceWorkerManager, ServiceWorkerState } from '../lib/pwa/serviceWorkerManager';
import { logger } from '../lib/logging/structuredLogger';

interface PWAState {
  isSupported: boolean;
  isInstalled: boolean;
  canInstall: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
  isInstalling: boolean;
  serviceWorker: ServiceWorkerState;
}

interface PWAActions {
  install: () => Promise<'accepted' | 'dismissed' | 'not-available'>;
  checkForUpdates: () => Promise<void>;
  activateUpdate: () => Promise<void>;
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => Promise<boolean>;
  clearCache: () => Promise<void>;
}

export function usePWA(): PWAState & PWAActions {
  const [state, setState] = useState<PWAState>({
    isSupported: false,
    isInstalled: false,
    canInstall: false,
    isOnline: navigator?.onLine ?? true,
    hasUpdate: false,
    isInstalling: false,
    serviceWorker: serviceWorkerManager.getState(),
  });

  // Update state from service worker manager
  const updateState = useCallback((swState: ServiceWorkerState) => {
    setState(prev => ({
      ...prev,
      isSupported: swState.isSupported,
      isInstalled: serviceWorkerManager.isPWAInstalled(),
      canInstall: serviceWorkerManager.canInstallPWA(),
      hasUpdate: swState.hasUpdate,
      isInstalling: swState.isInstalling,
      serviceWorker: swState,
    }));
  }, []);

  // Install PWA
  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'not-available'> => {
    try {
      const result = await serviceWorkerManager.installPWA();
      logger.info('PWA installation attempt', { metadata: { result } });
      return result;
    } catch (error) {
      logger.error('PWA installation failed', error as Error);
      throw error;
    }
  }, []);

  // Check for updates
  const checkForUpdates = useCallback(async (): Promise<void> => {
    try {
      await serviceWorkerManager.checkForUpdates();
    } catch (error) {
      logger.error('Update check failed', error as Error);
      throw error;
    }
  }, []);

  // Activate update
  const activateUpdate = useCallback(async (): Promise<void> => {
    try {
      await serviceWorkerManager.activateUpdate();
    } catch (error) {
      logger.error('Update activation failed', error as Error);
      throw error;
    }
  }, []);

  // Enable notifications
  const enableNotifications = useCallback(async (): Promise<boolean> => {
    try {
      const permission = await serviceWorkerManager.requestNotificationPermission();

      if (permission === 'granted') {
        const subscription = await serviceWorkerManager.subscribeToPushNotifications();

        if (subscription) {
          // Send subscription to server
          await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              subscription,
              userAgent: navigator.userAgent,
            }),
          });

          logger.info('Push notifications enabled');
          return true;
        }
      }

      logger.warn('Push notifications not enabled', { metadata: { permission } });
      return false;
    } catch (error) {
      logger.error('Failed to enable notifications', error as Error);
      return false;
    }
  }, []);

  // Disable notifications
  const disableNotifications = useCallback(async (): Promise<boolean> => {
    try {
      const result = await serviceWorkerManager.unsubscribeFromPushNotifications();

      if (result) {
        // Notify server about unsubscription
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        logger.info('Push notifications disabled');
      }

      return result;
    } catch (error) {
      logger.error('Failed to disable notifications', error as Error);
      return false;
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(async (): Promise<void> => {
    try {
      await serviceWorkerManager.clearCache();

      // Also clear browser caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      logger.info('All caches cleared');
    } catch (error) {
      logger.error('Failed to clear cache', error as Error);
      throw error;
    }
  }, []);

  // Set up service worker state listener
  useEffect(() => {
    serviceWorkerManager.addEventListener('statechange', updateState);

    // Initial state update
    updateState(serviceWorkerManager.getState());

    return () => {
      serviceWorkerManager.removeEventListener('statechange', updateState);
    };
  }, [updateState]);

  // Set up online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      logger.info('Application back online');
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      logger.info('Application went offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    ...state,
    install,
    checkForUpdates,
    activateUpdate,
    enableNotifications,
    disableNotifications,
    clearCache,
  };
}

// Hook for handling offline/online state
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Hook for PWA install prompt
export function usePWAInstallPrompt() {
  const [canInstall, setCanInstall] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setCanInstall(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!installPrompt) return null;

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;

      if (choice.outcome === 'accepted') {
        setInstallPrompt(null);
        setCanInstall(false);
      }

      return choice.outcome;
    } catch (error) {
      logger.error('Install prompt failed', error as Error);
      return null;
    }
  }, [installPrompt]);

  return {
    canInstall,
    promptInstall,
  };
}

// Hook for background sync
export function useBackgroundSync() {
  const requestSync = useCallback(async (tag: string) => {
    try {
      await serviceWorkerManager.requestBackgroundSync(tag);
      logger.info('Background sync requested', { metadata: { tag } });
    } catch (error) {
      logger.error('Background sync request failed', error as Error);
      throw error;
    }
  }, []);

  const syncTransactions = useCallback(async () => {
    await requestSync('transaction-sync');
  }, [requestSync]);

  const syncGoals = useCallback(async () => {
    await requestSync('goal-sync');
  }, [requestSync]);

  const syncBudgets = useCallback(async () => {
    await requestSync('budget-sync');
  }, [requestSync]);

  return {
    requestSync,
    syncTransactions,
    syncGoals,
    syncBudgets,
  };
}

// Hook for notification management
export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default'
  );

  const [isSubscribed, setIsSubscribed] = useState(false);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const subscribe = useCallback(async () => {
    try {
      const granted = permission === 'granted' || (await requestPermission()) === 'granted';

      if (granted) {
        const subscription = await serviceWorkerManager.subscribeToPushNotifications();
        setIsSubscribed(!!subscription);
        return !!subscription;
      }

      return false;
    } catch (error) {
      logger.error('Notification subscription failed', error as Error);
      return false;
    }
  }, [permission, requestPermission]);

  const unsubscribe = useCallback(async () => {
    try {
      const result = await serviceWorkerManager.unsubscribeFromPushNotifications();
      setIsSubscribed(!result);
      return result;
    } catch (error) {
      logger.error('Notification unsubscription failed', error as Error);
      return false;
    }
  }, []);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      return new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        ...options,
      });
    }
    return null;
  }, [permission]);

  // Check subscription status on mount
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const swState = serviceWorkerManager.getState();
        if (swState.registration) {
          const subscription = await swState.registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        }
      } catch (error) {
        logger.error('Failed to check notification subscription', error as Error);
      }
    };

    checkSubscription();
  }, []);

  return {
    permission,
    isSubscribed,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
    isSupported: 'Notification' in window,
  };
}

export default usePWA;