import { useCallback, useEffect, useMemo, useRef } from 'react';
import useSWR, { SWRConfiguration, mutate } from 'swr';

// Enhanced API cache configuration
interface ApiCacheConfig extends SWRConfiguration {
  cacheTime?: number;
  staleTime?: number;
  retryCount?: number;
  retryDelay?: number;
  enableBackground?: boolean;
  enablePersistence?: boolean;
  keyPrefix?: string;
}

// Local storage cache for persistence
class PersistentCache {
  private prefix: string;
  private maxAge: number;

  constructor(prefix = 'api_cache_', maxAge = 24 * 60 * 60 * 1000) {
    this.prefix = prefix;
    this.maxAge = maxAge;
  }

  set(key: string, data: any): void {
    try {
      const item = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  get(key: string): any | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      const isExpired = Date.now() - parsed.timestamp > this.maxAge;

      if (isExpired) {
        this.remove(key);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return null;
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }

  clear(): void {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }
}

// Enhanced fetcher with retry logic and error handling
const createFetcher = (retryCount = 3, retryDelay = 1000) => {
  return async (url: string, attempt = 1): Promise<any> => {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status >= 500 && attempt < retryCount) {
          // Retry on server errors
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          return createFetcher(retryCount, retryDelay)(url, attempt + 1);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (attempt < retryCount && (error as Error).name === 'TypeError') {
        // Retry on network errors
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        return createFetcher(retryCount, retryDelay)(url, attempt + 1);
      }
      throw error;
    }
  };
};

// Main cache hook
export function useApiCache<T>(
  key: string | null,
  config: ApiCacheConfig = {}
) {
  const {
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 60 * 1000, // 1 minute
    retryCount = 3,
    retryDelay = 1000,
    enableBackground = true,
    enablePersistence = false,
    keyPrefix = 'api_',
    ...swrConfig
  } = config;

  const persistentCache = useMemo(() =>
    enablePersistence ? new PersistentCache(keyPrefix, cacheTime) : null,
    [enablePersistence, keyPrefix, cacheTime]
  );

  const fetcher = useMemo(() =>
    createFetcher(retryCount, retryDelay),
    [retryCount, retryDelay]
  );

  const cacheKey = key ? `${keyPrefix}${key}` : null;

  // Get initial data from persistent cache
  const initialData = useMemo(() => {
    if (!enablePersistence || !persistentCache || !cacheKey) return undefined;
    return persistentCache.get(cacheKey);
  }, [enablePersistence, persistentCache, cacheKey]);

  const swrResult = useSWR<T>(
    cacheKey,
    fetcher,
    {
      fallbackData: initialData,
      refreshInterval: enableBackground ? staleTime : 0,
      dedupingInterval: staleTime,
      focusThrottleInterval: staleTime,
      revalidateOnMount: !initialData,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      errorRetryCount: retryCount,
      errorRetryInterval: retryDelay,
      ...swrConfig,
      onSuccess: (data) => {
        // Save to persistent cache
        if (enablePersistence && persistentCache && cacheKey) {
          persistentCache.set(cacheKey, data);
        }
        swrConfig.onSuccess?.(data, cacheKey, swrConfig);
      },
    }
  );

  // Prefetch related data
  const prefetch = useCallback((prefetchKey: string) => {
    const fullKey = `${keyPrefix}${prefetchKey}`;
    mutate(fullKey, fetcher(fullKey), false);
  }, [fetcher, keyPrefix]);

  // Invalidate cache
  const invalidate = useCallback((invalidateKey?: string) => {
    const fullKey = invalidateKey ? `${keyPrefix}${invalidateKey}` : cacheKey;
    if (fullKey) {
      mutate(fullKey, undefined, true);
      if (enablePersistence && persistentCache) {
        persistentCache.remove(fullKey.replace(keyPrefix, ''));
      }
    }
  }, [cacheKey, enablePersistence, persistentCache, keyPrefix]);

  // Update cache manually
  const updateCache = useCallback((data: T, updateKey?: string) => {
    const fullKey = updateKey ? `${keyPrefix}${updateKey}` : cacheKey;
    if (fullKey) {
      mutate(fullKey, data, false);
      if (enablePersistence && persistentCache) {
        persistentCache.set(fullKey.replace(keyPrefix, ''), data);
      }
    }
  }, [cacheKey, enablePersistence, persistentCache, keyPrefix]);

  return {
    ...swrResult,
    prefetch,
    invalidate,
    updateCache,
    isStale: swrResult.data && !swrResult.isValidating &&
      Date.now() - (swrResult.mutate as any).lastModified > staleTime,
  };
}

// Specialized hooks for different types of data
export function useTransactions(userId?: string, params?: Record<string, any>) {
  const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
  const key = userId ? `transactions/${userId}${queryString}` : null;

  return useApiCache(key, {
    cacheTime: 10 * 60 * 1000, // 10 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes
    enablePersistence: true,
    retryCount: 2,
  });
}

export function useBudgets(userId?: string) {
  const key = userId ? `budgets/${userId}` : null;

  return useApiCache(key, {
    cacheTime: 15 * 60 * 1000, // 15 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes
    enablePersistence: true,
  });
}

export function useGoals(userId?: string) {
  const key = userId ? `goals/${userId}` : null;

  return useApiCache(key, {
    cacheTime: 20 * 60 * 1000, // 20 minutes
    staleTime: 10 * 60 * 1000, // 10 minutes
    enablePersistence: true,
  });
}

export function useUserProfile(userId?: string) {
  const key = userId ? `profile/${userId}` : null;

  return useApiCache(key, {
    cacheTime: 60 * 60 * 1000, // 1 hour
    staleTime: 30 * 60 * 1000, // 30 minutes
    enablePersistence: true,
    revalidateOnFocus: false,
  });
}

export function useDashboardData(userId?: string) {
  const key = userId ? `dashboard/${userId}` : null;

  return useApiCache(key, {
    cacheTime: 5 * 60 * 1000, // 5 minutes
    staleTime: 60 * 1000, // 1 minute
    enableBackground: true,
    retryCount: 3,
  });
}

// Background sync hook for offline support
export function useBackgroundSync() {
  const syncQueue = useRef<Array<{ key: string; data: any; timestamp: number }>>([]);
  const isOnline = useRef(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => {
      isOnline.current = true;
      // Process sync queue
      syncQueue.current.forEach(({ key, data }) => {
        mutate(key, data, true);
      });
      syncQueue.current = [];
    };

    const handleOffline = () => {
      isOnline.current = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const queueSync = useCallback((key: string, data: any) => {
    if (!isOnline.current) {
      syncQueue.current.push({ key, data, timestamp: Date.now() });
    }
  }, []);

  return {
    isOnline: isOnline.current,
    queueSync,
    pendingSync: syncQueue.current.length,
  };
}

// Cache warming utility
export function useCacheWarming() {
  const warm = useCallback((keys: string[], userId?: string) => {
    if (!userId) return;

    keys.forEach(key => {
      const fullKey = `api_${key.replace('{userId}', userId)}`;
      // Prefetch without triggering UI updates
      mutate(fullKey, createFetcher()(fullKey), false);
    });
  }, []);

  return { warm };
}

// Performance monitoring for cache
export function useCacheMetrics() {
  const metrics = useRef({
    hits: 0,
    misses: 0,
    errors: 0,
    totalRequests: 0,
  });

  const recordHit = useCallback(() => {
    metrics.current.hits++;
    metrics.current.totalRequests++;
  }, []);

  const recordMiss = useCallback(() => {
    metrics.current.misses++;
    metrics.current.totalRequests++;
  }, []);

  const recordError = useCallback(() => {
    metrics.current.errors++;
    metrics.current.totalRequests++;
  }, []);

  const getMetrics = useCallback(() => {
    const { hits, misses, errors, totalRequests } = metrics.current;
    return {
      hitRate: totalRequests > 0 ? hits / totalRequests : 0,
      errorRate: totalRequests > 0 ? errors / totalRequests : 0,
      totalRequests,
      hits,
      misses,
      errors,
    };
  }, []);

  const resetMetrics = useCallback(() => {
    metrics.current = { hits: 0, misses: 0, errors: 0, totalRequests: 0 };
  }, []);

  return {
    recordHit,
    recordMiss,
    recordError,
    getMetrics,
    resetMetrics,
  };
}