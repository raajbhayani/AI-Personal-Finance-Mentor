import { useState, useEffect, useCallback, useRef } from 'react';
import { CacheManager, apiCache, userDataCache, sessionCache } from '../lib/cache/cacheManager';

interface UseCacheOptions {
  ttl?: number;
  enabled?: boolean;
  staleWhileRevalidate?: boolean;
  cacheInstance?: CacheManager;
}

interface CacheState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  isStale: boolean;
  lastUpdated: number | null;
}

export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCacheOptions = {}
) {
  const {
    ttl,
    enabled = true,
    staleWhileRevalidate = true,
    cacheInstance = apiCache,
  } = options;

  const [state, setState] = useState<CacheState<T>>({
    data: null,
    isLoading: false,
    error: null,
    isStale: false,
    lastUpdated: null,
  });

  const fetcherRef = useRef(fetcher);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Update fetcher ref when it changes
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      // Try to get from cache first
      if (!forceRefresh) {
        const cachedData = await cacheInstance.get(key);
        if (cachedData) {
          setState(prev => ({
            ...prev,
            data: cachedData,
            isLoading: false,
            error: null,
            isStale: false,
            lastUpdated: Date.now(),
          }));

          // If stale-while-revalidate is enabled, still fetch fresh data
          if (!staleWhileRevalidate) {
            return;
          }

          setState(prev => ({ ...prev, isStale: true }));
        }
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const freshData = await fetcherRef.current();

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // Cache the fresh data
      await cacheInstance.set(key, freshData, ttl);

      setState({
        data: freshData,
        isLoading: false,
        error: null,
        isStale: false,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Request was cancelled
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
      }));
    }
  }, [key, enabled, cacheInstance, ttl, staleWhileRevalidate]);

  const invalidate = useCallback(async () => {
    await cacheInstance.delete(key);
    await fetchData(true);
  }, [key, cacheInstance, fetchData]);

  const mutate = useCallback(async (newData: T) => {
    await cacheInstance.set(key, newData, ttl);
    setState(prev => ({
      ...prev,
      data: newData,
      isStale: false,
      lastUpdated: Date.now(),
    }));
  }, [key, cacheInstance, ttl]);

  // Initial fetch
  useEffect(() => {
    fetchData();

    return () => {
      // Cleanup: abort any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  return {
    ...state,
    refetch: () => fetchData(true),
    invalidate,
    mutate,
  };
}

// Hook for caching user-specific data
export function useUserCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: Omit<UseCacheOptions, 'cacheInstance'> = {}
) {
  return useCache(key, fetcher, {
    ...options,
    cacheInstance: userDataCache,
  });
}

// Hook for session-based caching
export function useSessionCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: Omit<UseCacheOptions, 'cacheInstance'> = {}
) {
  return useCache(key, fetcher, {
    ...options,
    cacheInstance: sessionCache,
  });
}

// Hook for API response caching with SWR pattern
export function useSWR<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: UseCacheOptions = {}
) {
  const shouldFetch = key !== null;

  return useCache(
    key || '',
    fetcher,
    {
      ...options,
      enabled: shouldFetch,
      staleWhileRevalidate: true,
    }
  );
}

// Hook for caching with automatic revalidation
export function useAutoRevalidate<T>(
  key: string,
  fetcher: () => Promise<T>,
  interval: number = 30000, // 30 seconds
  options: UseCacheOptions = {}
) {
  const cacheResult = useCache(key, fetcher, options);

  useEffect(() => {
    if (!options.enabled) return;

    const timer = setInterval(() => {
      cacheResult.refetch();
    }, interval);

    return () => clearInterval(timer);
  }, [cacheResult.refetch, interval, options.enabled]);

  return cacheResult;
}

// Hook for optimistic updates
export function useOptimisticCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCacheOptions = {}
) {
  const cacheResult = useCache(key, fetcher, options);

  const optimisticUpdate = useCallback(async (
    optimisticData: T,
    updateFn: () => Promise<T>
  ) => {
    // Immediately update with optimistic data
    await cacheResult.mutate(optimisticData);

    try {
      // Perform the actual update
      const result = await updateFn();
      // Update with real result
      await cacheResult.mutate(result);
      return result;
    } catch (error) {
      // Revert on error
      await cacheResult.invalidate();
      throw error;
    }
  }, [cacheResult]);

  return {
    ...cacheResult,
    optimisticUpdate,
  };
}

// Hook for pagination with caching
export function usePaginatedCache<T>(
  getKey: (page: number, previousData: T[] | null) => string | null,
  fetcher: (page: number) => Promise<T[]>,
  options: UseCacheOptions = {}
) {
  const [pages, setPages] = useState<T[][]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadPage = useCallback(async (page: number) => {
    const key = getKey(page, pages[page - 1] || null);
    if (!key) {
      setHasMore(false);
      return;
    }

    setIsLoadingMore(true);

    try {
      const pageData = await fetcher(page);

      if (pageData.length === 0) {
        setHasMore(false);
      } else {
        // Cache individual page
        await apiCache.set(key, pageData, options.ttl);

        setPages(prev => {
          const newPages = [...prev];
          newPages[page - 1] = pageData;
          return newPages;
        });
      }
    } catch (error) {
      console.error('Error loading page:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [getKey, fetcher, pages, options.ttl]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      loadPage(pages.length + 1);
    }
  }, [loadPage, pages.length, isLoadingMore, hasMore]);

  const reset = useCallback(() => {
    setPages([]);
    setHasMore(true);
    loadPage(1);
  }, [loadPage]);

  // Load first page on mount
  useEffect(() => {
    if (pages.length === 0) {
      loadPage(1);
    }
  }, [loadPage, pages.length]);

  const allData = pages.flat();

  return {
    data: allData,
    pages,
    isLoading: pages.length === 0 && isLoadingMore,
    isLoadingMore,
    hasMore,
    loadMore,
    reset,
  };
}

// Hook for cache statistics and management
export function useCacheStats(cacheInstance: CacheManager = apiCache) {
  const [stats, setStats] = useState(cacheInstance.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(cacheInstance.getStats());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [cacheInstance]);

  const clearCache = useCallback(async () => {
    await cacheInstance.clear();
    setStats(cacheInstance.getStats());
  }, [cacheInstance]);

  return {
    stats,
    clearCache,
  };
}

export default useCache;