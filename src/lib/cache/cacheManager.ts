import { logger } from '../logging/structuredLogger';

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items
  compression?: boolean;
  storage?: 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB';
}

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  size: number;
  accessed: number;
  hits: number;
}

export class CacheManager<T = any> {
  private cache: Map<string, CacheItem<T>> = new Map();
  private options: Required<CacheOptions>;
  private currentSize = 0;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 5 * 60 * 1000, // 5 minutes default
      maxSize: options.maxSize || 100,
      compression: options.compression || false,
      storage: options.storage || 'memory',
    };

    // Initialize persistent storage if needed
    if (this.options.storage !== 'memory') {
      this.initializeStorage();
    }

    // Periodic cleanup
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  async set(key: string, data: T, customTtl?: number): Promise<void> {
    try {
      const ttl = customTtl || this.options.ttl;
      const serialized = this.serialize(data);
      const size = this.getSize(serialized);

      // Check if we need to make space
      if (this.cache.size >= this.options.maxSize) {
        this.evictLRU();
      }

      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        size,
        accessed: Date.now(),
        hits: 0,
      };

      this.cache.set(key, item);
      this.currentSize += size;

      // Persist to storage if configured
      if (this.options.storage !== 'memory') {
        await this.persistToStorage(key, item);
      }

      logger.debug('Cache item set', {
        metadata: {
          cacheKey: key,
          size,
          ttl,
          storage: this.options.storage,
        },
      });
    } catch (error) {
      logger.error('Failed to set cache item', error as Error, {
        metadata: { cacheKey: key },
      });
    }
  }

  async get(key: string): Promise<T | null> {
    try {
      let item = this.cache.get(key);

      // Try to load from persistent storage if not in memory
      if (!item && this.options.storage !== 'memory') {
        item = await this.loadFromStorage(key);
        if (item) {
          this.cache.set(key, item);
        }
      }

      if (!item) {
        return null;
      }

      // Check if expired
      if (this.isExpired(item)) {
        await this.delete(key);
        return null;
      }

      // Update access statistics
      item.accessed = Date.now();
      item.hits++;

      logger.debug('Cache item retrieved', {
        metadata: {
          cacheKey: key,
          hits: item.hits,
          age: Date.now() - item.timestamp,
        },
      });

      return item.data;
    } catch (error) {
      logger.error('Failed to get cache item', error as Error, {
        metadata: { cacheKey: key },
      });
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const item = this.cache.get(key);
      if (item) {
        this.currentSize -= item.size;
        this.cache.delete(key);
      }

      // Remove from persistent storage
      if (this.options.storage !== 'memory') {
        await this.removeFromStorage(key);
      }

      return true;
    } catch (error) {
      logger.error('Failed to delete cache item', error as Error, {
        metadata: { cacheKey: key },
      });
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      this.cache.clear();
      this.currentSize = 0;

      if (this.options.storage !== 'memory') {
        await this.clearStorage();
      }

      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Failed to clear cache', error as Error);
    }
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    return item ? !this.isExpired(item) : false;
  }

  getStats() {
    const stats = {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      currentSize: this.currentSize,
      hitRate: 0,
      averageAge: 0,
      storage: this.options.storage,
    };

    if (this.cache.size > 0) {
      const items = Array.from(this.cache.values());
      const totalHits = items.reduce((sum, item) => sum + item.hits, 0);
      const totalAccesses = items.reduce((sum, item) => sum + Math.max(item.hits, 1), 0);
      const totalAge = items.reduce((sum, item) => sum + (Date.now() - item.timestamp), 0);

      stats.hitRate = totalHits / totalAccesses;
      stats.averageAge = totalAge / this.cache.size;
    }

    return stats;
  }

  private isExpired(item: CacheItem<T>): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.accessed < oldestTime) {
        oldestTime = item.accessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const expiredKeys: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.delete(key));

    if (expiredKeys.length > 0) {
      logger.debug('Cache cleanup completed', {
        metadata: { expiredItems: expiredKeys.length },
      });
    }
  }

  private serialize(data: T): string {
    try {
      const serialized = JSON.stringify(data);
      return this.options.compression ? this.compress(serialized) : serialized;
    } catch (error) {
      throw new Error('Failed to serialize cache data');
    }
  }

  private deserialize(serialized: string): T {
    try {
      const data = this.options.compression ? this.decompress(serialized) : serialized;
      return JSON.parse(data);
    } catch (error) {
      throw new Error('Failed to deserialize cache data');
    }
  }

  private compress(data: string): string {
    // Simple compression using LZ-string or similar
    // For now, returning as-is (implement actual compression if needed)
    return data;
  }

  private decompress(data: string): string {
    // Decompress the data
    return data;
  }

  private getSize(data: string): number {
    return new Blob([data]).size;
  }

  private async initializeStorage(): Promise<void> {
    // Initialize persistent storage based on type
    if (this.options.storage === 'indexedDB') {
      await this.initializeIndexedDB();
    }
  }

  private async persistToStorage(key: string, item: CacheItem<T>): Promise<void> {
    const storageKey = `cache_${key}`;

    switch (this.options.storage) {
      case 'localStorage':
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, JSON.stringify(item));
        }
        break;

      case 'sessionStorage':
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(storageKey, JSON.stringify(item));
        }
        break;

      case 'indexedDB':
        await this.saveToIndexedDB(key, item);
        break;
    }
  }

  private async loadFromStorage(key: string): Promise<CacheItem<T> | null> {
    const storageKey = `cache_${key}`;

    try {
      switch (this.options.storage) {
        case 'localStorage':
          if (typeof window !== 'undefined') {
            const data = localStorage.getItem(storageKey);
            return data ? JSON.parse(data) : null;
          }
          break;

        case 'sessionStorage':
          if (typeof window !== 'undefined') {
            const data = sessionStorage.getItem(storageKey);
            return data ? JSON.parse(data) : null;
          }
          break;

        case 'indexedDB':
          return await this.loadFromIndexedDB(key);
      }
    } catch (error) {
      logger.error('Failed to load from storage', error as Error, {
        metadata: { cacheKey: key, storage: this.options.storage },
      });
    }

    return null;
  }

  private async removeFromStorage(key: string): Promise<void> {
    const storageKey = `cache_${key}`;

    switch (this.options.storage) {
      case 'localStorage':
        if (typeof window !== 'undefined') {
          localStorage.removeItem(storageKey);
        }
        break;

      case 'sessionStorage':
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(storageKey);
        }
        break;

      case 'indexedDB':
        await this.removeFromIndexedDB(key);
        break;
    }
  }

  private async clearStorage(): Promise<void> {
    switch (this.options.storage) {
      case 'localStorage':
        if (typeof window !== 'undefined') {
          Object.keys(localStorage)
            .filter(key => key.startsWith('cache_'))
            .forEach(key => localStorage.removeItem(key));
        }
        break;

      case 'sessionStorage':
        if (typeof window !== 'undefined') {
          Object.keys(sessionStorage)
            .filter(key => key.startsWith('cache_'))
            .forEach(key => sessionStorage.removeItem(key));
        }
        break;

      case 'indexedDB':
        await this.clearIndexedDB();
        break;
    }
  }

  // IndexedDB specific methods
  private async initializeIndexedDB(): Promise<void> {
    if (typeof window === 'undefined') return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open('FinanceAppCache', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      };
    });
  }

  private async saveToIndexedDB(key: string, item: CacheItem<T>): Promise<void> {
    if (typeof window === 'undefined') return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open('FinanceAppCache', 1);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');

        store.put({ key, ...item });

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };

      request.onerror = () => reject(request.error);
    });
  }

  private async loadFromIndexedDB(key: string): Promise<CacheItem<T> | null> {
    if (typeof window === 'undefined') return null;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open('FinanceAppCache', 1);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['cache'], 'readonly');
        const store = transaction.objectStore('cache');
        const getRequest = store.get(key);

        getRequest.onsuccess = () => {
          const result = getRequest.result;
          if (result) {
            const { key: _, ...item } = result;
            resolve(item);
          } else {
            resolve(null);
          }
        };

        getRequest.onerror = () => reject(getRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  }

  private async removeFromIndexedDB(key: string): Promise<void> {
    if (typeof window === 'undefined') return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open('FinanceAppCache', 1);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');

        store.delete(key);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };

      request.onerror = () => reject(request.error);
    });
  }

  private async clearIndexedDB(): Promise<void> {
    if (typeof window === 'undefined') return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open('FinanceAppCache', 1);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');

        store.clear();

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };

      request.onerror = () => reject(request.error);
    });
  }
}

// Global cache instances for different types of data
export const apiCache = new CacheManager({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 50,
  storage: 'memory',
});

export const userDataCache = new CacheManager({
  ttl: 15 * 60 * 1000, // 15 minutes
  maxSize: 100,
  storage: 'localStorage',
});

export const sessionCache = new CacheManager({
  ttl: 60 * 60 * 1000, // 1 hour
  maxSize: 200,
  storage: 'sessionStorage',
});

export const persistentCache = new CacheManager({
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  maxSize: 500,
  storage: 'indexedDB',
});

export default CacheManager;