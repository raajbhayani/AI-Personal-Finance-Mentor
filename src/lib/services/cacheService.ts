interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  tags: string[];
}

interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  cleanupInterval: number;
}

export class MemoryCacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 300000, // 5 minutes
      maxSize: 1000,
      cleanupInterval: 60000, // 1 minute
      ...config,
    };

    this.startCleanupTimer();
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (this.isExpired(entry)) {
      this.delete(key);
      return null;
    }

    return entry.data;
  }

  async set<T>(
    key: string,
    data: T,
    options: {
      ttl?: number;
      tags?: string[];
    } = {}
  ): Promise<void> {
    const ttl = options.ttl || this.config.defaultTTL;
    const tags = options.tags || [];

    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      tags,
    };

    this.cache.set(key, entry);

    tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    });
  }

  async delete(key: string): Promise<boolean> {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    entry.tags.forEach(tag => {
      const tagKeys = this.tagIndex.get(tag);
      if (tagKeys) {
        tagKeys.delete(key);
        if (tagKeys.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    });

    return this.cache.delete(key);
  }

  async invalidateByTag(tag: string): Promise<number> {
    const keysToInvalidate = this.tagIndex.get(tag);

    if (!keysToInvalidate) {
      return 0;
    }

    let invalidatedCount = 0;

    keysToInvalidate.forEach(key => {
      if (this.cache.delete(key)) {
        invalidatedCount++;
      }
    });

    this.tagIndex.delete(tag);

    keysToInvalidate.forEach(key => {
      const entry = this.cache.get(key);
      if (entry) {
        entry.tags.forEach(entryTag => {
          if (entryTag !== tag) {
            const otherTagKeys = this.tagIndex.get(entryTag);
            if (otherTagKeys) {
              otherTagKeys.delete(key);
            }
          }
        });
      }
    });

    return invalidatedCount;
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.tagIndex.clear();
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: {
      ttl?: number;
      tags?: string[];
    } = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const data = await factory();
    await this.set(key, data, options);

    return data;
  }

  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    memoryUsage: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: 0, // Would need hit/miss tracking for accurate calculation
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.delete(key));
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private estimateMemoryUsage(): number {
    let size = 0;

    for (const [key, entry] of this.cache.entries()) {
      size += key.length * 2; // Approximate string size
      size += JSON.stringify(entry.data).length * 2;
      size += 64; // Approximate overhead
    }

    return size;
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
}

export class AnalyticsCacheService {
  private cache: MemoryCacheService;

  constructor() {
    this.cache = new MemoryCacheService({
      defaultTTL: 600000, // 10 minutes for analytics
      maxSize: 500,
      cleanupInterval: 120000, // 2 minutes
    });
  }

  async getMonthlyReport(userId: string, year: number, month: number): Promise<any | null> {
    const key = `monthly_report:${userId}:${year}:${month}`;
    return this.cache.get(key);
  }

  async setMonthlyReport(userId: string, year: number, month: number, data: any): Promise<void> {
    const key = `monthly_report:${userId}:${year}:${month}`;
    await this.cache.set(key, data, {
      ttl: 1800000, // 30 minutes
      tags: [`user:${userId}`, 'monthly_reports', 'financial_data'],
    });
  }

  async getSpendingPatterns(userId: string, timeframe: string, months: number): Promise<any | null> {
    const key = `spending_patterns:${userId}:${timeframe}:${months}`;
    return this.cache.get(key);
  }

  async setSpendingPatterns(userId: string, timeframe: string, months: number, data: any): Promise<void> {
    const key = `spending_patterns:${userId}:${timeframe}:${months}`;
    await this.cache.set(key, data, {
      ttl: 900000, // 15 minutes
      tags: [`user:${userId}`, 'spending_patterns', 'financial_data'],
    });
  }

  async getBudgetComparison(userId: string, budgetId?: string): Promise<any | null> {
    const key = `budget_comparison:${userId}:${budgetId || 'current'}`;
    return this.cache.get(key);
  }

  async setBudgetComparison(userId: string, data: any, budgetId?: string): Promise<void> {
    const key = `budget_comparison:${userId}:${budgetId || 'current'}`;
    await this.cache.set(key, data, {
      ttl: 300000, // 5 minutes (more frequent updates for budgets)
      tags: [`user:${userId}`, 'budget_data', 'financial_data'],
    });
  }

  async getGoalProgress(userId: string, filters: string): Promise<any | null> {
    const key = `goal_progress:${userId}:${filters}`;
    return this.cache.get(key);
  }

  async setGoalProgress(userId: string, filters: string, data: any): Promise<void> {
    const key = `goal_progress:${userId}:${filters}`;
    await this.cache.set(key, data, {
      ttl: 600000, // 10 minutes
      tags: [`user:${userId}`, 'goal_data', 'financial_data'],
    });
  }

  async getFinancialSummary(userId: string): Promise<any | null> {
    const key = `financial_summary:${userId}`;
    return this.cache.get(key);
  }

  async setFinancialSummary(userId: string, data: any): Promise<void> {
    const key = `financial_summary:${userId}`;
    await this.cache.set(key, data, {
      ttl: 300000, // 5 minutes
      tags: [`user:${userId}`, 'financial_summary', 'financial_data'],
    });
  }

  async invalidateUserData(userId: string): Promise<void> {
    await this.cache.invalidateByTag(`user:${userId}`);
  }

  async invalidateFinancialData(): Promise<void> {
    await this.cache.invalidateByTag('financial_data');
  }

  async invalidateBudgetData(): Promise<void> {
    await this.cache.invalidateByTag('budget_data');
  }

  async invalidateGoalData(): Promise<void> {
    await this.cache.invalidateByTag('goal_data');
  }

  async warmupCache(userId: string): Promise<void> {
    // Pre-populate cache with common queries
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Warm up current month report
    try {
      const { AnalyticsService } = await import('./analyticsService');
      const analyticsService = new AnalyticsService(userId);

      const monthlyReport = await analyticsService.generateMonthlyReport(currentYear, currentMonth);
      await this.setMonthlyReport(userId, currentYear, currentMonth, monthlyReport);

      const spendingPatterns = await analyticsService.analyzeSpendingPatterns('monthly', 12);
      await this.setSpendingPatterns(userId, 'monthly', 12, spendingPatterns);
    } catch (error) {
      console.warn('Cache warmup failed:', error);
    }
  }

  getStats() {
    return this.cache.getStats();
  }

  destroy(): void {
    this.cache.destroy();
  }
}

export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');

  return `${prefix}:${sortedParams}`;
}

export function shouldCacheResponse(data: any, requestTime: number): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }

  if (requestTime > 5000) {
    return true;
  }

  if (Array.isArray(data) && data.length > 100) {
    return true;
  }

  const dataSize = JSON.stringify(data).length;
  return dataSize > 10000;
}

export const analyticsCacheService = new AnalyticsCacheService();