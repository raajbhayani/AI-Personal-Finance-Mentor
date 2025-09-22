interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDurationMs?: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blockUntil?: number;
}

export class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      blockDurationMs: 60000, // 1 minute default
      ...config,
    };

    setInterval(() => this.cleanup(), this.config.windowMs);
  }

  async checkLimit(identifier: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    if (entry?.blockUntil && now < entry.blockUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.blockUntil - now) / 1000),
      };
    }

    if (!entry || now >= entry.resetTime) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + this.config.windowMs,
      };
      this.requests.set(identifier, newEntry);

      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: newEntry.resetTime,
      };
    }

    if (entry.count >= this.config.maxRequests) {
      entry.blockUntil = now + (this.config.blockDurationMs || 60000);

      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.blockUntil - now) / 1000),
      };
    }

    entry.count++;

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  private cleanup(): void {
    const now = Date.now();

    for (const [identifier, entry] of this.requests.entries()) {
      if (now >= entry.resetTime && (!entry.blockUntil || now >= entry.blockUntil)) {
        this.requests.delete(identifier);
      }
    }
  }

  getStats(): {
    totalTracked: number;
    activeBlocks: number;
  } {
    const now = Date.now();
    let activeBlocks = 0;

    for (const entry of this.requests.values()) {
      if (entry.blockUntil && now < entry.blockUntil) {
        activeBlocks++;
      }
    }

    return {
      totalTracked: this.requests.size,
      activeBlocks,
    };
  }
}

export const aiRateLimiter = new RateLimiter({
  maxRequests: 20,
  windowMs: 60 * 60 * 1000,
  blockDurationMs: 5 * 60 * 1000,
});

export const conversationRateLimiter = new RateLimiter({
  maxRequests: 50,
  windowMs: 60 * 60 * 1000,
  blockDurationMs: 10 * 60 * 1000,
});

export async function checkRateLimit(
  identifier: string,
  limiter: RateLimiter
): Promise<{
  allowed: boolean;
  headers: Record<string, string>;
  retryAfter?: number;
}> {
  const result = await limiter.checkLimit(identifier);

  const headers = {
    'X-RateLimit-Limit': limiter['config'].maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
  };

  if (result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return {
    allowed: result.allowed,
    headers,
    retryAfter: result.retryAfter,
  };
}