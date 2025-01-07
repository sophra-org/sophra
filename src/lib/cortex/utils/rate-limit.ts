/**
 * 🚦 Rate Limiter: Your Traffic Control System!
 *
 * Makes sure your system doesn't get too busy.
 * Like having a friendly bouncer that manages the crowd! 🎫
 *
 * Features:
 * - ⏱️ Request timing
 * - 🎯 Token bucket system
 * - 🔄 Automatic refills
 * - 🛡️ Overload protection
 */

/**
 * ⚙️ Rate Limit Configuration
 *
 * Settings for how to control traffic.
 * Like setting up the rules for your bouncer! 📋
 *
 * @interface RateLimitConfig
 * @property {number} interval - How often to refresh tokens
 * @property {number} uniqueTokenPerInterval - How many unique users to track
 */
export interface RateLimitConfig {
  interval: number;
  uniqueTokenPerInterval: number;
}

/**
 * 🎟️ Token Bucket
 *
 * Keeps track of available requests.
 * Like counting how many tickets are left! 🎫
 *
 * @interface TokenBucket
 * @property {number} tokens - How many requests are left
 * @property {number} lastRefill - When we last added more
 */
interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

/**
 * 🎫 Rate Limiter Interface
 *
 * How to talk to the rate limiter.
 * Like the rules your bouncer follows! 📜
 *
 * @interface IRateLimiter
 */
export interface IRateLimiter {
  check: (limit: number, identifier: string) => Promise<void>;
}

/**
 * 🚥 Create Rate Limiter
 *
 * Sets up a new traffic control system.
 * Like hiring a bouncer for your club! 🎪
 *
 * @param {RateLimitConfig} config - How to control traffic
 * @returns {IRateLimiter} Your new traffic controller
 */
export function rateLimit(config: RateLimitConfig): IRateLimiter {
  const tokenCache = new Map<string, TokenBucket>();

  return {
    check: async (limit: number, identifier: string): Promise<void> => {
      const now = Date.now();
      let bucket = tokenCache.get(identifier);

      if (!bucket) {
        bucket = {
          tokens: limit,
          lastRefill: now,
        };
        tokenCache.set(identifier, bucket);
      }

      const timePassed = now - bucket.lastRefill;
      const tokensToAdd = Math.floor(timePassed / config.interval) * limit;

      bucket.tokens = Math.min(limit, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;

      if (bucket.tokens <= 0) {
        throw new Error("Rate limit exceeded");
      }

      bucket.tokens -= 1;
      tokenCache.set(identifier, bucket);

      if (tokenCache.size > config.uniqueTokenPerInterval) {
        const iterator = tokenCache.keys();
        const firstKey = iterator.next();
        if (!firstKey.done && firstKey.value) {
          tokenCache.delete(firstKey.value);
        }
      }
    },
  };
}
